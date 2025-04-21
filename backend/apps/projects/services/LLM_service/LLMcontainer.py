from .LLMchain import GenericLLMService, LLMRequest, LLMConfig
from apps.doc_analysis.pipeline.types import OutlineAnalysisResult
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from typing import Any, List, Union, Dict
import asyncio


class LLMService:
    """大纲分析专用步骤"""

    def __init__(self, 
                 model_params: Dict,
                #  llm_config: LLMConfig,
                #  prompt_template: str,
                #  context: str,
                #  instruction: str,
                #  supplement: str,
                #  output_format: str
                 ):
        """
        初始化分析器
        Args:
            prompt_template: 提示词模板
            llm_config: LLM配置参数字典
            output_format: 输出格式规范
        """

        self.model_params = model_params

        # llm_config + prompt_template用来构建 服务实例
        # self.prompt_template = prompt_template
        # self.llm_config = llm_config

        # # 以下四个参数用来构建分析的输入
        # self.output_format = output_format
        # self.context = context
        # self.instruction = instruction
        # self.supplement = supplement

    def create_service(self, ) -> GenericLLMService:
        """创建LLM服务实例"""
        # return GenericLLMService(config=self.llm_config, prompt_template=self.prompt_template)
        return GenericLLMService(
            config=LLMConfig().from_model(self.model_params['llm_config']), 
            prompt_template=self.model_params['prompt_template']
            )
    
    async def process(self, task: Dict) -> Any:
        """执行分析"""
        service = self.create_service()
        request = LLMRequest.create(
            context=task["context"],
            instruction=task["instruction"],
            supplement=task["supplement"],
            output_format=task["output_format"]
        )
        return await service.process(request)
    
    async def process_multiple(self, tasks: List[Dict]) -> List[Any]:
        """并发处理多个分析任务"""
        service = self.create_service()
        
        # 创建所有请求
        requests = [
            LLMRequest.create(
                context=task["context"],
                instruction=task["instruction"],
                supplement=task["supplement"],
                output_format=task["output_format"]
            )
            for task in tasks
        ]
        
        # 并发执行所有请求
        return await asyncio.gather(*[service.process(req) for req in requests])
    
    async def process_with_limit(self, tasks: List[Dict], limit: int = 5) -> List[Any]:
        """带并发限制的处理"""
        service = self.create_service()
        semaphore = asyncio.Semaphore(limit)
        
        async def process_task(task):
            async with semaphore:
                request = LLMRequest.create(
                    context=task["context"],
                    instruction=task["instruction"],
                    supplement=task["supplement"],
                    output_format=task["output_format"]
                )
                return await service.process(request)
        
        return await asyncio.gather(*[process_task(task) for task in tasks])


