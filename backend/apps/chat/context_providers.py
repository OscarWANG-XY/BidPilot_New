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
            # session_id 参数在实际项目中用于：
            # 1. 通过 session_id 查询会话关联的用户信息
            # 2. 获取用户的个性化设置
            # 3. 获取用户在该会话中的特定状态
            # 当前为示例实现，返回固定值
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
            # 由于我们应用的历史消息使用了ChatMessage模型，存在数据库，从而实现持久化
            messages = ChatMessage.objects.filter(
                session_id=session_id
            ).values('created_at').order_by('-sequence')
            
            return {
                "conversation_metadata": {
                    "total_messages": messages.count(),
                    "conversation_summary": self._generate_summary(messages),
                    #"session_duration": self._calculate_session_duration(messages),
                    #"interaction_frequency": self._calculate_frequency(messages),
                    "last_interaction_time": (
                        messages.first()['created_at'].isoformat() 
                        if messages.exists() else None
                    )

                }
            }
        except Exception as e:
            logger.error(f"Error getting conversation context: {str(e)}")
            return {}
        
    def _generate_summary(self, messages: List) -> str:
        # 简单的摘要生成逻辑，实际项目中可能需要更复杂的实现
        if not messages:
            return "No previous conversation"
        return f"Conversation with {len(messages)} recent messages"

class RAGContextProvider(BaseContextProvider):
    """知识库检索相关的上下文提供者"""
    
    async def get_context(self, session_id: str) -> Dict:
        try:
            # 这里可以实现知识库检索逻辑
            # 实际实现时需要连接到向量数据库 TODO
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
        """获取组合后的上下文信息，结构匹配 process_message 的参数要求"""
        # 初始化基础结构
        combined_context = {
            "context": {},          # 对应 process_message 的 context 参数
            "documents": []         # 对应 process_message 的 documents 参数
        }
        
        # 收集各个提供者的上下文
        for provider in self.providers:
            try:
                context = await provider.get_context(session_id)
                
                # 如果是 RAG 提供者，将文档放入 documents 列表
                if isinstance(provider, RAGContextProvider):
                    combined_context["documents"].extend(
                        context.get("relevant_documents", [])
                    )
                    # 其他 RAG 相关信息放入 context
                    combined_context["context"]["knowledge_base_info"] = {
                        "status": context.get("knowledge_base_status"),
                        "last_updated": context.get("last_updated")
                    }
                else:
                    # 其他提供者的信息都放入 context
                    combined_context["context"].update(context)
            
            except Exception as e:
                logger.error(f"Error from context provider {provider.__class__.__name__}: {str(e)}")
                continue
        
        return combined_context