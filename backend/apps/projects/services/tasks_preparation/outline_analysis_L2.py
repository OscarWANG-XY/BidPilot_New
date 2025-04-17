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


class OutlineAnalysisL2():
    """文档大纲分析器，用于提取OutlineL1"""

    def __init__(self, project_id: str):
        # 类的传参都一定会经过__init__方法， 基本它写在类后面的（）里。  
        # 想让对象记住一个变量，都需要在变量前加self. 
        self.project = Project.objects.get(id=project_id)
        self.chapter_set = self._prepare_context(self.project)
        self.instruction = self._prepare_instruction()
        self.supplement = self._prepare_supplement()
        self.output_format = self._prepare_output_format()
        self.prompt_template = self._build_prompt_template()
        self.llm_config = self._build_llm_config().to_model()

        self.instruction_tokens = count_tokens(self.instruction)
        self.supplement_tokens = count_tokens(self.supplement)
        self.output_format_tokens = count_tokens(self.output_format)
        self.prompt_template_tokens = count_tokens(self.prompt_template)
        self.in_tokens = self.instruction_tokens + self.supplement_tokens + self.output_format_tokens + self.prompt_template_tokens

        #存储 index_path_map
        self.index_path_map = self.chapter_set["index_path_map"]
        self.project.index_path_map_L2 = self.index_path_map
        self.project.save()

    def output_params(self) -> List[Dict[str,any]]:

        output_params_set = []
        index_path_map = self.index_path_map

        for chapter in self.chapter_set["chapters"]:
        #   
            model_params = {
                "context": chapter["paragraphs"],
                "instruction": self.instruction,
                "supplement": self.supplement,
                "output_format": self.output_format,
                "prompt_template": self.prompt_template,
                "llm_config": self.llm_config,
                "in_tokens" : self.in_tokens + count_tokens(chapter["paragraphs"])
            }
            output_params_set.append(model_params)
        return output_params_set, index_path_map


    def _prepare_context(self, project: Project) -> Tuple[List[str], Dict[str, str]]:
        """
        准备请求数据
        """ 
        # docx_extraction_task = Task.objects.get(stage__project=project, type=TaskType.DOCX_EXTRACTION_TASK)
        
        # from apps.projects.tiptap.helpers import TiptapUtils
        # data_input, index_path_map = TiptapUtils.extract_indexed_paragraphs(project.tender_file_extraction, 50)

        # return data_input, index_path_map

        from apps.projects.tiptap.helpers import TiptapUtils
        chapter_set = TiptapUtils.extract_chapters(
            doc = project.tender_file_extraction_L1, 
            max_length = None,
            heading_types = ['heading1']
            )
        return chapter_set


    def _prepare_supplement(self) -> str:
        """
        准备补充 (对用户可见和修改) 
        """

        return "此任务无补充内容"
    

    def _prepare_instruction(self) -> str:

#         return """
# 我会提供某章节的正文文本（材料A），每条数据包含 content（文本内容）和 index（位置索引，按顺序排列）。

# 请完成以下任务：

# 1. 识别正文中的标题（最多两个层级），这些标题是正文内容的一部分，不是目录、封面或附录列表中的标题。
# 2. 如果正文中包含附录（如“附件 1 投标函”这类结构化标题），请提取这些附录标题。仅提取实际出现在正文中的附录标题，而非目录或附录索引列表中出现的。
# 3. 忽略所有非正文的结构，如目录、封面、附录索引列表中的标题。
# """

#version 2, 以下版本对于标题的识别在<北京铁路的标书上有高质量和稳定的输出>
# 经验： 一条一条增加地尝试，不要一次给一堆指令，否则我们无法指导哪条指令是有效的。 
        return """
我会提供某章节的正文文本（材料A），每条数据包含 content（文本）和 index（位置索引）。

请完成以下任务：
1. 识别正文中的标题，最多两个层级。
2. 请注意区分章节开头的目录和正文的标题，不要将目录的标题作为正文的标题。
3. 请注意区分列表和正文的标题，不要将列表项作为正文的标题。

"""
# 2. 如果章节有附录，请罗列每一个附录的标题。
# 3. 忽略目录列表、附录列表和封面的标题。

#         return """
# 我会提供某章节的正文文本（材料A），每条数据包含 content（文本）和 index（位置索引）。

# 请完成以下任务：
# 1. 识别正文中的标题，最多两个层级。
# 2. 忽略目录、封面、附件等非正文区域的标题。
# """


    def _prepare_output_format(self) -> str:
        return """
        
- 只输出符合JSON格式的数据，不要添加解释、注释或 Markdown 标记。
- 示例：
[
    {"index": int, "level": int, "title": str}, 
    {"index": int, "level": int, "title": str}
]
- 一个标题一条数据， 如果只有一个层级的标题，则只输出一个层级。
- 如未识别到标题，返回空列表。

"""

# """

# 输入示例： 

# [
#   {"content": "第六章 投标文件格式", "index": 484},
#   {"content": "6.1 评标方法", "index": 512},
#   {"content": "6.1.1 资格审查", "index": 530},
#   {"content": "本项目采用综合评分法", "index": 540}
# ]


# JSON输出示例：

# {"index": 512, "level": 2, "title": "6.1 评标方法"}
# {"index": 530, "level": 3, "title": "6.1.1 资格审查"}
        
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
        for chapter in self.chapter_set["chapters"]:
            simulated_prompt = prompt.format_messages(
                context=chapter["paragraphs"],
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
