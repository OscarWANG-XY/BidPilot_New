# state_manager_v2.py - FastAPI集成的状态管理器
# 提供状态转换、事件发布和Redis集成功能

from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncio
import json
from pydantic import BaseModel, Field, ConfigDict

from app.core.cache_manager import CacheManager
from app.core.redis_helper import RedisClient
from .state import (
    SystemInternalState, UserVisibleState, ProcessingStep, UserAction,
    StateRegistry, INTERNAL_TO_USER_STATE_MAP,
    StateTransitionError, InvalidActionError, ProcessingError
)
from .sse_message import (
    StateUpdateEvent, ProcessingProgressEvent, ErrorEvent, SSEMessageRecord, SSEMessageHistory
)

import logging
logger = logging.getLogger(__name__)

# ========================= 状态数据模型 =========================

class AgentStateData(BaseModel):
    """Agent状态数据模型"""
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    project_id: str
    current_internal_state: SystemInternalState   # 每个state 都有对应的state_config在state.py中定义了。 
    current_user_state: UserVisibleState          
    
    # 进度相关
    overall_progress: int = Field(default=0, ge=0, le=100)
    step_progress: Dict[ProcessingStep, int] = Field(default_factory=dict)
    
    # 时间戳
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 处理相关
    current_step: Optional[ProcessingStep] = None       
    error_message: Optional[str] = None
    retry_count: int = 0
    
    # 步骤结果存在标记 - 表示对应文档是否已生成并存储
    has_extracted_content: bool = Field(default=False, description="是否已提取文档内容")
    has_h1_analysis_result: bool = Field(default=False, description="是否已完成H1分析")
    has_h2h3_analysis_result: bool = Field(default=False, description="是否已完成H2H3分析")
    has_introduction_content: bool = Field(default=False, description="是否已添加引言内容")
    has_final_document: bool = Field(default=False, description="是否已生成最终文档")


class AgentStateHistory(BaseModel):
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    project_id:str
    agent_states: List[AgentStateData] = Field(default_factory=list)
    total_states: int = Field(default=0)
    last_updated: datetime = Field(default_factory=datetime.now)
    
    def __str__(self) -> str:
        """简单的打印方法"""
        return (f"AgentStateHistory(project_id={self.project_id}, "
                f"total_states={self.total_states}, "
                f"last_updated={self.last_updated.strftime('%Y-%m-%d %H:%M:%S')})")

# ========================= 状态管理器 =========================

