from ._generic_llm_services import GenericLLMService, LLMRequest, LLMConfig
from ._batch_llm_services import BatchLLMService
from apps.doc_analysis.pipeline.types import OutlineAnalysisResult
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from typing import Any, List, Union
import os


class OutlineLLMAnalyzer:
    """大纲分析专用步骤"""

    @classmethod
    def build_config(cls, model_name: str) -> LLMConfig:
        """构建LLM配置"""
        return LLMConfig(
                    llm_model_name = model_name,  # qwen-plus
                    temperature = 0.7,
                    top_p =  0.8,
                    streaming = True,
                    api_key = os.getenv("ALIBABA_API_KEY"),
                    base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    max_workers = 4,
                    timeout = 30,
                    retry_times = 3
                )

    @classmethod
    def build_prompt_template(cls) -> str:
        return """
# Task
分析招标文档的目录结构和正文标题之间的一致性

# Requirements
- 比对目录中的标题和正文中的实际标题
- 忽略标点符号和空格的差异
- 仅匹配标题的实际文本内容
- 分别罗列出"目录中存在但正文中不存在"和"正文中存在但目录中不存在"的标题

# Output
## Rules
- 只输出JSON格式的结果
- 不使用Markdown格式
- 确保JSON格式严格有效
- 空元素使用[]

## Format
{output_format}

# Input
{data_input}
"""


    @classmethod
    def create_service(cls, config: LLMConfig) -> GenericLLMService:
        """创建LLM服务实例"""
        prompt_template = cls.build_prompt_template()
        return GenericLLMService(config=config, prompt_template=prompt_template)

    @classmethod
    def create_batch_service(cls, config: LLMConfig) -> BatchLLMService:
        """创建批量LLM服务实例"""
        prompt_template = cls.build_prompt_template()
        return BatchLLMService(config=config, prompt_template=prompt_template)


    @classmethod
    async def analyze(cls, model_name: str, data_input: str) -> Any:
        """执行分析"""

        # 构建LLM配置
        config = cls.build_config(model_name)

        # 创建LLM服务实例
        service = cls.create_service(config)

        # 创建LLM请求
        request = LLMRequest.create(
            data_input = data_input,
            output_format = OutlineAnalysisResult.get_prompt_specification()
        )
        return await service.process(request)

    
    @classmethod
    async def batch_analyze_with_repeats(cls, model_name: str, data_inputs: Union[str, List[str]],  repeats: int = 1) -> List[Any]:
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


        # 构建输出格式列表
        output_formats = [OutlineAnalysisResult.get_prompt_specification() for _ in data_inputs]

        # 构建LLM配置
        config = cls.build_config(model_name)

        # 创建批量服务实例
        service = cls.create_batch_service(config)  

        # 创建批量请求
        requests = LLMRequest.create_batch_with_repeats(
            data_inputs = data_inputs,
            output_formats = output_formats,
            repeats = repeats
        )

        # ！！！！！ 执行前的任务请求数检查
        if len(requests) >30:
            raise ValueError("总请求数量超过限制，最多支持30个并发请求（请求数 = 任务数 * 重复次数）")

        # 执行批量分析
        return await service.batch_process(requests)



    @classmethod
    def simulate_prompt(cls, data_input: str) -> str:
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
                cls.build_prompt_template(),
                input_variables=["data_input", "output_format"]
            )
        ])
        
        # 格式化模板
        simulated_prompt = prompt.format_messages(
            data_input=data_input,
            output_format=OutlineAnalysisResult.get_prompt_specification()
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