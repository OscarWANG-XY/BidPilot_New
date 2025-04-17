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


class OutlineAnalysisL1():
    """文档大纲分析器，用于提取OutlineL1"""

    def __init__(self, project_id: str):
        # 类的传参都一定会经过__init__方法， 基本它写在类后面的（）里。  
        # 想让对象记住一个变量，都需要在变量前加self. 
        self.project = Project.objects.get(id=project_id)
        self.context, self.index_path_map = self._prepare_context(self.project)
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

        #存储 index_path_map
        self.project.index_path_map_L1 = self.index_path_map
        self.project.save()

    def output_params(self) -> Dict[str,any]:
        # 
        model_params = {
            "context": self.context,
            "index_path_map": self.index_path_map,
            "instruction": self.instruction,
            "supplement": self.supplement,
            "output_format": self.output_format,
            "prompt_template": self.prompt_template,
            "llm_config": self.llm_config,
            "in_tokens" : self.in_tokens
        }
        return model_params


    def _prepare_context(self, project: Project) -> Tuple[List[str], Dict[str, str]]:
        """
        准备请求数据
        """ 
        # docx_extraction_task = Task.objects.get(stage__project=project, type=TaskType.DOCX_EXTRACTION_TASK)
        
        from apps.projects.tiptap.helpers import TiptapUtils
        data_input, index_path_map = TiptapUtils.extract_indexed_paragraphs(project.tender_file_extraction, 50)

        return data_input, index_path_map


    def _prepare_supplement(self) -> str:
        """
        准备补充 (对用户可见和修改) 
        """

        return "此任务无补充内容"
    

    def _prepare_instruction(self) -> str:

# 以下版本有比较稳定的输出
        return """
我会提供某文档的完整文本（材料A），每条数据包含 content（文本）和 index（位置索引）。

请完成以下任务：
1. 识别文档最高层级的标题。
2. 请仅识别正文中的标题，忽略目录、封面页的标题，忽略附件中的重复章节名称。

"""

#         return """
# 你是一个擅长文档结构分析的AI助手， 我会提供一些文本内容（见材料A）， 每条数据包含 content（文本内容）和 index（索引）。
# 你的任务是：
# 1) 识别文本中最高层级的标题, 注意只识别最高的一个层级。
# 2) 请仅识别正文中的标题，忽略目录、封面页和附件中的重复章节名称。
# 如果不是标题，则忽略
# 如果内容是目录、封面页和附件中的重复章节名称，则忽略
# """


    def _prepare_output_format(self) -> str:

        return """
        
- 只输出符合JSON格式的数据，不要添加解释、注释或 Markdown 标记。
- 示例：
[
    {"index": int, "level": int, "title": str}, 
    {"index": int, "level": int, "title": str}
]
- 一个标题一条数据， 只输出最高层级的标题。

"""

#         return """
# 生成 JSON：
# - 结果按以下输出示例格式输出：
# - 只输出最高层级的标题
# - 非标题内容完全忽略，不生成任何输出

# 输入示例： 

# [
#   {"content": "第六章 投标文件格式", "index": 484},
#   {"content": "6.1 评标方法", "index": 512},
#   {"content": "6.1.1 资格审查", "index": 530},
#   {"content": "本项目采用综合评分法", "index": 540}
# ]


# JSON输出示例：

# {"index": 484, "level": 1, "title": "第六章 投标文件格式"}
        
#         """


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
        """构建LLM配置"""
        return LLMConfig(
                    llm_model_name = "qwen-max-0125",  # qwen-plus
                    temperature = 0.7,
                    top_p =  0.8,
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
