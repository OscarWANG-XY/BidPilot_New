from typing import Dict, List, Optional, Any, Union, TYPE_CHECKING
from abc import ABC, abstractmethod
from django.utils import timezone
from django.contrib.auth import get_user_model
from .services import ChainBasedChatService
from .context_providers import ContextManager
from .models import ChatSession

if TYPE_CHECKING:
    from django.contrib.auth.models import User
else:
    User = get_user_model()

import logging
logger = logging.getLogger(__name__)

class BasePipelineStep(ABC):
    """管道步骤的基类"""
    
    @abstractmethod
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """处理数据的抽象方法"""
        pass

class PreprocessStep(BasePipelineStep):
    """预处理步骤，处理输入消息"""
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            logger.info(f"[Pipelines-PreprocessStep] 开始预处理会话 {data.get('session_id')} 的消息")
            # 基础的输入验证和清理
            content = data.get('content', '').strip()
            if not content:
                raise ValueError("Empty message content")
            
            # 添加处理时间戳
            data['timestamp'] = timezone.now().isoformat()
            data['processed_content'] = content
            
            logger.info(f"[Pipelines-PreprocessStep]预处理完成，处理后的内容长度: {len(content)}")
            return data
        except Exception as e:
            logger.error(f"[Pipelines-PreprocessStep]预处理过程发生错误: {str(e)}")
            raise

class ContextEnrichmentStep(BasePipelineStep):
    """上下文富集步骤，添加上下文信息"""
    
    def __init__(self, context_manager: ContextManager):
        self.context_manager = context_manager
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            logger.info(f"[Pipelines-ContextEnrichmentStep]开始为会话 {data.get('session_id')} 进行上下文富集")
            session_id = data.get('session_id')
            if not session_id:
                raise ValueError("Missing session_id")
            
            # 获取上下文信息
            context_data = await self.context_manager.get_combined_context(session_id)
            data.update(context_data)
            
            logger.info(f"[Pipelines-ContextEnrichmentStep]上下文富集完成，上下文数据包含以下键: {list(context_data.keys())}")
            return data
        except Exception as e:
            logger.error(f"[Pipelines-ContextEnrichmentStep]上下文富集过程发生错误: {str(e)}")
            raise

class LLMProcessingStep(BasePipelineStep):
    """LLM处理步骤，生成响应"""
    
    def __init__(self, chat_service: ChainBasedChatService):
        self.chat_service = chat_service
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            logger.info(f"[Pipelines-LLMProcessingStep]开始为会话 {data.get('session_id')} 进行LLM处理")
            # 从预处理后的数据中提取必要信息
            response = await self.chat_service.process_message(
                session_id=data['session_id'],
                content=data['processed_content'],
                context=data.get('context'),
                documents=data.get('documents')
            )
            
            data['llm_response'] = response
            logger.info(f"[Pipelines-LLMProcessingStep]LLM处理完成，响应长度: {len(str(response))}")
            return data
        except Exception as e:
            logger.error(f"[Pipelines-LLMProcessingStep]LLM处理过程发生错误: {str(e)}")
            raise

class PostprocessStep(BasePipelineStep):
    """后处理步骤，处理 LLM 响应"""
    
    async def process(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            logger.info(f"[Pipelines-PostProcessStep]开始为会话 {data.get('session_id')} 进行后处理")
            llm_response = data.get('llm_response', {})
            
            # 构建最终响应
            data['final_response'] = {
                'response': llm_response.get('response', ''),
                'metadata': {
                    'timestamp': data.get('timestamp'),
                    'processing_info': llm_response.get('metadata', {}),
                }
            }
            
            logger.info("[Pipelines-PostProcessStep]后处理成功完成")
            return data
        except Exception as e:
            logger.error(f"[Pipelines-PostProcessStep]后处理过程发生错误: {str(e)}")
            raise

class ChatPipeline:
    """聊天处理管道，组织和执行所有处理步骤"""
    
    def __init__(self):
        self.context_manager = ContextManager()
        self.chat_service = ChainBasedChatService()
        
        # 初始化处理步骤
        self.steps = [
            PreprocessStep(),
            ContextEnrichmentStep(self.context_manager),
            LLMProcessingStep(self.chat_service),
            PostprocessStep()
        ]
    
    async def process_message(
        self, 
        session_id: str, 
        content: str, 
        user: 'User'
    ) -> Dict:
        """处理单个消息
        
        Args:
            session_id: 会话ID
            content: 消息内容
            user: 用户实例
        """
        try:
            logger.info(f"[Pipelines-Process_message]开始处理会话 {session_id} 的管道流程")
            
            # 确保 ChatSession 存在
            session, created = await ChatSession.objects.aget_or_create(
                id=session_id,
                defaults={'created_by': user}  # 直接使用 user 实例
            )
            
            # 初始化数据字典
            data = {
                'session_id': session_id,
                'content': content
            }
            
            # 依次执行每个处理步骤
            for step in self.steps:
                logger.info(f"[Pipelines-Process_message]正在执行步骤: {step.__class__.__name__}")
                logger.info(f"处理前数据：{data}")
                data = await step.process(data)
                logger.info(f"处理后数据：{data}")
            
            logger.info(f"[Pipelines-Process_message]会话 {session_id} 的管道处理已完成")
            return data['final_response']
            
        except Exception as e:
            logger.error(f"[Pipelines-Process_message]管道处理发生错误: {str(e)}")
            error_response = {
                'response': f"Error processing message: {str(e)}",
                'metadata': {
                    'error': True,
                    'timestamp': timezone.now().isoformat()
                }
            }
            return error_response

    async def process_batch(
        self, 
        messages: List[Dict], 
        user: 'User'
    ) -> List[Dict]:
        """批量处理多个消息
        
        Args:
            messages: 消息列表，每个消息包含 session_id 和 content
            user: 用户实例
        """
        logger.info(f"[Pipelines-Process_batch]开始批量处理 {len(messages)} 条消息")
        results = []
        for message in messages:
            result = await self.process_message(
                session_id=message.get('session_id'),
                content=message.get('content'),
                user=user
            )
            results.append(result)
        return results