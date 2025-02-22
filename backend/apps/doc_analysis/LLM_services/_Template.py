from ._generic_llm_services import GenericLLMService, LLMRequest, LLMConfig
from ._batch_llm_services import BatchLLMService
from apps.doc_analysis.pipeline.types import OutlineAnalysisResult
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
    def create_service(cls, config: LLMConfig) -> GenericLLMService:
        """创建LLM服务实例"""
        prompt_template = cls.build_prompt_template()
        return GenericLLMService(config=config, prompt_template=prompt_template)

    @classmethod
    def create_batch_service(cls, config: LLMConfig) -> BatchLLMService:
        """创建批量LLM服务实例"""
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
找出以下两类不同标题项：
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

    # 使用示例：
    def print_how_to_use() -> str:
        return """

# ====================== 如何使用  ======================

# for anlayze: 
result = await OutlineLLMAnalysis.analyze(context, requirement, output_format)

# for batch_analyze:
contexts = [context1, context2, context3]
requirements = [requirement1, requirement2, requirement3]
output_formats = [output_format1, output_format2, output_format3]
batch_result-= await OutlineLLMAnalysis.batch_analyze(contexts, requirements, output_formats)

# ========== 模拟 prompt 输入  ==========

# --------  构建用户输入  --------
from apps.doc_analysis.LLM_services._generic_llm_services import LLMRequest
request = LLMRequest(
                context = context,
                requirement = requirement,
                output_format = output_format
                )

# ------- 模拟大模型prompt输入  -------
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
sim_prompt = ChatPromptTemplate.from_messages([
    SystemMessagePromptTemplate.from_template(
        "你是一个专业的文档分析助手，需要严格按照用户要求处理和分析文档内容。"
    ),
    HumanMessagePromptTemplate.from_template(
        OutlineLLMAnalysis.build_prompt_template(),  # 植入prompt模板
        input_variables=["context", 
                         "requirement", 
                        "output_format",
                        ]
    )
])
#print(request.__dict__)
formatted_prompt = await sim_prompt.ainvoke(request.__dict__)

# ------  打印大模型的prompt输入  ------
#pprint(formatted_prompt)
formatted_messages = formatted_prompt.to_messages()
# 转换为字典列表
messages_dict = [
    {
        "role": message.type,
        "content": message.content
    } for message in formatted_messages
]
import json
prompt_json = json.dumps(messages_dict, ensure_ascii=False, indent=2) 
pprint(prompt_json)


"""