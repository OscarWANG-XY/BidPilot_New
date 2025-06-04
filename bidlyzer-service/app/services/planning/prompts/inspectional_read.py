import os
from typing import List, Dict, Tuple, Any, Optional
import logging
logger = logging.getLogger(__name__)

from app.services.llm.llm_models import LLMConfigModel
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from app.services.task_service import count_tokens



class InspectionalReadPromptBuilder():

    """ 
    文档一级大纲分析的prompt builder
    
    目标任务：利用大模型，识别章节内容涉及的话题，并给出话题的key

    输入： doc:tiptapJSON, topics:Dict[str, str] 都是tiptapJSON文档
    过程核心： instructions + ouputformat 调整，  context 和 supplement 的准备（放在context_initialized中）
    输出： prompt_config: Dict(str, Any), task_input:List[Dict], meta:Dict(str, Any);
    附带： 模拟的prompt： raw_prompt, formatted_prompt

    大模型调用： 多个并发调用
    
    """

    def __init__(self, chapters_md: List[Dict[str, Any]], topics: Dict[str, str]):
        # 输入参数
        self.doc = chapters_md
        self.topics = topics

        # 模型配置
        self.llm_config = self._build_llm_config().to_model()

        # 定义角色和prompt模板
        self.system_role = self._define_system_role()
        self.prompt_template = self._build_prompt_template()

        # 用户指令
        # 移除直接调用，改为延迟初始化
        self.indexed_chapters = None
        self.supplement = None
        self._context_initialized = False
        
        self.instruction = self._prepare_instruction()
        self.output_format = self._prepare_output_format()

        # token_usage 也需要延迟计算，因为依赖 indexed_chapters
        self.token_usage = None

    def _ensure_context_initialized(self):
        """确保上下文已经初始化"""
        if not self._context_initialized:
            self.indexed_chapters = self._prepare_context()
            self.supplement = self._prepare_supplement()
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
                "context": chapter,
                "instruction": self.instruction,
                "supplement": self.supplement,
                "output_format": self.output_format,
            }
            task_inputs.append(task_params)

        meta = {
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
                context=indexed_chapter,
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

        return """
我会提供
1. 招标文档章节的详细内容【材料A】，包含章节位置（position）， 章节标题 和 章节内容 。
2. 一份话题列表【材料B】，每一行是话题的key对应话题的描述。
请通读文档章节的内容，分析该章节涉及话题列表中的哪些话题，并罗列涉及的话题的key， 与章节位置信息一起，以JSON格式输出。
"""


    def _prepare_context(self) -> Tuple[List[str], Dict[str, str]]:
        """
        准备请求数据
        """ 
        indexed_chapters = []
        for chapter in self.doc:
            formatted_chapter = f" Position： {chapter['position']} \n {chapter['content']}"

            indexed_chapters.append(formatted_chapter)


        return indexed_chapters


    def _prepare_supplement(self) -> str:
        """
        准备补充 (对用户可见和修改) 
        """

        from app.clients.tiptap.tools import print_defined_tables_columns
        supplement = print_defined_tables_columns(self.topics)


        return supplement
    


    def _prepare_output_format(self) -> str:
        return """
        
- 只输出符合JSON格式的数据，不要添加解释、注释或 Markdown 标记。
- 示例：
[
    {"topic_id": int, "position": int}, 
    {"topic_id": int, "position": int}
]
- 只罗列相关的话题，如果无相关话题，则输出空列表。

"""


    def _build_prompt_template(self) -> str:
            return """
你将执行以下任务：

【任务目标】
{instruction}

【输出格式】
{output_format}

以下是你将使用的内容：

【材料A：】
{context}

【材料B：】
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
        chapters_tokens = sum([count_tokens(indexed_chapter) for indexed_chapter in self.indexed_chapters])
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


