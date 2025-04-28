import asyncio, os, nest_asyncio
from typing import List, Dict, Tuple, Any, Optional
import logging
logger = logging.getLogger(__name__)

from apps.projects.models import Project, Task, TaskType, TaskStatus, ProjectStage, StageType
from apps.projects.services.base import PipelineStep
from apps.projects.utils.redis_manager import RedisManager

from apps._tools.LLM_services._llm_data_types import LLMConfig
from apps._tools.LLM_services.llm_service import LLMService
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from apps.projects.services.task_service import count_tokens


# 目标 -> 准备好以下内容
# context, instruction(要解决的问题, 包括output_format要求), supplemnt相关补充  (对用户可见)
# prompt Template 将 context, instruction, supplemnt 组织到一块  （对用户不可见）。  
# llm_config 配置模型参数 （对用户不可见）


class AppendixAnalysis():
    """附件模板分析器，用于提取附件模板"""

    def __init__(self, doc: Any, paths: List[List[int]]):
        # 类的传参都一定会经过__init__方法， 基本它写在类后面的（）里。  
        # 想让对象记住一个变量，都需要在变量前加self. 
        self.doc = doc
        self.paths = paths
        self.contexts, self.index_path_map = self._prepare_context()
        self.instruction = self._prepare_instruction()
        self.supplement = self._prepare_supplement()
        self.output_format = self._prepare_output_format()
        self.prompt_template = self._build_prompt_template()
        self.llm_config = self._build_llm_config().to_model()

        self.context_tokens = sum(count_tokens(context) for context in self.contexts)
        self.instruction_tokens = count_tokens(self.instruction)
        self.supplement_tokens = count_tokens(self.supplement)
        self.output_format_tokens = count_tokens(self.output_format)
        self.prompt_template_tokens = count_tokens(self.prompt_template)
        self.in_tokens = self.context_tokens + self.instruction_tokens + self.supplement_tokens + self.output_format_tokens + self.prompt_template_tokens


    def output_params(self) -> Tuple[Dict[str,any], Dict[str,any], Dict[str,any]]:
        # 
        model_params = {
            "llm_config": self.llm_config,
            "prompt_template": self.prompt_template,
        }

        tasks = []
        for context in self.contexts:
            task = {
                "context": context,
                "instruction": self.instruction,
                "supplement": self.supplement,
                "output_format": self.output_format,
            }
            tasks.append(task)
        meta = {
            "index_path_map": self.index_path_map,
            "in_tokens" : self.in_tokens,
            "context_tokens": self.context_tokens,
            "instruction_tokens": self.instruction_tokens,
            "supplment_tokens":self.supplement_tokens,
            "output_format_tokens": self.output_format_tokens,
            "prompt_template_tokens": self.prompt_template_tokens
        }

        return model_params, tasks, meta


    def _prepare_context(self) -> Tuple[str, Dict[str, str]]:
        """
        准备请求数据
        """ 
        
        from apps.projects.tiptap.helpers import TiptapUtils

        contexts=[]
        for path in self.paths:
            context = TiptapUtils.extract_content_under_heading(self.doc, path, format="markdown")
            contexts.append(context)
        
        index_path_map = {}

        return contexts, index_path_map


    def _prepare_supplement(self) -> str:
        """
        准备补充 (对用户可见和修改) 
        """

        return "暂无补充内容"
    

    def _prepare_instruction(self) -> str:

#         return """
# 你是招投标领域的投标文件编写专家。  
# 请根据附件的内容（材料A）分析： 在投标文件里，我们应该如何回应 （假设所需材料都已准备完毕）？

# """




        return """
你是招投标领域的投标文件编写专家。  
现有两份材料：

材料A：招标文件中的一个附件，通常为资格审查表或响应性检查表，包含评审项目、合格标准及具体要求。  
材料B：是投标人提供的企业基础资料，用于支撑响应内容。

假设所需材料都已经线下准备完毕，
请结合材料A和B，为我编写投标文件中对应附件的【完整响应内容】，便于直接使用或稍加修改后提交。

"""


    def _prepare_output_format(self) -> str:

        # return""" 无特定要求 """


        return """
输出格式：
- 如附件提供了模板，请按模板格式输出
- 如附件没有提供模板，请参考行业标准，编写完整响应内容
"""

#         return """
        
# - 只输出符合JSON格式的数据，不要添加解释、注释或 Markdown 标记。
# - 示例：
# [
#     {"标题": str, "是否为模板": bool,"是否在投标文件里引用": bool, "响应内容": str}, 
# ]

# """


    def _build_prompt_template(self) -> str:
            return """
你将执行以下任务：

【任务目标】
{instruction}

【输出格式】
{output_format}

以下是你将使用的内容：

【材料A：主要上下文】
{context}

【材料B：补充信息】
{supplement}

请严格根据材料A和B完成任务。

"""


    def _build_llm_config(self) -> LLMConfig:
        """构建LLM配置， temperature = 0.2 和 top_p = 0.6, qwen-max-0125 模型 有较为稳定的输出"""
        return LLMConfig(
                    llm_model_name = "qwen-max-0125",  # qwen-plus
                    temperature = 0.2,
                    top_p =  0.6,
                    streaming = True,
                    api_key = os.getenv("ALIBABA_API_KEY"),
                    base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    max_workers = 4,
                    timeout = 30,
                    retry_times = 3
                )
    

#    def simulate_prompt(self) -> str:
    def simulate_prompt(self) -> Tuple[str, List[Dict[str, Any]]]:
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
                # self.task.prompt_template,
                self.prompt_template,
                input_variables=[
                    "context", 
                    "instruction"
                    "supplement"
                    "output_format"
                    ]
            )
        ])
        
        # 格式化模板
        simulated_prompt_set = []
        formatted_prompt_set = []
        for context in self.contexts:
            simulated_prompt = prompt.format_messages(
                context=context,
                instruction=self.instruction,
                supplement=self.supplement,
                output_format=self.output_format

            )

            # 转换为易读的格式
            formatted_prompt = [
                {
                    "role": message.type,
                    "content": message.content
                }
                for message in simulated_prompt
            ]
            simulated_prompt_set.append(simulated_prompt)
            formatted_prompt_set.append(formatted_prompt)
        
        return simulated_prompt_set, formatted_prompt_set
