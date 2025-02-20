from ..LLM_services._generic_llm_services import GenericLLMService, LLMRequest, LLMConfig
from ..LLM_services._batch_llm_services import BatchLLMService
from apps.doc_analysis.pipeline.types import OutlineAnalysisResult
from typing import Any, List
import os


class OutlineLLMAnalysis:
    """大纲分析专用步骤"""

    @classmethod
    def build_config(cls) -> LLMConfig:
        """构建LLM配置"""
        return LLMConfig(
                    llm_model_name = "qwen-plus",
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
请为我分析招标文档的目录结构和正文标题的一致性。

### 输入数据说明: 
{context}

### 具体分析任务: 
{requirement}

### 输出格式说明: 
1. 只输出JSON格式的结果，不要包含任何额外的解释或说明
2. 不要使用任何Markdown格式（包括```json```等标识符）
3. 确保JSON格式严格有效
4. 如果元素不存在，请使用[]
5. 严格按照以下格式输出：
{output_format}
        """

    @classmethod
    def create_service(cls) -> GenericLLMService:
        """创建LLM服务实例"""
        config = cls.build_config()
        prompt_template = cls.build_prompt_template()
        return GenericLLMService(config=config, prompt_template=prompt_template)

    @classmethod
    def create_batch_service(cls) -> BatchLLMService:
        """创建批量LLM服务实例"""
        config = cls.build_config()
        prompt_template = cls.build_prompt_template()
        return BatchLLMService(config=config, prompt_template=prompt_template)

    def build_context(formatted_toc: str, formatted_headings: str) -> str:
        return f"""
1. 目录标题列表：从文档目录中提取的标题
2. 正文标题列表：从文档正文中提取的标题

数据格式：
"[文档位置], 标题层级, 标题内容"

数据内容：
1. <目录标题列表>：
{formatted_toc}

2. <正文标题列表>：
{formatted_headings}
"""

    def build_requirement() -> str:
        """
        构建大模型分析任务要求
        """
        return """
请对比<目录标题列表>和<正文标题列表>的标题内容
找出以下三类不同标题项：
1. 目录列表里有，但正文里没有的标题项
2. 目录列表里没有，但正文里有的标题项

请注意：只比对标题内容，不比对[文档位置] 和 标题层级
"""

    def build_output_format() -> str:
        """
        构建大模型分析的输出要求
        """
        return OutlineAnalysisResult.get_prompt_specification()

    @classmethod
    async def analyze(cls, context: str, requirement: str, output_format: str) -> Any:
        """执行分析
        
        Args:
            context (str): 待分析的文档内容
            requirement (str): 分析要求
            output_format (str): 期望的输出格式
            
        Returns:
            Any: 由output_format(str) 控制
            
        Raises:
            ValueError: 当输入参数为空时
        """
        if not context or not requirement or not output_format:
            raise ValueError("所有输入参数都不能为空")
        
        service = cls.create_service()
        request = LLMRequest(
            context=context,
            requirement=requirement,
            output_format=output_format
        )
        return await service.process(request)

    @classmethod
    async def batch_analyze(cls, contexts: List[str], requirements: List[str], output_formats: List[str]) -> List[Any]:
        """批量执行分析
        
        Args:
            contexts (List[str]): 待分析的文档内容列表
            requirements (List[str]): 分析要求列表
            output_formats (List[str]): 期望的输出格式列表
            
        Returns:
            List[Any]: 分析结果列表
            
        Raises:
            ValueError: 当输入参数列表长度不一致或为空时
        """
        if not contexts or not requirements or not output_formats:
            raise ValueError("所有输入参数列表都不能为空")
        
        if not (len(contexts) == len(requirements) == len(output_formats)):
            raise ValueError("所有输入参数列表长度必须相同")

        # 创建批量服务实例
        service = cls.create_batch_service()
        
        # 构建请求列表
        requests = [
            LLMRequest(
                context=context,
                requirement=requirement,
                output_format=output_format
            )
            for context, requirement, output_format in zip(contexts, requirements, output_formats)
        ]
        
        # 执行批量处理
        return await service.batch_process(requests)

