import asyncio, os
import nest_asyncio
from typing import List, Dict, Tuple
from ..pipeline.base import PipelineStep
from apps.doc_analysis.pipeline.types import DocxTree, ModelData, DocxTreeMoreTitles
from apps.doc_analysis.models import DocumentAnalysis
from apps.doc_analysis.LLM_services._llm_data_types import BatchResult, LLMConfig
from apps.doc_analysis.LLM_services.llm_service import LLMService
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

import logging
logger = logging.getLogger(__name__)


class MoreSubTitlesStep(PipelineStep[DocxTree, DocxTreeMoreTitles]):
    """文档大纲分析器，用于比较和分析文档的目录(TOC)和大纲(Outline)结构"""

    def __init__(self):
        super().__init__()
        nest_asyncio.apply()  # 允许在Jupyter Notebook中运行异步代码


    def process(self, data: DocxTree) -> DocxTreeMoreTitles:
        """
        处理文档元素，分析目录和正文标题的一致性
        """

        if not self.validate_input(data):
            raise ValueError("输入数据无效")
        
        
        # 提取当前分析的document_analysis, 注意：data.document_analysis 是ModelData类型
        current_document_analysis = data.document_analysis.instance

        data_inputs = self.prepare_requests_data(data)

        raw_batch_results = self.llm_analyze(
            data_inputs=data_inputs, 
            repeats=1
        )
        
        final_results = BatchResult.merge_titles_to_detail(raw_batch_results)

        # --------------------- 大模型分析结束 -------------------- 

        # 创建 OutlineAnalysisResult 实例
        analysis_result = DocxTreeMoreTitles(
            document_analysis= ModelData(model=DocumentAnalysis, instance=current_document_analysis),  #需要经过ModelData包装
            analysis_result= final_results,
            user_confirm=False
        )

        if not self.validate_output(analysis_result):
            raise ValueError("大模型输出数据无效")
        
        # 保存分析结果
        current_document_analysis.more_subtitles = analysis_result.to_model()
        current_document_analysis.save()
        
        return analysis_result

    def llm_analyze(self, data_inputs: List[str], repeats: int = 1):
        # 构建LLM服务所需配置
        llm_config = self.build_llm_config(model_name="qwen-max-0125")
        prompt_template = self.build_prompt_template()
        output_format = DocxTreeMoreTitles.get_prompt_specification()
        
        # 初始化LLM服务
        llm_service = LLMService(
            config=llm_config,
            prompt_template=prompt_template,
            output_format=output_format
        )

        # 异步分析封装
        async def _analyze():
            return await llm_service.batch_analyze_with_repeats(
                data_inputs=data_inputs,
                repeats=repeats
            )
        
        return asyncio.run(_analyze())
    
    def validate_input(self, data: DocxTree) -> bool:
        """
        验证输入数据是否有效
        """
        if not isinstance(data, DocxTree):
            return False
        if not data.document_analysis:
            return False
        return True
    
    def validate_output(self, data: DocxTreeMoreTitles) -> bool:
        """
        验证输出数据是否有效
        """
        return isinstance(data, DocxTreeMoreTitles) and data.document_analysis is not None

    def prepare_requests_data(self, data: DocxTree) -> List[str]:
        """
        准备大模型分析所需的数据 data_inputs, 通常是List[str] 格式
        """

        leaf_nodes = data.get_leaf_titles()

        data_inputs = []
        for node in leaf_nodes[:1]:
            data_input = data.format_leaf_node_content_html(node)
            data_inputs.append(data_input)

        return data_inputs

    def _build_data_input(self, data1: str, data2: str) -> List[str]:
        """
        构建大模型分析所需的数据输入, 用于需要比较的场景
        """
        return f"""
## TOC TITLE LIST
{data1}

## HEADING TITLE LIST
{data2}
"""
    
    def build_llm_config(self, model_name: str) -> LLMConfig:
        """构建LLM配置"""
        return LLMConfig(
                    llm_model_name = model_name,  
                    temperature = 0.2,
                    top_p =  0.9,
                    streaming = True,
                    api_key = os.getenv("ALIBABA_API_KEY"),
                    base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1",
                    max_workers = 4,
                    timeout = 30,
                    retry_times = 3
                )

    def build_prompt_template(self) -> str:
        return """
# Task
识别文档中当前标题的直接下级子标题。

# Requirements
判断依据:
- 段落表达完整的主题概念
- 与当前标题存在直接的从属关系
- 具有标题的特征格式

注意:
- 仅识别直接下级标题
- 忽略更深层级的内容
- 保持原章节编号不变

# Output
## Rules
- 输出JSON格式的层级结构
- 每个子标题包含其文本内容和层级信息
- 保留原始段落与新识别子标题的对应关系
- 空内容使用[]

## Format
{output_format}

# Input
{data_input}
"""

    def simulate_prompt(self, data_input: str) -> str:
        """
        模拟生成完整的 prompt
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
            output_format=DocxTreeMoreTitles.get_prompt_specification()
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
