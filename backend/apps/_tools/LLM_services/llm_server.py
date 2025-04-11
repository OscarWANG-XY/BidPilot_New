from ._generic_llm_services import GenericLLMService, LLMRequest, LLMConfig, RedisStreamingCallbackHandler
from ._batch_llm_services import BatchLLMService
from apps.doc_analysis.pipeline.types import OutlineAnalysisResult
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from typing import Any, List, Union, Optional
import os
from apps.projects.utils.redis_manager import RedisManager, RedisStreamStatus
import logging

logger = logging.getLogger(__name__)


class LLMService:
    """大纲分析专用步骤"""

    def __init__(self, 
                 prompt_template: str,
                 config: LLMConfig,
                 output_format: str):
        """
        初始化分析器
        Args:
            prompt_template: 提示词模板
            llm_config: LLM配置参数字典
            output_format: 输出格式规范
        """
        self.prompt_template = prompt_template
        self.llm_config = config
        self.output_format = output_format
        self.redis_manager = RedisManager()

    def create_service(self) -> GenericLLMService:
        """创建LLM服务实例"""
        return GenericLLMService(config=self.llm_config, prompt_template=self.prompt_template)
    
    
    async def analyze_streaming(self, data_input: str, stream_id: Optional[str] = None, metadata: dict = None) -> str:
        """执行流式分析"""

        logger.info(f"开始流式分析: stream_id={stream_id}")


        # ----------- 在__init__中已经初始化构建了Redis管理器实例， 以下是针对redis_manager实例的初始化配置 ------------
        # 如果没有提供stream_id，则生成一个
        if stream_id is None:
            stream_id = self.redis_manager.generate_stream_id()
        
        logger.info(f"使用的stream_id: {stream_id}")

        # 初始化任务状态
        metadata = metadata or {}
        metadata.update({
            "model": self.llm_config.llm_model_name,
            "temperature": self.llm_config.temperature,
            "top_p": self.llm_config.top_p
        })
        self.redis_manager.initialize_stream(stream_id, metadata) # 这会设置状态为 PENDING
        
        # 创建流式回调处理器
        streaming_callback = RedisStreamingCallbackHandler(
            redis_manager=self.redis_manager,  # 传入redis_manager实例, 用于构建回调处理器 
            stream_id=stream_id
        )

        # 不需要在这里更新状态，因为回调处理器会在 on_llm_start 中更新为 PROCESSING
        #self.redis_manager.update_stream_status(stream_id, "PROCESSING")
        
        # 创建服务和请求
        service = self.create_service()
        request = LLMRequest.create(
            data_input=data_input,
            output_format=self.output_format
        )
        
        # 异步执行分析
        try:
            # 更新任务状态为处理中
            
            
            # 执行分析
            logger.info(f"执行LLM分析: stream_id={stream_id}")
            await service.process(request, streaming_callback=streaming_callback)
            logger.info(f"LLM分析完成: stream_id={stream_id}")

            self.redis_manager.update_stream_status(stream_id, RedisStreamStatus.COMPLETED)
            
            # 返回任务ID
            return stream_id
        except Exception as e:
            # 标记任务失败
            logger.error(f"流式分析失败: {str(e)}, stream_id={stream_id}")
            self.redis_manager.mark_stream_failed(stream_id, str(e))
            raise