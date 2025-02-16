import asyncio
import nest_asyncio
from typing import List, Dict
from ..pipeline.base import PipelineStep
from ..pipeline.types import DocxElements, OutlineAnalysisResult
from apps.doc_analysis.llm_services import BidAnalysisService, AnalysisRequest

class DocumentOutlineAnalyzer(PipelineStep[DocxElements, OutlineAnalysisResult]):
    """文档大纲分析器，用于比较和分析文档的目录(TOC)和大纲(Outline)结构"""

    def __init__(self, model_name: str = "qwen-plus"):
        super().__init__()
        self.model_name = model_name
        self.bid_llm_analyzer = BidAnalysisService(model_name=model_name)
        nest_asyncio.apply()  # 允许在Jupyter Notebook中运行异步代码

    def process(self, data: DocxElements) -> OutlineAnalysisResult:
        """
        处理文档元素，分析目录和正文标题的一致性
        """
        # 提取目录和正文标题
        toc_elements = self._extract_toc_elements(data)
        heading_elements = self._extract_heading_elements(data)

        # 构建大模型输入
        context = self._build_context(toc_elements, heading_elements)
        requirement = self._build_requirement()
        output_format = self._build_output_format()

        # 调用大模型进行比较
        analysis_result = asyncio.run(self._compare_toc_and_headings(context, requirement, output_format))

        return analysis_result

    def validate_input(self, data: DocxElements) -> bool:
        """
        验证输入数据是否有效
        """
        return isinstance(data, list) and all(isinstance(elem, dict) for elem in data)

    def validate_output(self, data: OutlineAnalysisResult) -> bool:
        """
        验证输出数据是否有效
        """
        required_keys = {"TOC_only_elements", "heading_only_elements"}
        return isinstance(data, dict) and all(key in data for key in required_keys)

    def _extract_toc_elements(self, elements: DocxElements) -> List[Dict]:
        """
        提取目录元素
        """
        return [elem for elem in elements if elem.get('is_TOC') is True]

    def _extract_heading_elements(self, elements: DocxElements) -> List[Dict]:
        """
        提取正文标题元素
        """
        return [elem for elem in elements if elem.get('is_heading') is True]

    def _build_context(self, toc_elements: List[Dict], heading_elements: List[Dict]) -> str:
        """
        构建大模型输入上下文
        """
        formatted_toc = "\n".join(
            f"[{elem.get('position')}], {elem.get('TOC_level')}, 标题：{elem.get('content')}"
            for elem in toc_elements
        )
        formatted_headings = "\n".join(
            f"[{elem.get('position')}], {elem.get('heading_level')}, 标题：{elem.get('content')}"
            for elem in heading_elements
        )
        return f"""
        1. 目录标题列表：从文档目录中提取的标题
        2. 正文标题列表：从文档正文中提取的标题

        数据格式：
        "[文档位置], 章节类型, 标题内容"

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
        请对比<目录标题列表>和<正文标题列表>的标题内容，找出以下三类不同标题项：
        1. 目录列表里有，但正文里没有的标题项
        2. 目录列表里没有，但正文里有的标题项
        """

    def _build_output_format(self) -> str:
        """
        构建大模型输出格式
        """
        return """
        请严格按照以下JSON格式输出分析结果，不要在JSON格式外输出任何MARKDOWN的标记和内容：
        {
            "TOC_only_elements": [
                {
                    "position": "目录独有的标题在文档中的位置",
                    "content": "目录独有的标题的内容",
                    "reason": "选择的原因"
                }
            ],
            "heading_only_elements": [
                {
                    "position": "正文独有的标题项在文档中的位置",
                    "content": "正文独有的标题的内容",
                    "reason": "选择的原因"
                }
            ]
        }
        """

    async def _compare_toc_and_headings(self, context: str, requirement: str, output_format: str) -> OutlineAnalysisResult:
        """
        调用大模型比较目录和正文标题
        """
        analysis_request = AnalysisRequest(
            context=context,
            requirement=requirement,
            output_format=output_format,
        )
        response = await self.bid_llm_analyzer.outline_analysis(analysis_request, stream=True)
        return response

