# app/services/state_manager.py
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

# from app.core.redis_manager import RedisManager
from app.services.structuring.cache_manager import CacheManager
from app.services.structuring.state import AgentState, STATE_CONFIG, StateError, InvalidStateTransitionError
from app.models.structuring_models import StructuringAgentState, StructuringAgentDocument

logger = logging.getLogger(__name__)

class StateManager:
    """状态管理器，处理状态转换和持久化"""
    
    def __init__(
            self, 
            project_id: str, 
            # redis_manager: RedisManager, 
            cache_manager: CacheManager
            ):
        self.project_id = project_id
        self._current_state = AgentState.AWAITING_UPLOAD
        self._state_history = []
        self._agent_reference = None
        # self.redis_manager = redis_manager
        self.cache_manager = cache_manager

    def get_state_history(self): 
        return self._state_history
    
    def set_state_history(self, history):
        self._state_history = history
    
    def get_state(self) -> AgentState:
        return self._current_state
    
    async def set_state(self, new_state: AgentState):
        """设置新状态并记录历史"""
        if new_state == self._current_state:
            logger.debug(f"状态保持不变: {new_state.value}")
            return
            
        # 记录状态历史
        current_history = self.get_state_history()
        current_history.append({
            'from_state': self._current_state.value,
            'to_state': new_state.value,
            'timestamp': datetime.now().isoformat()
        })
        self.set_state_history(current_history)
        
        # 持久化状态到数据库
        if STATE_CONFIG[new_state].persist:
            await self._persist_state(new_state)
            
        self._current_state = new_state
    
    def can_transition_to(self, new_state: AgentState) -> bool:
        """检查是否可以转换到新状态"""
        # 允许转换到相同状态
        if new_state == self.get_state():
            return True
            
        # 定义有效的状态转换
        valid_transitions = {
            AgentState.AWAITING_UPLOAD: [AgentState.EXTRACTING_DOCUMENT],  
            AgentState.EXTRACTING_DOCUMENT: [AgentState.DOCUMENT_EXTRACTED, AgentState.FAILED],
            AgentState.DOCUMENT_EXTRACTED: [AgentState.ANALYZING_OUTLINE_H1, AgentState.FAILED],
            AgentState.ANALYZING_OUTLINE_H1: [AgentState.OUTLINE_H1_ANALYZED, AgentState.FAILED],
            AgentState.OUTLINE_H1_ANALYZED: [AgentState.ANALYZING_OUTLINE_H2H3, AgentState.FAILED],
            AgentState.ANALYZING_OUTLINE_H2H3: [AgentState.OUTLINE_H2H3_ANALYZED, AgentState.FAILED],
            AgentState.OUTLINE_H2H3_ANALYZED: [AgentState.ADDING_INTRODUCTION, AgentState.FAILED],
            AgentState.ADDING_INTRODUCTION: [AgentState.INTRODUCTION_ADDED, AgentState.FAILED],
            AgentState.INTRODUCTION_ADDED: [AgentState.AWAITING_EDITING, AgentState.FAILED],
            AgentState.AWAITING_EDITING: [AgentState.COMPLETED, AgentState.FAILED],
            AgentState.COMPLETED: [], # 终止状态
            AgentState.FAILED: [
                AgentState.AWAITING_UPLOAD,
                AgentState.EXTRACTING_DOCUMENT,
                AgentState.DOCUMENT_EXTRACTED,
                AgentState.ANALYZING_OUTLINE_H1,
                AgentState.OUTLINE_H1_ANALYZED,
                AgentState.ANALYZING_OUTLINE_H2H3,
                AgentState.OUTLINE_H2H3_ANALYZED,
                AgentState.ADDING_INTRODUCTION,
                AgentState.INTRODUCTION_ADDED,
                AgentState.AWAITING_EDITING
            ], # 失败后可以重新开始或继续。 
        }
        
        # 失败状态总是可以转换到
        if new_state == AgentState.FAILED:
            return True
            
        return new_state in valid_transitions.get(self.get_state(), [])
    
    async def _persist_state(self, state: AgentState):
        """持久化状态到数据库和缓存"""
        # 获取 DocumentStructureAgent 实例以访问文档数据
        agent = self._agent_reference
        
        # 准备基本状态数据，用于持久化
        state_data = {
            'state': state.value,
            'state_history': self.get_state_history(),
        }
        
        try:
            # 更新或创建状态记录 - 使用Tortoise ORM
            await StructuringAgentState.update_or_create(
                project_id=self.project_id, 
                defaults=state_data
            )
            
            # 保存文档数据
            await self._persist_documents(agent)
            
            # 保存状态到缓存
            # 由于键值是一样，所以新的状态会覆盖旧的状态，这个设计是合理的，因为一个项目任何时刻只有一个“当前状态”
            await self.cache_manager.cache_state(self.project_id, state_data)
            
            logger.info(f"项目 {self.project_id} 状态已更新为 {state.value} 并持久化")
        except Exception as e:
            error_msg = f"持久化状态失败: {str(e)}"
            logger.error(error_msg)
            raise StateError(error_msg)
    
    async def _persist_documents(self, agent):
        """单独持久化文档数据"""
        # 文档字段映射 - 属性名映射到文档类型
        document_mapping = {
            'document': 'document',
            'H1_document': 'h1',
            'H2H3_document': 'h2h3',
            'Intro_document': 'intro',
            'final_document': 'final'
        }
        
        errors = []
        # 遍历所有文档，保存到数据库
        for attr_name, doc_type in document_mapping.items():
            document = getattr(agent, attr_name, None)
            if document is not None:
                try:
                    # 更新或创建文档记录 - 使用Tortoise ORM
                    doc_obj, created = await StructuringAgentDocument.update_or_create(
                        project_id=self.project_id,
                        document_type=doc_type,
                        defaults={'content': document}
                    )
                    
                    logger.debug(f"已保存项目 {self.project_id} 的 {doc_type} 文档")
                    
                    # 也缓存文档
                    await self.cache_manager.cache_document(self.project_id, doc_type, document)
                except Exception as e:
                    error_msg = f"保存文档 {doc_type} 失败: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
        
        if errors:
            raise StateError(f"持久化文档数据失败: {'; '.join(errors)}")
    
    async def transition_to(self, new_state: AgentState, force: bool = False) -> bool:
        """尝试将状态转换到新状态"""
        # 检查是否可以转换
        if force or self.can_transition_to(new_state):
            # 更新状态, 记录历史, 并进行持久化处理
            await self.set_state(new_state)  
            return True
        
        raise InvalidStateTransitionError(
            f"无法从 {self.get_state().value} 转换到 {new_state.value}"
        )
    
    async def rollback(self) -> Optional[AgentState]:
        """回退到上一个状态"""
        current_history = self.get_state_history()

        if not current_history:
            logger.info("无法回退：没有状态历史记录")
            return None
            
        previous_state_value = current_history[-1]['from_state']
        previous_state = AgentState(previous_state_value)

        # 更新为之前的状态
        self._current_state = previous_state  # 直接设置，避免添加历史记录

        # 移除最后一条历史记录
        current_history.pop()
        self.set_state_history(current_history)
        
        # 记录回退操作
        logger.info(f"已回退到状态: {previous_state.value}")
        return previous_state
        