class StructuringAgentStateManager:
    """文档结构化Agent状态管理器"""
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.sse_channel_prefix = "sse:structuring:"
        self.cache_keys = self._build_cache_keys()
        self.cache_expire_time = 900
        self.max_message_history = 100  # 最大消息历史记录数
    
    def _build_cache_keys(self) -> Dict[str, str]:
        """缓存键"""
        return {
            'agent_state': f"structuring:agent:state:{self.project_id}",
            'agent_state_history': f"structuring:agent:state_history:{self.project_id}",
            'raw_document': f"structuring:doc:{self.project_id}:original",
            'h1_document': f"structuring:doc:{self.project_id}:h1",
            'h2h3_document': f"structuring:doc:{self.project_id}:h2h3", 
            'intro_document': f"structuring:doc:{self.project_id}:intro",
            'final_document': f"structuring:doc:{self.project_id}:final",
            'edited_document': f"structuring:doc:{self.project_id}:edited",
            'sse_message_log': f"structuring:sse_message:{self.project_id}"
        }
    
    def _generate_message_id(self) -> str:
        """生成消息唯一标识"""
        import uuid
        return f"{self.project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"

    # 状态初始化 + 状态转换 
    async def initialize_agent(self) -> AgentStateData:
        """
        初始化Agent状态并直接开始文档提取
        
        注意：文件上传由Django完成，微服务从文档提取开始
        """
        try:
            # 清理之前的消息历史
            await self.clear_message_history()
            
            # 初始状态改为文档提取
            initial_internal_state = SystemInternalState.EXTRACTING_DOCUMENT
            initial_user_state = INTERNAL_TO_USER_STATE_MAP[initial_internal_state]
            
            agent_state = AgentStateData(
                project_id=self.project_id,
                current_internal_state=initial_internal_state,
                current_user_state=initial_user_state,
                step_progress={ProcessingStep.EXTRACT: 0}  # 初始化提取步骤
            )
            
            # 保存到Redis
            await self._save_agent_state(agent_state)
            
            # 发送初始状态事件
            await self._publish_state_update(agent_state, "开始分析已上传的文档...")
            
            logger.info(f"Initialized structuring agent for project {self.project_id}, starting document extraction")
            return agent_state
            
        except Exception as e:
            logger.error(f"Error initializing agent for project {self.project_id}: {str(e)}")
            raise ProcessingError(f"Failed to initialize agent: {str(e)}")
    
    async def transition_to_state(
        self, 
        target_internal_state: SystemInternalState,
        progress: Optional[int] = None,
        message: Optional[str] = None,
        result_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """状态转换"""
        try:
            agent_state = await self.get_agent_state()
            if not agent_state:
                logger.error(f"Agent state not found for project {self.project_id}")
                return False
            
            # 验证状态转换是否合法
            if not self._is_valid_transition(agent_state.current_internal_state, target_internal_state):
                logger.error(f"Invalid state transition from {agent_state.current_internal_state} to {target_internal_state}")
                raise StateTransitionError(f"Invalid transition from {agent_state.current_internal_state} to {target_internal_state}")
            
            # 更新状态
            agent_state.current_internal_state = target_internal_state
            agent_state.current_user_state = INTERNAL_TO_USER_STATE_MAP[target_internal_state]
            agent_state.updated_at = datetime.now()
            
            # 更新进度
            if progress is not None:
                agent_state.overall_progress = max(0, min(100, progress))
            
            # 存储结果数据
            if result_data:
                await self._store_step_result(agent_state, target_internal_state, result_data)
            
            # 清除错误信息（如果成功转换）
            if target_internal_state != SystemInternalState.FAILED:
                agent_state.error_message = None
                agent_state.retry_count = 0
            
            # 保存状态
            await self._save_agent_state(agent_state)
            
            # 发布状态更新事件
            await self._publish_state_update(agent_state, message)
            
            # 检查是否需要自动转换到下一状态
            await self._check_auto_transition(agent_state)
            
            logger.info(f"State transition successful: {self.project_id} -> {target_internal_state}")
            return True
            
        except Exception as e:
            logger.error(f"Error in state transition: {str(e)}")
            await self._handle_error("state_transition_error", str(e))
            return False
    

    # 存储：缓存&持久化处理
    async def _save_agent_state(self, agent_state: AgentStateData) -> bool:
        """保存Agent状态到Redis并记录历史"""
        try:
            agent_state_key = self.cache_keys.get('agent_state')
            # 使用 mode='json' 确保正确的 JSON 序列化，包括 datetime 字段
            agent_state_data = agent_state.model_dump(mode='json')
            
            # 保存当前状态
            success = await RedisClient.set(agent_state_key, agent_state_data, expire=self.cache_expire_time)
            
            if success:
                # 保存状态历史
                await self._save_agent_state_history(agent_state)
                logger.debug(f"成功保存 agent 状态到 Redis，项目号为： {agent_state.project_id}")
            else:
                logger.error(f"保存 agent 状态到 Redis 失败，项目号为： {agent_state.project_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error saving agent state: {str(e)}")
            return False

    async def _save_agent_state_history(self, agent_state: AgentStateData) -> bool:
        """保存Agent状态历史记录"""
        try:
            # 获取现有历史记录
            state_history = await self._get_agent_state_history()
            if not state_history:
                state_history = AgentStateHistory(project_id=self.project_id)
            
            # 创建当前状态的副本并添加到历史记录
            state_copy = AgentStateData(**agent_state.model_dump())
            state_history.agent_states.append(state_copy)
            state_history.total_states = len(state_history.agent_states)
            state_history.last_updated = datetime.now()
            
            # 限制历史记录数量，保留最新的50条记录
            max_history_records = 50
            if len(state_history.agent_states) > max_history_records:
                state_history.agent_states = state_history.agent_states[-max_history_records:]
                state_history.total_states = len(state_history.agent_states)
            
            # 保存历史记录到Redis
            history_key = self.cache_keys.get('agent_state_history')
            history_data = state_history.model_dump(mode='json')
            
            success = await RedisClient.set(history_key, history_data, expire=self.cache_expire_time)
            
            if success:
                logger.debug(f"成功保存状态历史记录，项目号：{self.project_id}，历史记录数：{state_history.total_states}")
            else:
                logger.error(f"保存状态历史记录失败，项目号：{self.project_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"保存状态历史记录时出错: {str(e)}")
            return False

    async def _get_agent_state_history(self) -> Optional[AgentStateHistory]:
        """获取Agent状态历史记录"""
        try:
            history_key = self.cache_keys.get('agent_state_history')
            history_data = await RedisClient.get(history_key)
            
            if history_data:
                return AgentStateHistory(**history_data)
            return None
            
        except Exception as e:
            logger.error(f"获取状态历史记录失败: {str(e)}")
            return None

    async def get_agent_state_history(self, limit: Optional[int] = None) -> List[AgentStateData]:
        """获取Agent状态历史记录（公共接口）"""
        try:
            state_history = await self._get_agent_state_history()
            if not state_history or not state_history.agent_states:
                return []
            
            # 按时间排序（最新的在前）
            sorted_states = sorted(
                state_history.agent_states,
                key=lambda x: x.updated_at,
                reverse=True
            )
            
            # 限制返回数量
            if limit:
                sorted_states = sorted_states[:limit]
            
            return sorted_states
            
        except Exception as e:
            logger.error(f"获取状态历史记录失败: {str(e)}")
            return []

    async def clear_agent_state_history(self) -> bool:
        """清除Agent状态历史记录"""
        try:
            history_key = self.cache_keys.get('agent_state_history')
            return await RedisClient.delete(history_key)
        except Exception as e:
            logger.error(f"清除状态历史记录失败: {str(e)}")
            return False



    async def _store_step_result(self, agent_state: AgentStateData, state: SystemInternalState, result_data: Dict[str, Any]):
        """存储步骤结果数据"""
        if state == SystemInternalState.DOCUMENT_EXTRACTED:
            agent_state.has_extracted_content = True
            await self._save_document(cache_key=self.cache_keys.get('raw_document'), content=result_data)

        elif state == SystemInternalState.OUTLINE_H1_ANALYZED:
            agent_state.has_h1_analysis_result = True
            await self._save_document(cache_key=self.cache_keys.get('h1_document'), content=result_data)

        elif state == SystemInternalState.OUTLINE_H2H3_ANALYZED:
            agent_state.has_h2h3_analysis_result = True
            await self._save_document(cache_key=self.cache_keys.get('h2h3_document'), content=result_data)
            # await self._delete_document(cache_key=self.cache_keys.get('h1_document'))
            # agent_state.has_h1_analysis_result = False

        elif state == SystemInternalState.INTRODUCTION_ADDED:
            agent_state.has_introduction_content = True
            await self._save_document(cache_key=self.cache_keys.get('intro_document'), content=result_data)
            # await self._delete_document(cache_key=self.cache_keys.get('h2h3_document'))
            # agent_state.has_h2h3_analysis_result = False

        elif state == SystemInternalState.COMPLETED:
            agent_state.has_final_document = True
            await self._save_document(cache_key=self.cache_keys.get('final_document'), content=result_data)
            # await self._delete_document(cache_key=self.cache_keys.get('intro_document'))
            # agent_state.has_introduction_content = False
    
    async def _save_document(self, cache_key: str, content: Dict[str, Any]) -> bool:
        """保存文档数据到Redis"""
        try:
            # 设置15分钟过期时间
            return await RedisClient.set(cache_key, content, expire=self.cache_expire_time)
        except Exception as e:
            logger.error(f"保存文档数据失败 {cache_key}: {str(e)}")
            return False

    async def _delete_document(self, cache_key: str) -> bool:
        """删除文档数据"""
        try:
            return await RedisClient.delete(cache_key)
        except Exception as e:
            logger.error(f"删除文档数据失败 {cache_key}: {str(e)}")
            return False


    # 之前的持久化都是覆盖，而这里的持久化是叠加。 
    async def _store_sse_message(
        self, 
        event_type: str, 
        event_data: Dict[str, Any],
    ) -> bool:
        """存储SSE消息到历史记录"""
        try:
            # 生成消息记录 - 只使用SSEMessageRecord实际支持的字段
            message_record = SSEMessageRecord(
                message_id=self._generate_message_id(),
                project_id=self.project_id,
                event_type=event_type,
                event_data=event_data,
            )
            
            # 获取现有消息历史
            message_history = await self._get_message_history()
            if not message_history:
                message_history = SSEMessageHistory(project_id=self.project_id)
            
            # 添加新消息
            message_history.messages.append(message_record)
            message_history.last_updated = datetime.now()
            message_history.total_messages = len(message_history.messages)
            
            # 限制消息数量，保留最新的消息
            if len(message_history.messages) > self.max_message_history:
                message_history.messages = message_history.messages[-self.max_message_history:]
                message_history.total_messages = len(message_history.messages)
            
            # 保存到Redis
            cache_key = self.cache_keys.get('sse_message_log')
            message_data = message_history.model_dump(mode='json')
            
            success = await RedisClient.set(cache_key, message_data, expire=self.cache_expire_time)
            
            if success:
                logger.debug(f"成功存储SSE消息: {message_record.message_id}")
            else:
                logger.error(f"存储SSE消息失败: {message_record.message_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"存储SSE消息时出错: {str(e)}")
            return False
    
    async def _get_message_history(self) -> Optional[SSEMessageHistory]:
        """获取SSE消息历史记录"""
        try:
            cache_key = self.cache_keys.get('sse_message_log')
            message_data = await RedisClient.get(cache_key)
            
            if message_data:
                return SSEMessageHistory(**message_data)
            return None
            
        except Exception as e:
            logger.error(f"获取SSE消息历史失败: {str(e)}")
            return None

    async def get_message_history_for_recovery(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """获取用于前端恢复的消息历史"""
        try:
            message_history = await self._get_message_history()
            if not message_history or not message_history.messages:
                return []
            
            # 按时间排序（最新的在前）
            sorted_messages = sorted(
                message_history.messages, 
                key=lambda x: x.timestamp, 
                reverse=True
            )
            
            # 限制返回数量
            if limit:
                sorted_messages = sorted_messages[:limit]
            
            # 转换为前端可用的格式
            recovery_messages = []
            for msg in sorted_messages:
                recovery_data = {
                    "message_id": msg.message_id,
                    "event_type": msg.event_type,
                    "timestamp": msg.timestamp.isoformat(),
                    "event_data": msg.event_data
                }
                
                # 从event_data中提取状态快照信息（如果存在）
                if msg.event_data:
                    # 对于state_update事件，状态信息在event_data中
                    if msg.event_type == "state_update" and "internal_state" in msg.event_data:
                        recovery_data["state_snapshot"] = {
                            "internal_state": msg.event_data.get("internal_state"),
                            "user_state": msg.event_data.get("user_state"),
                            "overall_progress": msg.event_data.get("progress"),
                            "current_step": None  # 步骤信息在progress_update事件中
                        }
                    # 对于progress_update事件，包含步骤信息
                    elif msg.event_type == "progress_update" and "step" in msg.event_data:
                        recovery_data["state_snapshot"] = {
                            "internal_state": None,
                            "user_state": None,
                            "overall_progress": msg.event_data.get("progress"),
                            "current_step": msg.event_data.get("step")
                        }
                
                recovery_messages.append(recovery_data)
            
            logger.info(f"返回 {len(recovery_messages)} 条消息历史用于恢复")
            return recovery_messages
            
        except Exception as e:
            logger.error(f"获取恢复消息历史失败: {str(e)}")
            return []
    
    async def clear_message_history(self) -> bool:
        """清除消息历史记录"""
        try:
            cache_key = self.cache_keys.get('sse_message_log')
            return await RedisClient.delete(cache_key)
        except Exception as e:
            logger.error(f"清除消息历史失败: {str(e)}")
            return False



    # 查询
    async def get_agent_state(self) -> Optional[AgentStateData]:
        """获取Agent状态数据"""
        try:
            # 从Redis获取状态数据
            agent_state_key = self.cache_keys.get('agent_state')
            agent_state_data = await RedisClient.get(agent_state_key)
            
            if agent_state_data:
                return AgentStateData(**agent_state_data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting agent state for project {self.project_id}: {str(e)}")
            return None
    
    async def get_user_visible_state(self) -> Optional[UserVisibleState]:
        """获取用户可见状态"""
        agent_state = await self.get_agent_state()
        return agent_state.current_user_state if agent_state else None
    
    async def get_internal_state(self) -> Optional[SystemInternalState]:
        """获取内部状态"""
        agent_state = await self.get_agent_state()
        return agent_state.current_internal_state if agent_state else None

    async def get_document(self, doc_type: str = "final") -> Optional[Dict[str, Any]]:
        """获取指定类型的文档"""
        return await self._get_document(f"{doc_type}_document")

    async def _get_document(self, key_label: str) -> Optional[Dict[str, Any]]:
        """从Redis获取文档数据"""
        cache_key = self.cache_keys.get(key_label)
        if not cache_key:
            return None
        
        try:
            return await RedisClient.get(cache_key)
        except Exception as e:
            logger.error(f"获取文档数据失败 {key_label}: {str(e)}")
            return None

    # ========================= SSE消息存储与检索 =========================
    


    # SSE发布与订阅
    async def _publish_state_update(self, agent_state: AgentStateData, message: Optional[str] = None):
        """发布状态更新事件到Redis SSE通道"""
        try:
            # 获取状态配置
            state_config = StateRegistry.get_state_config(agent_state.current_internal_state)
            
            # 创建状态更新事件， event是一种消息结构体，在这里用于封装一个状态变化的通知。 
            # event是服务端事件（Server-Sent Event, SSE）协议下的数据结构
            event = StateUpdateEvent(
                project_id=agent_state.project_id,
                internal_state=agent_state.current_internal_state,
                user_state=agent_state.current_user_state,
                progress=agent_state.overall_progress,
                message=message or (state_config.description if state_config else "")
            )
            
            # 发布到Redis通道
            channel = f"{self.sse_channel_prefix}{agent_state.project_id}"
            await RedisClient.publish(channel, event.model_dump_json())
            
            # 存储消息到历史记录
            await self._store_sse_message(
                event_type="state_update",
                event_data=event.model_dump()
            )
            
            logger.debug(f"Published state update for project {agent_state.project_id}")
            
        except Exception as e:
            logger.error(f"Error publishing state update: {str(e)}")
    
    async def _publish_progress_update(
        self, 
        step: ProcessingStep, 
        progress: int, 
        estimated_remaining: Optional[int] = None
    ):
        """发布进度更新事件"""
        try:
            event = ProcessingProgressEvent(
                project_id=self.project_id,
                step=step,
                progress=progress,
                estimated_remaining=estimated_remaining
            )
            
            channel = f"{self.sse_channel_prefix}{self.project_id}"
            await RedisClient.publish(channel, event.model_dump_json())
            
            # 存储消息到历史记录
            agent_state = await self.get_agent_state()
            await self._store_sse_message(
                event_type="progress_update",
                event_data=event.model_dump()
            )
            
        except Exception as e:
            logger.error(f"Error publishing progress update: {str(e)}")

   
    # 校验
    def _is_valid_transition(self, current_state: SystemInternalState, target_state: SystemInternalState) -> bool:
        """验证状态转换是否合法"""
        # 允许相同状态的转换（用于更新进度或消息）
        if current_state == target_state:
            return True
            
        # 获取当前状态配置
        current_config = StateRegistry.get_state_config(current_state)
        
        # 失败状态可以转换到任何状态（重试机制）
        if current_state == SystemInternalState.FAILED:
            return True
        
        # 检查是否为配置的下一状态
        if current_config and current_config.next_state == target_state:
            return True
        
        # 允许转换到失败状态
        if target_state == SystemInternalState.FAILED:
            return True
        
        # 允许从任何状态转换到取消状态（如果有的话）
        # 这里可以根据需要添加更多转换规则
        
        logger.debug(f"Invalid transition attempted: {current_state} -> {target_state}")
        return False
    
    def _is_valid_action(self, current_state: SystemInternalState, action: UserAction) -> bool:
        """验证操作是否有效"""
        action_config = StateRegistry.get_action_config(action)
        
        if not action_config:
            return False
        
        return current_state in action_config.get("valid_states", [])

    async def _check_auto_transition(self, agent_state: AgentStateData):
        """检查是否需要自动转换状态"""
        current_config = StateRegistry.get_state_config(agent_state.current_internal_state)
        
        # 禁用自动转换，避免无限循环和状态混乱
        # 所有状态转换应该由业务逻辑显式控制
        logger.debug(f"Auto-transition disabled for state: {agent_state.current_internal_state}")
        return
        
        # 原有的自动转换逻辑已被禁用
        # if current_config and current_config.auto_transition and current_config.next_state:
        #     # 延迟一小段时间后自动转换（模拟处理时间）
        #     await asyncio.sleep(1)
        #     await self.transition_to_state(
        #         agent_state.project_id, 
        #         current_config.next_state,
        #         progress=agent_state.overall_progress
        #     )
    

    # 错误处理
    async def _handle_error(self, error_type: str, error_message: str):
        """处理错误"""
        try:
            # 更新状态为失败
            agent_state = await self.get_agent_state()
            if agent_state:
                agent_state.current_internal_state = SystemInternalState.FAILED
                agent_state.current_user_state = UserVisibleState.FAILED
                agent_state.error_message = error_message
                agent_state.retry_count += 1
                agent_state.updated_at = datetime.now()
                
                await self._save_agent_state(agent_state)
            
            # 发布错误事件
            error_event = ErrorEvent(
                project_id=self.project_id,
                error_type=error_type,
                error_message=error_message,
                can_retry=True
            )
            
            channel = f"{self.sse_channel_prefix}{self.project_id}"
            await RedisClient.publish(channel, error_event.model_dump_json())
            
            # 存储错误消息到历史记录
            await self._store_sse_message(
                event_type="error",
                event_data=error_event.model_dump()
            )
            
        except Exception as e:
            logger.error(f"Error handling error: {str(e)}")
    

    # =============== 用户操作处理器 ===============
    async def handle_user_action(
        self, 
        action: UserAction, 
        payload: Optional[Dict[str, Any]] = None
    ) -> bool:
        """处理用户操作"""
        try:
            agent_state = await self.get_agent_state()
            if not agent_state:
                logger.error(f"Agent state not found for project {self.project_id}")
                return False
            
            # 验证操作是否有效
            if not self._is_valid_action(agent_state.current_internal_state, action):
                logger.error(f"Invalid action {action} in state {agent_state.current_internal_state}")
                raise InvalidActionError(f"Action {action} not allowed in state {agent_state.current_internal_state}")
            
            # 根据操作类型处理
            success = False
            
            if action == UserAction.COMPLETE_EDITING:
                success = await self._handle_complete_editing(agent_state, payload)
                
            elif action == UserAction.RETRY:
                success = await self._handle_retry(agent_state)
                
            elif action == UserAction.CANCEL:
                success = await self._handle_cancel(agent_state)
            
            return success
            
        except Exception as e:
            logger.error(f"Error handling user action {action}: {str(e)}")
            await self._handle_error("user_action_error", str(e))
            return False
    
    async def _handle_complete_editing(self, agent_state: AgentStateData, payload: Optional[Dict[str, Any]]) -> bool:
        """处理完成编辑操作"""
        if not payload or "document" not in payload:
            logger.error("Missing document data in complete editing payload")
            return False
        
        return await self.transition_to_state(
            SystemInternalState.COMPLETED,
            progress=100,
            message="文档编辑完成",
            result_data=payload["document"]
        )
    
    async def _handle_restart_from_beginning(self, agent_state: AgentStateData) -> bool:
        """处理重试操作"""
        """从文档提取步骤开始重试（回退方案）"""
        try:
            success = await self.transition_to_state(
                SystemInternalState.EXTRACTING_DOCUMENT,
                progress=0,
                message="重试操作，从文档提取开始重新分析"
            )
            
            if success:
                from .agent import create_or_get_agent
                await create_or_get_agent(self.project_id)

            return success
        except Exception as e:
            logger.error(f"从提取步骤重试失败: {str(e)}")
            return False
    
    async def _handle_cancel(self, agent_state: AgentStateData) -> bool:
        """处理取消操作"""
        return await self.transition_to_state(
            SystemInternalState.FAILED,
            message="操作已取消"
        )





# ========================= 全局实例 =========================

# 注意：这里不再创建全局实例，因为每个项目需要独立的状态管理器
# 使用工厂函数或在需要时创建实例
def create_state_manager(project_id: str) -> StructuringAgentStateManager:
    """创建状态管理器实例"""
    return StructuringAgentStateManager(project_id) 