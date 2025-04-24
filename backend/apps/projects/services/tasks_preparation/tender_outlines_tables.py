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


class TenderOutlinesTables():
    """文档大纲分析器，用于提取OutlineL1"""

    def __init__(self, data_input: Any):
        # 类的传参都一定会经过__init__方法， 基本它写在类后面的（）里。  
        # 想让对象记住一个变量，都需要在变量前加self. 
        self.data_input = data_input
        self.tables, self.index_path_map = self._prepare_context()
        self.instruction = self._prepare_instruction()
        self.supplement = self._prepare_supplement()
        self.output_format = self._prepare_output_format()
        self.prompt_template = self._build_prompt_template()
        self.llm_config = self._build_llm_config().to_model()

        self.tables_tokens = sum([count_tokens(table["markdown"]) for table in self.tables])
        self.instruction_tokens = count_tokens(self.instruction)
        self.supplement_tokens = count_tokens(self.supplement)
        self.output_format_tokens = count_tokens(self.output_format)
        self.prompt_template_tokens = count_tokens(self.prompt_template)
        self.in_tokens = self.tables_tokens + self.instruction_tokens + self.supplement_tokens + self.output_format_tokens + self.prompt_template_tokens

    def output_params(self) -> Tuple[Dict[str,any], List[Dict[str,any]], Dict[str,any]]:

        model_params = {
            "llm_config": self.llm_config,
            "prompt_template": self.prompt_template,
        }

        tasks = []
        for table in self.tables:
            task_params = {
                "context": table["markdown"],
                "instruction": self.instruction,
                "supplement": self.supplement,
                "output_format": self.output_format,
            }
            tasks.append(task_params)

        meta = {
            "index_path_map": self.index_path_map,
            "in_tokens" : self.in_tokens,
            "tables_tokens": self.tables_tokens,
            "instruction_tokens": self.instruction_tokens,
            "supplment_tokens":self.supplement_tokens,
            "output_format_tokens": self.output_format_tokens,
            "prompt_template_tokens": self.prompt_template_tokens
        }

        return model_params, tasks, meta

    def _prepare_context(self) -> Tuple[List[str], Dict[str, str]]:
        """
        准备请求数据
        """ 

        from apps.projects.tiptap.helpers import TiptapUtils

        tables, index_path_map = TiptapUtils.extract_tables_to_markdown(self.data_input)

        return tables, index_path_map


    def _prepare_supplement(self) -> str:
        """
        准备补充 (对用户可见和修改) ===
        """

        return "此任务无补充内容"
    

    def _prepare_instruction(self) -> str:

        return """
我提供了表格的markdown文本（材料A），每个表格有一个index（位置索引）。
任务要求：
1. 请根据表格的内容，制定表格的caption。
2. 请将我提供的markdown文本视为完整的一个表格，不要将表格拆分。

"""



    def _prepare_output_format(self) -> str:
        return """
        
- 只输出符合JSON格式的数据，不要添加解释、注释或 Markdown 标记。
- 示例：
[
    {"index": int, "caption": str}
]
- 如果表格为空，则返回空列表。

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
                    llm_model_name = "qwen-max-0125",  
                    temperature = 0.2,
                    top_p =  0.6,
                    streaming = True,
                    api_key = os.getenv("ALIBABA_API_KEY"),
                    base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    max_workers = 4,
                    timeout = 60,
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
        for table in self.tables:
            simulated_prompt = prompt.format_messages(
                context=table["markdown"],
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
