from ._generic_llm_services import GenericLLMService, LLMRequest, LLMConfig
from ._batch_llm_services import BatchLLMService
from apps.doc_analysis.pipeline.types import OutlineAnalysisResult
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from typing import Any, List
import os


class TemplateLLMAnalyzer:
    """大纲分析专用步骤"""

    @classmethod
    def build_config(cls, model_name: str = "qwen-plus") -> LLMConfig:
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
将文档段落中隐含的子标题识别出来，形成更细粒度的层级结构

# Requirements
- 分析每个章节内的段落文本
- 识别段落中具有标题特征的内容，如关键词、格式特征等
- 将识别出的内容标记为子标题，并确定其层级关系
- 保持原有章节结构不变，仅在章节内部进行子标题划分
- 确保识别出的子标题与上下文内容语义相关

# Output
## Rules
- 输出JSON格式的层级结构
- 每个子标题包含其文本内容和层级信息
- 保留原始段落与新识别子标题的对应关系
- 空内容使用[]

## Format
{output_format}

# Input
{data_input}
"""

    @staticmethod
    def build_output_format() -> str:
        """
        构建大模型分析的输出要求
        """
        return OutlineAnalysisResult.get_prompt_specification()

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
    async def analyze(cls, data_input: str, model_name: str = "qwen-plus") -> Any:
        """执行分析"""

        context = cls.build_context(data_input)
        requirement = cls.build_requirement()
        output_format = cls.build_output_format()
        config = cls.build_config(model_name)
        service = cls.create_service(config)
        request = LLMRequest.create(
            context = context,
            requirement = requirement,
            output_format = output_format
        )
        return await service.process(request)

    
    @classmethod
    async def batch_analyze_with_repeats(cls, data_inputs: List[str], repeats: int = 1, model_name: str = "qwen-plus") -> List[Any]:
        """批量执行分析"""

        # 将单个字符串转换为列表
        if isinstance(data_inputs, str):
            data_inputs = [data_inputs]

        # 对于任务数量做限制
        if len(data_inputs) > 10:
            raise ValueError("任务数量超过限制，最多支持10个任务")
        
        # 对于重复次数做限制
        if repeats > 3:
            raise ValueError("重复次数超过限制，最多支持3次")

        contexts = []
        requirements = []
        output_formats = []
        for data_input in data_inputs:
            context = cls.build_context(data_input)
            requirement = cls.build_requirement()
            output_format = cls.build_output_format()
            contexts.append(context)
            requirements.append(requirement)
            output_formats.append(output_format)

        config = cls.build_config(model_name)
        service = cls.create_batch_service(config)
        requests = LLMRequest.create_batch_with_repeats(
            contexts = contexts,
            requirements = requirements,
            output_formats = output_formats,
            repeats = repeats
        )



        # ！！！！！ 执行前的任务请求数检查
        if len(requests) >30:
            raise ValueError("总请求数量超过限制，最多支持30个并发请求（请求数 = 任务数 * 重复次数）")

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
                input_variables=["context", "requirement", "output_format"]
            )
        ])
        
        # 格式化模板
        simulated_prompt = prompt.format_messages(
            context=cls.build_context(data_input),
            requirement=cls.build_requirement(),
            output_format=cls.build_output_format()
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