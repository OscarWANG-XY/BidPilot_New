from ._generic_llm_services import GenericLLMService, LLMRequest, LLMConfig
from ._batch_llm_services import BatchLLMService
from apps.doc_analysis.pipeline.types import DocxTreeTitlesAnalysisResult
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from typing import Any, List
import os


class DocxTreeTitlesLLMAnalyzer:
    """章节标题分析工具"""

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
## 任务目标: 
{requirement}

## 输入数据说明: 
{context}

## 输出格式说明: 
1. 只输出JSON格式的结果，不要包含任何额外的解释或说明
2. 不要使用任何Markdown格式（包括```json```等标识符）
3. 确保JSON格式严格有效
4. 如果元素不存在，请使用[]
{output_format}
        """

    def build_requirement() -> str:
        return """
分析招标文档的章节结构，识别出内容过于庞大或主题范围过广，需要进一步细化的章节。

"""

    def build_context(formatted_docxtree_titles: str) -> str:
        return f"""

### 每个章节的标题格式：
"标题内容 [标题层级][标题ID][章节Token数]"

### 数据内容：
{formatted_docxtree_titles}
"""



    def build_output_format() -> str:
        """
        构建大模型分析的输出要求
        """
        return DocxTreeTitlesAnalysisResult.get_prompt_specification()


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
    async def analyze(cls, context: str, requirement: str, output_format: str, model_name: str = "qwen-plus") -> Any:
        """执行分析"""
        config = cls.build_config(model_name)
        service = cls.create_service(config)
        request = LLMRequest.create(
            context = context,
            requirement = requirement,
            output_format = output_format
        )
        return await service.process(request)

    @classmethod
    async def batch_analyze(cls, contexts: List[str], requirements: List[str], output_formats: List[str], model_name: str = "qwen-plus") -> List[Any]:
        """批量执行分析"""
        config = cls.build_config(model_name)
        service = cls.create_batch_service(config)
        requests = LLMRequest.create_batch(
            contexts = contexts,
            requirements = requirements,
            output_formats = output_formats
        )
        return await service.batch_process(requests)
    
    @classmethod
    async def batch_analyze_with_group_id(cls, contexts: List[str], requirements: List[str], output_formats: List[str], repeats: int = 1, model_name: str = "qwen-plus") -> List[Any]:
        """批量执行分析"""
        config = cls.build_config(model_name)
        service = cls.create_batch_service(config)
        requests = LLMRequest.create_batch_with_repeats(
            contexts = contexts,
            requirements = requirements,
            output_formats = output_formats,
            repeats = repeats
        )
        return await service.batch_process(requests)

    @classmethod
    def simulate_prompt(cls, context: str) -> str:
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
            context=cls.build_context(),
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


