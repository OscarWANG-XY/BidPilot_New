from typing import Dict, Optional, List
from abc import ABC, abstractmethod
from django.utils import timezone
from .models import ChatMessage

import logging
logger = logging.getLogger(__name__)

class BaseContextProvider(ABC):
    """上下文提供者的基类"""
    
    @abstractmethod
    async def get_context(self, session_id: str) -> Dict:
        """获取上下文信息的抽象方法"""
        pass

class UserContextProvider(BaseContextProvider):
    """用户相关的上下文提供者"""
    
    async def get_context(self, session_id: str) -> Dict:
        try:
            # 这里可以从用户会话或配置中获取用户偏好设置
            # 实际实现时需要连接到用户系统
            return {
                "user_preferences": {
                    "language": "zh",
                    "expertise_level": "intermediate"
                },
                "session_start_time": timezone.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting user context: {str(e)}")
            return {}

class ConversationContextProvider(BaseContextProvider):
    async def get_context(self, session_id: str) -> Dict:
        try:
            # 只获取元信息，不重复获取消息内容
            messages = ChatMessage.objects.filter(
                session_id=session_id
            ).values('timestamp').order_by('-sequence')
            
            return {
                "conversation_metadata": {
                    "total_messages": messages.count(),
                    "session_duration": self._calculate_session_duration(messages),
                    "interaction_frequency": self._calculate_frequency(messages),
                    "last_interaction_time": (
                        messages.first()['timestamp'].isoformat() 
                        if messages.exists() else None
                    )
                }
            }
        except Exception as e:
            logger.error(f"Error getting conversation context: {str(e)}")
            return {}

class RAGContextProvider(BaseContextProvider):
    """知识库检索相关的上下文提供者"""
    
    async def get_context(self, session_id: str) -> Dict:
        try:
            # 这里可以实现知识库检索逻辑
            # 实际实现时需要连接到向量数据库
            return {
                "relevant_documents": [],
                "knowledge_base_status": "available"
            }
        except Exception as e:
            logger.error(f"Error getting RAG context: {str(e)}")
            return {}

class ContextManager:
    """上下文管理器，整合所有上下文提供者"""
    
    def __init__(self):
        self.providers = [
            UserContextProvider(),
            ConversationContextProvider(),
            RAGContextProvider()
        ]
    
    async def get_combined_context(self, session_id: str) -> Dict:
        """获取组合后的上下文信息"""
        combined_context = {}
        
        for provider in self.providers:
            try:
                context = await provider.get_context(session_id)
                combined_context.update(context)
            except Exception as e:
                logger.error(f"Error from context provider {provider.__class__.__name__}: {str(e)}")
                continue
        
        return combined_context