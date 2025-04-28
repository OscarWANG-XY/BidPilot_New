from .llm_service import LLMService
from .llm_models import LLMConfigModel, LLMRequestModel
from typing import Any, List, Dict
import asyncio


class LLMClient:
    """大纲分析专用步骤"""

    def __init__(self, 
                 prompt_config: Dict,
                 ):
        """
        初始化分析器
        Args:
            prompt_template: 提示词模板
            llm_config: LLM配置参数字典
            output_format: 输出格式规范
        """
        self.prompt_config = prompt_config


    def create_service(self, ) -> LLMService:
        """创建LLM服务实例"""
        return LLMService(
            config=LLMConfigModel().from_model(self.prompt_config['llm_config']), 
            prompt_template=self.prompt_config['prompt_template'],
            system_role = self.prompt_config['system_role']
            )
    
    async def process(self, task_input: Dict) -> Any:
        """执行分析"""
        service = self.create_service()
        request = LLMRequestModel.create(
            context=task_input["context"],
            instruction=task_input["instruction"],
            supplement=task_input["supplement"],
            output_format=task_input["output_format"]
        )
        return await service.process(request)
    
    async def process_multiple(self, tasks: List[Dict]) -> List[Any]:
        """并发处理多个分析任务"""
        service = self.create_service()
        
        # 创建所有请求
        requests = [
            LLMRequestModel.create(
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
                request = LLMRequestModel.create(
                    context=task["context"],
                    instruction=task["instruction"],
                    supplement=task["supplement"],
                    output_format=task["output_format"]
                )
                return await service.process(request)
        
        return await asyncio.gather(*[process_task(task) for task in tasks])


