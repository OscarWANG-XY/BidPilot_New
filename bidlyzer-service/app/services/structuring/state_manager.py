# state_manager_v2.py - FastAPI集成的状态管理器
# 提供状态转换、事件发布和Redis集成功能

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.core.redis_helper import RedisClient
from app.services.structuring.storage import Storage
from app.services.structuring.cache import Cache
from app.services.structuring.schema import AgentStateData, StateUpdateEvent, ProcessingProgressEvent, ErrorEvent
from .state import (
    SystemInternalState, UserVisibleState, ProcessingStep, UserAction,
    StateRegistry, INTERNAL_TO_USER_STATE_MAP,
    StateTransitionError, InvalidActionError, ProcessingError
)

from app.services.structuring.storage import Storage

import logging
logger = logging.getLogger(__name__)


class StructuringAgentStateManager:
    """文档结构化Agent状态管理器"""
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.sse_channel_prefix = "sse:structuring:"
        # self.cache_keys = self._build_cache_keys()
        self.cache_expire_time = 9000
        self.max_message_history = 100  # 最大消息历史记录数
        self.storage = Storage(project_id)
        self.cache = Cache(project_id)
    
    # def _build_cache_keys(self) -> Dict[str, str]:
    #     """缓存键"""
    #     return {
    #         'agent_state': f"structuring:agent:state:{self.project_id}",
    #         'agent_state_history': f"structuring:agent:state_history:{self.project_id}",
    #         'sse_message_log': f"structuring:sse_message:{self.project_id}",
    #         'raw_document': f"structuring:doc:{self.project_id}:original",
    #         'h1_document': f"structuring:doc:{self.project_id}:h1",
    #         'h2h3_document': f"structuring:doc:{self.project_id}:h2h3", 
    #         'intro_document': f"structuring:doc:{self.project_id}:intro",
    #         'final_document': f"structuring:doc:{self.project_id}:final",
    #         'review_suggestions': f"structuring:doc:{self.project_id}:suggestions",
    #     }
    
    # 状态初始化 + 状态转换 
    async def initialize_agent(self) -> AgentStateData:
        """
        初始化Agent状态并直接开始文档提取
        
        注意：文件上传由Django完成，微服务从文档提取开始
        """
        try:
            # # 清理之前的消息历史
            # await self.clear_message_history()
            
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
            await self.cache.add_agent_state_to_history(agent_state)
            
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
        document_data: Optional[Dict[str, Any]] = None,
        suggestions_data: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """状态转换"""
        try:
            agent_state = await self.cache.get_agent_state()
            if not agent_state:
                logger.error(f"未找到项目{self.project_id}的agent状态")
                return False
            
            # 验证状态转换是否合法
            if not self._is_valid_transition(agent_state.current_internal_state, target_internal_state):
                logger.error(f"状态转换不合法: {agent_state.current_internal_state} -> {target_internal_state}")
                raise StateTransitionError(f"状态转换不合法: {agent_state.current_internal_state} -> {target_internal_state}")
            
            # 更新状态
            agent_state.current_internal_state = target_internal_state
            agent_state.current_user_state = INTERNAL_TO_USER_STATE_MAP[target_internal_state]
            agent_state.updated_at = datetime.now()
            
            # 更新进度
            if progress is not None:
                agent_state.overall_progress = max(0, min(100, progress))
            
            print(f"更新进度完成: {agent_state.overall_progress}")

            # 存储结果数据
            if document_data:
                await self.cache.store_step_result(agent_state, document_data, "document")
            print(f"存储结果数据完成: {type(document_data)}")


            if suggestions_data:
                await self.cache.store_step_result(agent_state, suggestions_data, "suggestions")
            print(f"建议文档存储完成: {type(suggestions_data)}")


            # 清除错误信息（如果成功转换）
            if target_internal_state != SystemInternalState.FAILED:
                agent_state.error_message = None
                agent_state.retry_count = 0
            
            # 保存状态
            await self.cache.add_agent_state_to_history(agent_state)
            print(f"存储agent_state完成: {agent_state}")

            # 发布状态更新事件
            await self._publish_state_update(agent_state, message)
            print(f"发布状态更新事件完成: {agent_state}")
            
            
            logger.info(f"State transition successful: {self.project_id} -> {target_internal_state}")
            return True
            
        except Exception as e:
            logger.error(f"Error in state transition: {str(e)}")
            await self._handle_error("state_transition_error", str(e))
            return False
    


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
            await self.cache.add_agent_sse_message_to_history(
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
            agent_state = await self.cache.get_agent_state()
            await self.cache.add_agent_sse_message_to_history(
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
    

    # 错误处理
    async def _handle_error(self, error_type: str, error_message: str):
        """处理错误"""
        try:
            # 更新状态为失败
            agent_state = await self.cache.get_agent_state()
            if agent_state:
                agent_state.current_internal_state = SystemInternalState.FAILED
                agent_state.current_user_state = UserVisibleState.FAILED
                agent_state.error_message = error_message
                agent_state.retry_count += 1
                agent_state.updated_at = datetime.now()
                
                await self.cache.add_agent_state_to_history(agent_state)
            
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
            await self.cache.add_agent_sse_message_to_history(
                event_type="error",
                event_data=error_event.model_dump()
            )
            
        except Exception as e:
            logger.error(f"Error handling error: {str(e)}")
    

    # # =============== 用户操作处理器 ===============
    # async def handle_user_action(
    #     self, 
    #     action: UserAction, 
    #     payload: Optional[Dict[str, Any]] = None
    # ) -> bool:
    #     """处理用户操作"""
    #     try:
    #         agent_state = await self.cache.get_agent_state()
    #         if not agent_state:
    #             logger.error(f"Agent state not found for project {self.project_id}")
    #             return False
            
    #         # 验证操作是否有效
    #         if not self._is_valid_action(agent_state.current_internal_state, action):
    #             logger.error(f"Invalid action {action} in state {agent_state.current_internal_state}")
    #             raise InvalidActionError(f"Action {action} not allowed in state {agent_state.current_internal_state}")
            
    #         # 根据操作类型处理
    #         success = False
            
    #         if action == UserAction.COMPLETE_EDITING:
    #             success = await self._handle_complete_editing(agent_state, payload)
                
    #         elif action == UserAction.RETRY:
    #             success = await self._handle_retry(agent_state)
                
    #         elif action == UserAction.CANCEL:
    #             success = await self._handle_cancel(agent_state)
            
    #         return success
            
    #     except Exception as e:
    #         logger.error(f"Error handling user action {action}: {str(e)}")
    #         await self._handle_error("user_action_error", str(e))
    #         return False
    
    # async def _handle_complete_editing(self, agent_state: AgentStateData, payload: Optional[Dict[str, Any]]) -> bool:
    #     """处理完成编辑操作"""
    #     if not payload or "document" not in payload:
    #         logger.error("Missing document data in complete editing payload")
    #         return False
        
    #     return await self.transition_to_state(
    #         SystemInternalState.COMPLETED,
    #         progress=100,
    #         message="文档编辑完成",
    #         result_data=payload["document"]
    #     )
    
    # async def _handle_restart_from_beginning(self, agent_state: AgentStateData) -> bool:
    #     """处理重试操作"""
    #     """从文档提取步骤开始重试（回退方案）"""
    #     try:
    #         success = await self.transition_to_state(
    #             SystemInternalState.EXTRACTING_DOCUMENT,
    #             progress=0,
    #             message="重试操作，从文档提取开始重新分析"
    #         )
            
    #         if success:
    #             from .agent import create_or_get_agent
    #             await create_or_get_agent(self.project_id)

    #         return success
    #     except Exception as e:
    #         logger.error(f"从提取步骤重试失败: {str(e)}")
    #         return False
    
    # async def _handle_cancel(self, agent_state: AgentStateData) -> bool:
    #     """处理取消操作"""
    #     return await self.transition_to_state(
    #         SystemInternalState.FAILED,
    #         message="操作已取消"
    #     )



# ========================= 全局实例 =========================

# 注意：这里不再创建全局实例，因为每个项目需要独立的状态管理器
# 使用工厂函数或在需要时创建实例
def create_state_manager(project_id: str) -> StructuringAgentStateManager:
    """创建状态管理器实例"""
    return StructuringAgentStateManager(project_id) 