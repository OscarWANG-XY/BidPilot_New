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


class OutlineAnalysis():
    """文档大纲分析器，用于比较和分析文档的目录(TOC)和大纲(Outline)结构"""

    def __init__(self, project_id: str):
        # 类的传参都一定会经过__init__方法， 基本它写在类后面的（）里。  
        # 想让对象记住一个变量，都需要在变量前加self. 
        self.project = Project.objects.get(id=project_id)
        self.stage = ProjectStage.objects.get(project=self.project, stage_type=StageType.TENDER_ANALYSIS)
        self.task = Task.objects.get(stage__project=self.project, type=TaskType.OUTLINE_ANALYSIS_TASK)

    def prepare_for_task(self) -> None:
        """
        准备context, instruction, supplement, output_format, prompt_template, llm_config, 
        """
        
        
        data_input, index_path_map = self._prepare_context(self.project)
        self.task.context = data_input
        self.task.instruction = self._prepare_instruction()
        self.task.supplement = self._prepare_supplement()
        self.task.output_format = self._prepare_output_format()
        self.task.prompt_template = self._build_prompt_template()
        self.task.llm_config = self._build_llm_config().to_model()
        self.task.index_path_map = index_path_map
        self.task.context_tokens = count_tokens(self.task.context)
        self.task.instruction_tokens = count_tokens(self.task.instruction)
        self.task.supplement_tokens = count_tokens(self.task.supplement)
        self.task.output_format_tokens = count_tokens(self.task.output_format)
        self.task.prompt_template_tokens = count_tokens(self.task.prompt_template)
        self.task.in_tokens = self.task.context_tokens + self.task.instruction_tokens + self.task.supplement_tokens + self.task.output_format_tokens + self.task.prompt_template_tokens

        self.task.save()  

        return None

    def _prepare_context(self, project: Project) -> Tuple[List[str], Dict[str, str]]:
        """
        准备请求数据
        """ 
        docx_extraction_task = Task.objects.get(stage__project=project, type=TaskType.DOCX_EXTRACTION_TASK)
        
        from apps.projects.tiptap.helpers import TiptapUtils
        data_input, index_path_map = TiptapUtils.extract_indexed_paragraphs(docx_extraction_task.docx_tiptap, 50)

        return data_input, index_path_map


    def _prepare_supplement(self) -> str:
        """
        准备补充 (对用户可见和修改) 
        """

        return ""
    

    def _prepare_instruction(self) -> str:
        return """
你是一个擅长文档结构分析的AI助手， 我会提供一些文本内容（见材料A）， 每条数据包含 content（文本内容）和 index（索引）。你的任务是：
识别标题：判断文本是否是一个章节标题（例如"第X章"、"X.X"、"X.X.X" 等， 也可能是其他格式）。
确定层级：
"第X章" → H1（#）
"X.X" → H2（##）
"X.X.X" → H3（###）
如果不是标题，则忽略

"""


    def _prepare_output_format(self) -> str:
        return """

生成 Markdown：
标题使用相应级别的 Markdown 语法（#）
保留 index 信息，使用 <!-- index: xxx --> 注释格式

输入示例： 

[
  {"content": "第六章 投标文件格式", "index": 484},
  {"content": "6.1 评标方法", "index": 512},
  {"content": "6.1.1 资格审查", "index": 530},
  {"content": "本项目采用综合评分法", "index": 540}
]


输出示例：

<!-- index: 484 -->
# 第六章 投标文件格式

<!-- index: 512 -->
## 6.1 评标方法

<!-- index: 530 -->
### 6.1.1 资格审查

"""



    def _build_prompt_template(self) -> str:
            return """
你将执行以下任务：

【任务目标】
{instructions}

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
    

    def simulate_prompt(self, data_input: str) -> str:
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
                self.build_prompt_template(),
                input_variables=["data_input", "output_format"]
            )
        ])
        
        # 格式化模板
        simulated_prompt = prompt.format_messages(
            data_input=data_input,
            output_format=self.output_format_required()
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


    async def process_streaming(self, stream_id: Optional[str] = None) -> str:
        """
        流式处理文档元素，分析目录和正文标题的一致性
        """

        # 初始化LLM服务
        llm_service = LLMService(
            config=self.llm_config,
            output_format=self.output_format,
            prompt_template=self.prompt_template,
        )
        
        # 准备元数据
        metadata = {
            "model": self.llm_config.llm_model_name,
            "index_path_map": self.index_path_map
        }
        
        # 执行流式分析
        # 返回的是ID，不是分析的内容，因为内容直接存储在Redis中.
        await llm_service.analyze_streaming(
            data_input=self.data_input,
            stream_id = stream_id,
            metadata=metadata
        )
        
        return stream_id