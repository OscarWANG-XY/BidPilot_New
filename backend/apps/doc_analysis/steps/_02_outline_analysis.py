import asyncio
import nest_asyncio
from typing import List, Dict
from ..pipeline.base import PipelineStep
from ..pipeline.types import DocxElements, OutlineAnalysisResult
from apps.doc_analysis.services.llm_services import BidAnalysisService, LLMAnalysisInput
from apps.doc_analysis.pipeline.types import DocxElements, OutlineAnalysisResult, ModelData
from apps.doc_analysis.models import DocumentAnalysis

import logging
logger = logging.getLogger(__name__)

class DocxOutlineAnalyzerStep(PipelineStep[DocxElements, OutlineAnalysisResult]):
    """文档大纲分析器，用于比较和分析文档的目录(TOC)和大纲(Outline)结构"""

    def __init__(self, model_name: str = "qwen-plus"):
        super().__init__()
        self.model_name = model_name
        self.bid_llm_analyzer = BidAnalysisService(model_name=model_name)
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
        required_keys = {"toc_only_elements", "heading_only_elements"}
        return isinstance(data, OutlineAnalysisResult) and all(key in data.to_model() for key in required_keys) and data.document_analysis is not None

    def _build_context(self, formatted_toc: str, formatted_headings: str) -> str:
        return f"""
1. 目录标题列表：从文档目录中提取的标题
2. 正文标题列表：从文档正文中提取的标题

数据格式：
"[文档位置], 标题层级, 标题内容"

输入数据：
1. <目录标题列表>：
{formatted_toc}

2. <正文标题列表>：
{formatted_headings}
"""

    def _build_requirement(self) -> str:
        """
        构建大模型分析任务要求
        """
        return """
请对比<目录标题列表>和<正文标题列表>的标题内容
找出以下三类不同标题项：
1. 目录列表里有，但正文里没有的标题项
2. 目录列表里没有，但正文里有的标题项

请注意：只比对标题内容，不比对[文档位置] 和 标题层级
        """

    def _build_output_format(self) -> str:
        """
        构建大模型输出格式
        """
        return OutlineAnalysisResult.get_prompt_specification()



    def process(self, data: DocxElements) -> OutlineAnalysisResult:
        """
        处理文档元素，分析目录和正文标题的一致性
        """

        if not self.validate_input(data):
            raise ValueError("输入数据无效")
        
        # 提取当前分析的document_analysis, 注意：data.document_analysis 是ModelData类型
        current_document_analysis = data.document_analysis.instance

        # 提取<目录标题列表>和<正文标题列表>, formatted的格式，而不是Json格式
        # 1. 目录标题列表
        toc_chapters = data.format_toc_chapters()
        toc_sections = data.format_toc_sections()
        toc_subsections = data.format_toc_subsections()

        # 2. 正文标题列表
        heading_chapters = data.format_heading_chapters()
        heading_sections = data.format_heading_sections()
        heading_subsections = data.format_heading_subsections()


        # 3. contexts
        chapter_context = self._build_context(toc_chapters, heading_chapters)
        section_context = self._build_context(toc_sections, heading_sections)
        subsection_context = self._build_context(toc_subsections, heading_subsections)

        # 构建大模型输入requirements & output_format
        requirement = self._build_requirement()
        output_format = self._build_output_format()

        # 创建多个分析请求
        requests = [
            LLMAnalysisInput(context=chapter_context, requirement=requirement, output_format=output_format),
            LLMAnalysisInput(context=section_context, requirement=requirement, output_format=output_format),
            LLMAnalysisInput(context=subsection_context, requirement=requirement, output_format=output_format),
        ]

        # 调用大模型进行比较
        response = asyncio.run(self.bid_llm_analyzer.batch_outline_analysis(requests,stream=True))


        # 创建 OutlineAnalysisResult 实例
        analysis_result = OutlineAnalysisResult(
            document_analysis= ModelData(model=DocumentAnalysis, instance=current_document_analysis),  #需要经过ModelData包装
            toc_only_elements=response.get('toc_only_elements', []),
            heading_only_elements=response.get('heading_only_elements', []),
            user_confirm=False
        )

        if not self.validate_output(analysis_result):
            raise ValueError("大模型输出数据无效")
        
        # 保存分析结果
        current_document_analysis.outline_analysis_result = analysis_result.to_model()
        current_document_analysis.save()
        
        return analysis_result




