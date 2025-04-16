from typing import Any, List, Union, Optional
from .LLMchain_with_redis_callback import GenericLLMService,RedisStreamingCallbackHandler
from ._llm_data_types import LLMRequest, LLMConfig
from apps.projects.utils.redis_manager import RedisManager, RedisStreamStatus
from apps.projects.models import Project, ProjectStage, StageType, Task, TaskType

import logging
logger = logging.getLogger(__name__)



# 使用场景 - 在celery任务里调用: 1)先初始化实例  2）异步执行任务
# 需传入：project_id, stage_type, task_type, stream_id(来自celery任务的id) 
# 1） 初始化需要从数据库加载context, instruction, supplement, output_format, prompt_template, llmconfig到实例里，从而构建和初始化LLM服务。 
# 2） 异步执行任务, 使用以上LLM服务进行分析。 


class LLMService:
    """大纲分析专用步骤"""

    def __init__(self, project_id: str, stage_type: str, task_type: str, stream_id: str):
        """
        初始化LLM任务容器
        """
        self.project = Project.objects.get(id=project_id)
        self.stage = ProjectStage.objects.get(project=self.project, stage_type=stage_type)
        self.task = Task.objects.get(stage__project=self.project, type=task_type)
        self.redis_manager = RedisManager()
        self.stream_id = stream_id

        # 从数据库加载数据
        self.context = self.task.context
        self.instruction = self.task.instruction
        self.supplement = self.task.supplement
        self.output_format = self.task.output_format
        self.prompt_template = self.task.prompt_template
        self.llm_config = self.task.llm_config
    
    
    async def processing(self) -> str:
        """执行流式分析"""

        logger.info(f"开始流式分析: stream_id={self.stream_id}")

        # ----------- 在__init__中已经初始化构建了Redis管理器实例， 以下是针对redis_manager实例的初始化配置 ------------
        # 如果没有提供stream_id，则生成一个
        if self.stream_id is None:
            self.stream_id = self.redis_manager.generate_stream_id()
        
        logger.info(f"使用的stream_id: {self.stream_id}")

        # 初始化任务状态
        metadata = {}
        metadata.update({
            "model": self.llm_config["llm_model_name"],
            "temperature": self.llm_config["temperature"],
            "top_p": self.llm_config["top_p"]
        })

        self.redis_manager.initialize_stream(self.stream_id, metadata) # 这会设置状态为 PENDING
        
        # 创建流式回调处理器
        streaming_callback = RedisStreamingCallbackHandler(
            redis_manager=self.redis_manager,  # 传入redis_manager实例, 用于构建回调处理器 
            stream_id=self.stream_id
        )

        # 不需要在这里更新状态，因为回调处理器会在 on_llm_start 中更新为 PROCESSING
        #self.redis_manager.update_stream_status(stream_id, "PROCESSING")
        
        # 创建服务和请求
        service = GenericLLMService(config=self.llm_config, prompt_template=self.prompt_template)

        request = LLMRequest.create(
            context=self.context,
            instruction=self.instruction,
            supplement=self.supplement,
            output_format=self.output_format
        )
        
        # 异步执行分析
        try:
            
            # 执行分析
            logger.info(f"执行LLM分析: stream_id={self.stream_id}")
            await service.process(request, streaming_callback=streaming_callback)
            logger.info(f"LLM分析完成: stream_id={self.stream_id}")

            self.redis_manager.update_stream_status(self.stream_id, RedisStreamStatus.COMPLETED)
            
            # 返回任务ID
            return self.stream_id
        except Exception as e:
            # 标记任务失败
            logger.error(f"流式分析失败: {str(e)}, stream_id={self.stream_id}")
            self.redis_manager.mark_stream_failed(self.stream_id, str(e))
            raise


        #     async def process_streaming(self, stream_id: Optional[str] = None) -> str:
        # """
        # 流式处理文档元素，分析目录和正文标题的一致性
        # """

        # # 初始化LLM服务
        # llm_service = LLMService(
        #     config=self.llm_config,
        #     prompt_template=self.prompt_template,
        #     output_format=self.output_format
        # )
        
        # # 准备元数据
        # metadata = {
        #     "model": self.llm_config.llm_model_name,
        #     "index_path_map": self.index_path_map
        # }
        
        # # 执行流式分析
        # # 返回的是ID，不是分析的内容，因为内容直接存储在Redis中.
        # await llm_service.analyze_streaming(
        #     data_input=self.data_input,
        #     stream_id = stream_id,
        #     metadata=metadata
        # )
        
        # return stream_id