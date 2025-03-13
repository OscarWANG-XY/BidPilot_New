from ._generic_llm_services import GenericLLMService, LLMRequest, LLMConfig
from ._batch_llm_services import BatchLLMService
from apps.doc_analysis.pipeline.types import OutlineAnalysisResult
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from typing import Any, List, Union
import os


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

    def create_service(self) -> GenericLLMService:
        """创建LLM服务实例"""
        return GenericLLMService(config=self.llm_config, prompt_template=self.prompt_template)

    def create_batch_service(self) -> BatchLLMService:
        """创建批量LLM服务实例"""
        return BatchLLMService(config=self.llm_config, prompt_template=self.prompt_template)

    async def analyze(self, data_input: str) -> Any:
        """执行分析"""
        service = self.create_service()
        request = LLMRequest.create(
            data_input=data_input,
            output_format=self.output_format
        )
        return await service.process(request)

    async def batch_analyze_with_repeats(self, data_inputs: Union[str, List[str]], repeats: int = 1) -> List[Any]:
        """批量执行分析"""

        # ！！！！！ 将单个字符串转换为列表
        if isinstance(data_inputs, str):
            data_inputs = [data_inputs]

        # ！！！！！ 对于任务数量做限制
        if len(data_inputs) > 10:
            raise ValueError("任务数量超过限制，最多支持10个任务")
        
        # 对于重复次数做限制
        if repeats > 3:
            raise ValueError("重复次数超过限制，最多支持3次")

        output_formats = [self.output_format for _ in data_inputs]
        service = self.create_batch_service()

        requests = LLMRequest.create_batch_with_repeats(
            data_inputs = data_inputs,
            output_formats = output_formats,
            repeats = repeats
        )

        # ！！！！！ 执行前的任务请求数检查
        if len(requests) >30:
            raise ValueError("总请求数量超过限制，最多支持30个并发请求（请求数 = 任务数 * 重复次数）")

        # 执行批量分析
        return await service.batch_process(
            requests = requests,
            parallel = "asyncio",
            max_concurrent = 10,
            repeat = repeats
            )

    def simulate_prompt(self, data_input: str) -> str:
        """
        模拟生成完整的 prompt
        
        Args:
            context: 输入的上下文信息
            
        Returns:
            str: 完整的 prompt 内容
        """
        # 创建聊天提示模板
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(
                "你是一个专业的招标文档分析助手，帮助用户分析文档的结构和内容。"
            ),
            HumanMessagePromptTemplate.from_template(
                self.prompt_template,
                input_variables=["data_input", "output_format"]
            )
        ])
        
        # 格式化模板
        simulated_prompt = prompt.format_messages(
            data_input=data_input,
            output_format=self.output_format
        )

        # 转换为易读的格式
        formatted_messages = [
            {
                "role": message.type,
                "content": message.content
            }
            for message in simulated_prompt
        ]
        
        return simulated_prompt, formatted_messages