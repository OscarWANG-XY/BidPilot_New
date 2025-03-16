import asyncio, os, nest_asyncio
from typing import List, Dict, Tuple
import logging
logger = logging.getLogger(__name__)

from apps.projects.models import Project
from apps.projects.services.base import PipelineStep
from apps.projects.services.types.type_DocxElements import DocxElements
from apps.projects.services.types.base_TypesAndHelpers import ModelData
from apps.projects.services.types.type_OutlineAnalysisResult import OutlineAnalysisResult

from apps._tools.LLM_services._llm_data_types import BatchResult, LLMConfig
from apps._tools.LLM_services.llm_service import LLMService
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate




class DocxOutlineAnalyzerStep(PipelineStep[DocxElements, OutlineAnalysisResult]):
    """文档大纲分析器，用于比较和分析文档的目录(TOC)和大纲(Outline)结构"""

    def __init__(self):
        super().__init__()
        nest_asyncio.apply()  # 允许在Jupyter Notebook中运行异步代码


    def validate_input(self, data: DocxElements) -> bool:
        """
        验证输入数据是否有效
        """
        if not isinstance(data, DocxElements):
            return False
        if len(data.elements) == 0:
            return False
        if not data.document_analysis:
            return False
        return True
    

    def validate_output(self, data: OutlineAnalysisResult) -> bool:
        """
        验证输出数据是否有效
        """
        return isinstance(data, OutlineAnalysisResult) and data.project is not None



    def process(self, data: DocxElements) -> OutlineAnalysisResult:
        """
        处理文档元素，分析目录和正文标题的一致性
        """

        if not self.validate_input(data):
            raise ValueError("输入数据无效")
        
        
        # 提取当前分析的document_analysis, 注意：data.document_analysis 是ModelData类型
        current_project = data.project.instance

        data_inputs = self.prepare_requests_data(data)


        raw_batch_results = self.llm_analyze(
            data_inputs=data_inputs, 
            repeats=1
        )
        final_results = BatchResult.merge_hybrid(raw_batch_results)
        #final_results = BatchResult.merge_titles_to_detail(raw_batch_results)

        # --------------------- 大模型分析结束 -------------------- 

        # 创建 OutlineAnalysisResult 实例
        analysis_result = OutlineAnalysisResult(
            project= ModelData(model=Project, instance=current_project),  #需要经过ModelData包装
            analysis_result= final_results,
            user_confirm=False
        )

        if not self.validate_output(analysis_result):
            raise ValueError("大模型输出数据无效")
        
        # 保存分析结果
        current_project.outline_analysis_result = analysis_result.to_model()
        current_project.save()
        
        return analysis_result

    def llm_analyze(self, data_inputs: List[str], repeats: int = 1):
        # 构建LLM服务所需配置
        llm_config = self.build_llm_config(model_name="qwen-max-0125")
        prompt_template = self.build_prompt_template()
        output_format = OutlineAnalysisResult.get_prompt_specification()
        
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
    
    def prepare_requests_data(self, data) -> List[str]:
        """
        准备大模型分析所需的数据 data_inputs, 通常是List[str] 格式
        """

        # 1. 提取目录标题列表
        toc_chapters = data.format_toc_chapters()
        toc_sections = data.format_toc_sections()#[:118]
        toc_subsections = data.format_toc_subsections()

        # 2. 提取正文标题列表
        heading_chapters = data.format_heading_chapters()
        heading_sections = data.format_heading_sections()#[:120]
        heading_subsections = data.format_heading_subsections()

        # 3. 构建数据输入
        data_input1 = self._build_data_input(toc_chapters, heading_chapters)
        data_input2 = self._build_data_input(toc_sections, heading_sections)
        data_input3 = self._build_data_input(toc_subsections, heading_subsections)

        data_inputs = [data_input1, data_input2, data_input3]

        return data_inputs

    def _build_data_input(self, data1: str, data2: str) -> List[str]:
        """
        构建大模型分析所需的数据输入
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
                    llm_model_name = model_name,  # qwen-plus
                    temperature = 0.7,
                    top_p =  0.8,
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
分析招标文档的目录结构和正文标题之间的一致性

# Requirements
- 比对目录中的标题和正文中的实际标题
- 忽略标点符号和空格的差异
- 仅匹配标题的实际文本内容
- 分别罗列出"目录中存在但正文中不存在"和"正文中存在但目录中不存在"的标题

# Output
## Rules
- 只输出JSON格式的结果
- 不使用Markdown格式
- 确保JSON格式严格有效
- 空元素使用[]

## Format
{output_format}

# Input
{data_input}
"""

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
            output_format=OutlineAnalysisResult.get_prompt_specification()
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
