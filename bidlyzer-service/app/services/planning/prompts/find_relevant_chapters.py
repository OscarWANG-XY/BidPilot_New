import os
from typing import List, Dict, Tuple, Any, Optional
import logging
logger = logging.getLogger(__name__)

from app.services.llm.llm_models import LLMConfigModel
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from app.services.task_service import count_tokens




class FindRelevantChaptersPromptBuilder():
    """ 
    查找相关章节的prompt builder
    
    目标任务：利用大模型，根据给定的话题，从文档中找到相关的章节

    输入： doc:tiptapJSON, topic:str
    输出： prompt_config:Dict, task_inputs:List[Dict], meta:Dict
    附带： 模拟的prompt： raw_prompt, formatted_prompt:List[Dict]

    大模型调用： 单个调用
    
    
    """

    def __init__(self, doc: Any, topic: str):

        # 输入参数
        self.doc = doc
        self.topic = topic

        # 模型配置
        self.llm_config = self._build_llm_config().to_model()

        # 定义角色和prompt模板
        self.system_role = self._define_system_role()
        self.prompt_template = self._build_prompt_template()

        # 用户指令
        self.instruction = self._prepare_instruction()
        self.indexed_doc,_ = self._prepare_context()   # key payload 
        self.supplement = self._prepare_supplement()
        self.output_format = self._prepare_output_format()

        # meta
        _,self.index_path_map = self._prepare_context()
        self.token_usage = self._calculate_token_usage()
    

    def output_params(self) -> Tuple[Dict[str,any], List[Dict[str,any]], Dict[str,any]]:

        # 系统配置，角色，和prompt模板 
        prompt_config = {
            "llm_config": self.llm_config,
            "system_role": self.system_role,
            "prompt_template": self.prompt_template,
        }

        # 用户输入：指令， 上下文， 补充材料， 输出的格式
        task_inputs = [{
            "instruction": self.instruction,
            "context": self.indexed_doc,
            "supplement": self.supplement,
            "output_format": self.output_format,
        }]

        # 额外信息： index-path 映射表； 
        meta = {
            "index_path_map": self.index_path_map,
            "token_usage":self.token_usage
        }

        return prompt_config, task_inputs, meta


    def simulate_prompt(self) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
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
                self.system_role
            ),
            HumanMessagePromptTemplate.from_template(
                # self.task.prompt_template,
                self.prompt_template,
                input_variables=[
                    "context", 
                    "instruction",
                    "supplement",
                    "output_format",
                    ]
            )
        ])
        
        # 格式化模板
        raw_prompt = prompt.format_messages(
            instruction=self.instruction,
            context=self.indexed_doc,
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

        raw_prompts = [raw_prompt]
        formatted_prompts = [formatted_prompt]

        return raw_prompts, formatted_prompts


    def _define_system_role(self) -> str:

        return"""

你是招投标领域的文档分析专家，专门负责根据特定话题查找文档中的相关章节。

"""


    def _prepare_instruction(self) -> str:

        return f"""
我会提供某文档的完整文本（材料A），每条数据包含 content（文本）和 index（位置索引）。

请完成以下任务：
1. 根据给定话题 "{self.topic}" 分析文档内容。
2. 识别并找出与该话题相关的章节、段落或内容块。
3. 按相关性程度对找到的章节进行排序（最相关的排在前面）。
4. 提供每个相关章节的 index 位置和相关性说明。

"""


    def _prepare_context(self) -> Tuple[List[str], Dict[str, str]]:
        """
        准备请求数据
        """ 
        # docx_extraction_task = Task.objects.get(stage__project=project, type=TaskType.DOCX_EXTRACTION_TASK)
        
        from app.clients.tiptap.helpers import TiptapUtils
        indexed_doc, index_path_map = TiptapUtils.extract_indexed_paragraphs(self.doc, 50)

        return indexed_doc, index_path_map


    def _prepare_supplement(self) -> str:
        """
        准备补充 (对用户可见和修改) 
        """

        return f"查找话题：{self.topic}\n\n请重点关注与此话题直接相关或间接相关的内容，包括但不限于：技术规格、实施方案、服务要求、质量标准等。"
    

    def _prepare_output_format(self) -> str:

        return """
        
- 只输出符合JSON格式的数据，不要添加解释、注释或 Markdown 标记。
- 示例：
[
    {"index": int, "relevance_score": float, "chapter_title": str, "relevance_reason": str}, 
    {"index": int, "relevance_score": float, "chapter_title": str, "relevance_reason": str}
]
- relevance_score 范围为 0.0-1.0，1.0为最相关
- chapter_title 为章节标题或概述
- relevance_reason 简要说明相关性原因
- 按 relevance_score 降序排列

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
        """构建LLM配置， temperature = 0.3 和 top_p = 0.7, qwen-max-0125 模型 有较为稳定的输出"""
        return LLMConfigModel(
                    llm_model_name = "qwen-max-0125",  # qwen-plus
                    temperature = 0.3,
                    top_p =  0.7,
                    streaming = True,
                    api_key = os.getenv("ALIBABA_API_KEY"),
                    base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    max_workers = 4,
                    timeout = 30,
                    retry_times = 3
                )


    def _calculate_token_usage(self) -> Dict[str, int]:

        context_tokens = count_tokens(self.indexed_doc)
        instruction_tokens = count_tokens(self.instruction)
        supplement_tokens = count_tokens(self.supplement)
        output_format_tokens = count_tokens(self.output_format)
        prompt_template_tokens = count_tokens(self.prompt_template)
        in_tokens = context_tokens + instruction_tokens + supplement_tokens + output_format_tokens + prompt_template_tokens

        token_usage = {
            "in_tokens" : in_tokens,
            "context_tokens": context_tokens,
            "instruction_tokens": instruction_tokens,
            "supplement_tokens": supplement_tokens,
            "output_format_tokens": output_format_tokens,
            "prompt_template_tokens": prompt_template_tokens,
        }
        return token_usage


    def debug_output(self) -> None:
        """
        打印并检查输出数据的类型、结构和长度
        用于调试和验证输出格式是否符合预期
        """
        prompt_config, task_inputs, meta = self.output_params()
        raw_prompts, formatted_prompts = self.simulate_prompt()
        print(f"prompt_config:{type(prompt_config)}")
        print(f"task_inputs:{type(task_inputs)}，长度：{len(task_inputs)}，元素：{type(task_inputs[0])}")
        print(f"meta:{type(meta)}")
        print(f"raw_prompts:{type(raw_prompts)}，长度：{len(raw_prompts)}，元素：{type(raw_prompts[0])}")
        print(f"formatted_prompts:{type(formatted_prompts)}，长度：{len(formatted_prompts)}，元素：{type(formatted_prompts[0])}")
