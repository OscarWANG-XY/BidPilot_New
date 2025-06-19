# state_manager_v2.py - FastAPI集成的状态管理器
# 提供状态转换、事件发布和Redis集成功能

from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from app.core.redis_helper import RedisClient
from app.services.cache import Cache
from app.services.structuring.schema import StructuringState, StructuringSSEData, StructuringMessage
from .state import (
    StateEnum, ProcessingStep, UserAction,
    StateRegistry, 
    StateTransitionError, ProcessingError,
    ING_STATE_POOL, ED_STATE_POOL
)
# from app.services.broadcast import publish_state_update, publish_error_event

from app.services.storage import Storage

import logging
logger = logging.getLogger(__name__)


class StructuringAgentStateManager:
    """文档结构化Agent状态管理器"""
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        # self.sse_channel_prefix = "sse:structuring:"
        self.cache_expire_time = 9000
        self.max_message_history = 100  # 最大消息历史记录数
        self.storage = Storage(project_id)
        self.cache = Cache(project_id)
    
    # 状态初始化 + 状态转换 
    async def initialize_agent(self, target_state: StateEnum = StateEnum.EXTRACTING_DOCUMENT) -> StructuringState:
        """
        初始化Agent状态并直接开始文档提取
        
        注意：文件上传由Django完成，微服务从文档提取开始
        target_state的初始化，用于测试，而不是在实际业务中使用。 
        """
        try:
            # # 清理之前的消息历史
            # await self.clear_message_history()
            
            # 初始状态改为文档提取
            initial_state = target_state
            
            
            agent_state = StructuringState(
                project_id=self.project_id,
                state=initial_state,
                step_progress={ProcessingStep.EXTRACT: 0}  # 初始化提取步骤
            )
            
            # 保存到Redis
            await self.cache.add_agent_state_to_history(agent_state)
            
            # 发送初始状态事件
            await publish_state_update(self.project_id, agent_state, "开始分析已上传的文档...")
            
            logger.info(f"Initialized structuring agent for project {self.project_id}, starting document extraction")
            return agent_state.state
            
        except Exception as e:
            logger.error(f"Error initializing agent for project {self.project_id}: {str(e)}")
            raise ProcessingError(f"Failed to initialize agent: {str(e)}")
    
    async def transition_to_state(
        self, 
        target_state: StateEnum,
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
            if not self._is_valid_transition(agent_state.state, target_state):
                logger.error(f"状态转换不合法: {agent_state.state} -> {target_state}")
                raise StateTransitionError(f"状态转换不合法: {agent_state.state} -> {target_state}")
            
            # 更新状态
            agent_state.state = target_state
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

            
            # 保存状态
            await self.cache.add_agent_state_to_history(agent_state)
            print(f"存储agent_state完成: {agent_state}")

            # 发布状态更新事件
            await publish_state_update(self.project_id, agent_state, message)
            print(f"发布状态更新事件完成: {agent_state}")
            
            
            logger.info(f"State transition successful: {self.project_id} -> {target_state}")
            return True
            
        except Exception as e:
            logger.error(f"Error in state transition: {str(e)}")
            await self._handle_error("state_transition_error", str(e))
            return False

    # 校验
    def _is_valid_transition(self, current_state: StateEnum, target_state: StateEnum) -> bool:
        """验证状态转换是否合法"""
        # 允许相同状态的转换（用于更新进度或消息）
        if current_state == target_state:
            return True
            
        # 获取当前状态配置
        current_config = StateRegistry.get_state_config(current_state)
        
        # 失败状态可以转换到任何状态（重试机制）
        if current_state == StateEnum.FAILED:
            return True
        
        # 检查是否为配置的下一状态
        if current_config and current_config.next_state == target_state:
            return True
        
        # 允许转换到失败状态
        if target_state == StateEnum.FAILED:
            return True
        
        # 允许从任何状态转换到取消状态（如果有的话）
        # 这里可以根据需要添加更多转换规则
        
        logger.debug(f"Invalid transition attempted: {current_state} -> {target_state}")
        return False
    
    def _is_valid_action(self, current_state: StateEnum, action: UserAction) -> bool:
        """验证操作是否有效"""
        action_config = StateRegistry.get_action_config(action)
        
        if not action_config:
            return False
        
        return current_state in action_config.get("valid_states", [])



    # 
    async def recover_state(self, current_state: StateEnum):
        if current_state == StateEnum.FAILED:
            last_sucess_state =  await self._deal_with_failed_state(current_state)
            state_to_recover = self._determine_state(last_sucess_state)
    
        else:
            state_to_recover = self._determine_state(current_state)
 
        agent_state = await self.cache.get_agent_state()
        
        agent_state.state = state_to_recover
        agent_state.updated_at = datetime.now()

        # 这里不处理results等其他的过程数据， 只处理状态，重启的step会把旧的数据覆盖。
        await self.cache.add_agent_state_to_history(agent_state)

        await publish_state_update(self.project_id, agent_state, "Agent意外中断，重启尝试...")
        return agent_state.state

    async def _deal_with_failed_state(self, current_state: StateEnum) -> StateEnum:
        """
        - 处理failed状态
        - 之后计算要恢复的状态
        """
        # 提取历史
        sorted_agent_states = await self.cache._get_sorted_agent_states()
        # 如果历史为空，则初始化
        if not sorted_agent_states:
            logger.warning(f"项目 {self.project_id} 没有状态历史，从文档提取开始重试")
            await self.initialize_agent()
        
        # 历史不为空，找到最后一个非失败状态
        last_success_state = None
        for agent_state in sorted_agent_states: #由于history是按时间倒序排列，所以会找到第一个非失败的状态。 
            if agent_state.state != StateEnum.FAILED:
                last_success_state = agent_state.state
                break
        
        # 非失败状态不存在，则直接初始化
        if not last_success_state:
            logger.warning(f"项目 {self.project_id} 没有找到成功状态，从文档提取开始重试")
            await self.initialize_agent()
        
        # 非失败状态存在，则恢复到该状态
        return last_success_state

    def _determine_state(self, current_state: StateEnum):


        if current_state in ED_STATE_POOL:
            return current_state


        if current_state in ING_STATE_POOL:
            # 确定恢复的状态
            if current_state == StateEnum.EXTRACTING_DOCUMENT:
                """状态保持不变"""
                return current_state

            else:

                calculated_state = StateRegistry.get_state_config(current_state).previous_state
                if calculated_state not in ED_STATE_POOL:
                    raise ProcessingError(f"状态恢复失败: {calculated_state} 不是ED状态")
                
                return calculated_state
            





    # 错误处理
    async def _handle_error(self, error_type: str, error_message: str):
        """处理错误"""
        try:
            # 更新状态为失败
            agent_state = await self.cache.get_agent_state()
            if agent_state:
                # error_at_state = agent_state.state
                # error_at_progress = agent_state.overall_progress
                agent_state.state = StateEnum.FAILED
                agent_state.updated_at = datetime.now()
                
                await self.cache.add_agent_state_to_history(agent_state)

            await publish_error_event(self.project_id, agent_state, error_message)
            
        except Exception as e:
            logger.error(f"Error handling error: {str(e)}")


# ========================= 全局实例 =========================

# 注意：这里不再创建全局实例，因为每个项目需要独立的状态管理器
# 使用工厂函数或在需要时创建实例
def create_state_manager(project_id: str) -> StructuringAgentStateManager:
    """创建状态管理器实例"""
    return StructuringAgentStateManager(project_id) 