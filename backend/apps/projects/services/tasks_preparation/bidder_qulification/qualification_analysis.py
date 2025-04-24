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


class QualificationAnalysis():
    """投标人资格要求分析器，用于提取投标人资格要求"""

    def __init__(self, data_input: Any, paths: List[List[int]]):
        # 类的传参都一定会经过__init__方法， 基本它写在类后面的（）里。  
        # 想让对象记住一个变量，都需要在变量前加self. 
        self.data_input = data_input
        self.paths = paths
        self.context, self.index_path_map = self._prepare_context()
        self.instruction = self._prepare_instruction()
        self.supplement = self._prepare_supplement()
        self.output_format = self._prepare_output_format()
        self.prompt_template = self._build_prompt_template()
        self.llm_config = self._build_llm_config().to_model()

        self.context_tokens = count_tokens(self.context)
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

        task = {
            "context": self.context,
            "instruction": self.instruction,
            "supplement": self.supplement,
            "output_format": self.output_format,
        }

        meta = {
            "index_path_map": self.index_path_map,
            "in_tokens" : self.in_tokens,
            "context_tokens": self.context_tokens,
            "instruction_tokens": self.instruction_tokens,
            "supplment_tokens":self.supplement_tokens,
            "output_format_tokens": self.output_format_tokens,
            "prompt_template_tokens": self.prompt_template_tokens
        }

        return model_params, task, meta


    def _prepare_context(self) -> Tuple[List[str], Dict[str, str]]:
        """
        准备请求数据
        """ 
        # docx_extraction_task = Task.objects.get(stage__project=project, type=TaskType.DOCX_EXTRACTION_TASK)
        
        from apps.projects.tiptap.helpers import TiptapUtils

        parts = []
        for path in self.paths:
            part = TiptapUtils.extract_content_under_heading(self.data_input, path)
            parts.append(part)

        context = "\n\n\n".join(parts)
        
        index_path_map = {}

        return context, index_path_map


    def _prepare_supplement(self) -> str:
        """
        准备补充 (对用户可见和修改) 
        """

        return "此任务无补充内容"
    

    def _prepare_instruction(self) -> str:


        return """
材料A提供了招标文件里关于 投标人资格要求的 详细说明。

请为我逐条整理，输出要求要点、所需证明材料、准备工作建议。

"""



    def _prepare_output_format(self) -> str:

        # return""" 无特定要求 """

        return """
        
- 以Markdown表格格式输出，不要添加解释、注释或 Markdown 标记。。
- 表头分别为：编号、要求要点、所需证明材料、准备工作建议、 我方是否满足。
- 一个要求一条数据。 
- 我方是否满足 一栏留空，作为用户后期填写。

"""


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
        simulated_prompt = prompt.format_messages(
            context=self.context,
            instruction=self.instruction,
            supplement=self.supplement,
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
