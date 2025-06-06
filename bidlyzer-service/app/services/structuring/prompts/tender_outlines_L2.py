import os
from typing import List, Dict, Tuple, Any
import logging
logger = logging.getLogger(__name__)

from app.services.llm.llm_models import LLMConfigModel
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from app.services.task_service import count_tokens


# 目标 -> 准备好以下内容
# context, instruction(要解决的问题, 包括output_format要求), supplemnt相关补充  (对用户可见)
# prompt Template 将 context, instruction, supplemnt 组织到一块  （对用户不可见）。  
# llm_config 配置模型参数 （对用户不可见）


class TenderOutlinesL2PromptBuilder():

    """ 
    文档二、三级大纲分析的prompt builder
    
    目标任务：利用大模型，从DOC文档里 识别 最高层级 的标题

    输入： doc:tiptapJSON
    输出： prompt_config: Dict(str, Any), task_input:List[Dict], meta:Dict(str, Any);
    附带： 模拟的prompt： raw_prompt, formatted_prompt

    大模型调用： 多个并发调用
    
    """

    def __init__(self, doc: Any):

        # 输入参数
        self.doc = doc

        # 模型配置
        self.llm_config = self._build_llm_config().to_model()

        # 定义角色和prompt模板
        self.system_role = self._define_system_role()
        self.prompt_template = self._build_prompt_template()

        # 用户指令
        # 移除直接调用，改为延迟初始化
        self.indexed_chapters = None
        self.index_path_map = None
        self._context_initialized = False
        
        self.instruction = self._prepare_instruction()
        self.supplement = self._prepare_supplement()
        self.output_format = self._prepare_output_format()

        # token_usage 也需要延迟计算，因为依赖 indexed_chapters
        self.token_usage = None

    def _ensure_context_initialized(self):
        """确保上下文已经初始化"""
        if not self._context_initialized:
            self.indexed_chapters, self.index_path_map = self._prepare_context()
            self.token_usage = self._calculate_token_usage()
            self._context_initialized = True

    def output_params(self) -> Tuple[Dict[str,any], List[Dict[str,any]], Dict[str,any]]:
        # 确保上下文已初始化
        self._ensure_context_initialized()
        
        # 多任务主要通过task_inputs 来体现
        prompt_config = {
            "llm_config": self.llm_config,
            "prompt_template": self.prompt_template,
            "system_role": self.system_role,
        }

        task_inputs = []
        for chapter in self.indexed_chapters:
            task_params = {
                "context": chapter["content"],
                "instruction": self.instruction,
                "supplement": self.supplement,
                "output_format": self.output_format,
            }
            task_inputs.append(task_params)

        meta = {
            "index_path_map": self.index_path_map,
            "token_usage": self.token_usage
        }

        return prompt_config, task_inputs, meta
    
    def simulate_prompt(self) -> Tuple[List[Dict[str,Any]], List[Dict[str,Any]]]:
        """
        模拟生成完整的 prompt
        
        Args:
            context: 输入的上下文信息
            
        Returns:
            str: 完整的 prompt 内容
        """
        # 确保上下文已初始化
        self._ensure_context_initialized()
        
        # 创建聊天提示模板
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(
                self.system_role
            ),
            HumanMessagePromptTemplate.from_template(
                # self.task.prompt_template,
                self.prompt_template,
                input_variables=[
                    "context", 
                    "instruction",
                    "supplement",
                    "output_format"
                    ]
            )
        ])
        
        # 格式化模板
        raw_prompts = []
        formatted_prompts = []
        for indexed_chapter in self.indexed_chapters:
            raw_prompt = prompt.format_messages(
                context=indexed_chapter["paragraphs"],
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
                for message in raw_prompt
            ]
            raw_prompts.append(raw_prompt)
            formatted_prompts.append(formatted_prompt)
        
        return raw_prompts, formatted_prompts


    def _define_system_role(self) -> str:

        return"""

你是招投标领域的投标文件编写专家。

"""


    def _prepare_instruction(self) -> str:

# 我会提供招标文件提取的文档片段（材料A），每条数据包含 content（文本）和 position（位置索引）。
# 文档片段可能是文档开头的封面和目录，也可能是文档的章节片段。

# 请忽略封面或目录，对于章节片段请完成以下任务：
# 1. 识别正文中的标题
# 2. 请注意区分章节开头的目录和正文的标题，不要将目录的标题作为正文的标题。
# 3. 请注意区分列表和正文的标题，不要将列表项作为正文的标题。
# 4. 请注意包含章节末尾的附件标题，但忽略章节开头的附件标题目录。



        return """
我会提供招标文件章节片段（材料A），第一条为章节标题，之后每条数据包含 content（文本）和 position（位置索引）。

对于章节片段请完成以下任务：
1. 识别所有的章节子标题
2. 请注意区分章节开头的目录和章节正文，不要将章节开头的目录作为章节的子标题。
3. 请注意区分列表和章节正文的子标题，不要将列表项作为章节子标题。
4. 请注意包含章节末尾的附件标题，但忽略章节开头的附件标题目录。
"""


    def _prepare_context(self) -> Tuple[List[str], Dict[str, str]]:
        """
        准备请求数据
        """ 

        from app.clients.tiptap.tools import formatted_chapters_md_with_position
        indexed_chapters = formatted_chapters_md_with_position(self.doc)
        index_path_map = {}

        return indexed_chapters, index_path_map


    def _prepare_supplement(self) -> str:
        """
        准备补充 (对用户可见和修改) 
        """

        return "此任务无补充内容"
    


    def _prepare_output_format(self) -> str:
        return """
        
- 只输出符合JSON格式的数据，不要添加解释、注释或 Markdown 标记。
- 示例：
[
    {"position": int, "level": int, "title": str}, 
    {"position": int, "level": int, "title": str}
]
- 一个标题一条数据， 如果只有一个层级的标题，则只输出一个层级。
- 如未识别到标题，返回空列表。

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


    def _build_llm_config(self) -> LLMConfigModel:
        """构建LLM配置， temperature = 0.2 和 top_p = 0.6, qwen-max-0125 模型 有较为稳定的输出"""
        return LLMConfigModel(
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
    
    def _calculate_token_usage(self) -> Dict[str, int]:
        """计算token使用量"""
        chapters_tokens = sum([count_tokens(indexed_chapter["content"]) for indexed_chapter in self.indexed_chapters])
        instruction_tokens = count_tokens(self.instruction)
        supplement_tokens = count_tokens(self.supplement)
        output_format_tokens = count_tokens(self.output_format)
        prompt_template_tokens = count_tokens(self.prompt_template)
        in_tokens = chapters_tokens + instruction_tokens + supplement_tokens + output_format_tokens + prompt_template_tokens

        token_usage = {
            "in_tokens": in_tokens,
            "chapters_tokens": chapters_tokens,
            "instruction_tokens": instruction_tokens,
            "supplement_tokens": supplement_tokens,
            "output_format_tokens": output_format_tokens,
            "prompt_template_tokens": prompt_template_tokens
        }
        return token_usage


