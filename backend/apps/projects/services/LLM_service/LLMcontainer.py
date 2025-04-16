from .LLMchain import GenericLLMService, LLMRequest, LLMConfig
from apps.doc_analysis.pipeline.types import OutlineAnalysisResult
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from typing import Any, List, Union
import os


class LLMService:
    """大纲分析专用步骤"""

    def __init__(self, 
                 llm_config: LLMConfig,
                 prompt_template: str,
                 context: str,
                 instruction: str,
                 supplement: str,
                 output_format: str):
        """
        初始化分析器
        Args:
            prompt_template: 提示词模板
            llm_config: LLM配置参数字典
            output_format: 输出格式规范
        """
        self.prompt_template = prompt_template
        self.llm_config = llm_config
        self.output_format = output_format
        self.context = context
        self.instruction = instruction
        self.supplement = supplement

    def create_service(self) -> GenericLLMService:
        """创建LLM服务实例"""
        return GenericLLMService(config=self.llm_config, prompt_template=self.prompt_template)
    
    async def analyze(self) -> Any:
        """执行分析"""
        service = self.create_service()
        request = LLMRequest.create(
            context=self.context,
            instruction=self.instruction,
            supplement=self.supplement,
            output_format=self.output_format
        )
        return await service.process(request)


