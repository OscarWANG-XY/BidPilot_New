import asyncio
import nest_asyncio
from typing import List, Dict
from ..pipeline.base import PipelineStep
from ..pipeline.types import DocxElements, DocxTreeAnalysisResult, DocxTree
from apps.doc_analysis.services.llm_services import BidAnalysisService, LLMAnalysisInput
from apps.doc_analysis.models import DocumentAnalysis

import logging
logger = logging.getLogger(__name__)

class DocxTreeAnalyzerStep(PipelineStep[DocxTree, DocxTreeAnalysisResult]):
    """文档树分析器，评估文档结构并决定是否需要更细粒度的标题分析"""

    def __init__(self, model_name: str = "qwen-plus"):
        super().__init__()
        self.model_name = model_name
        self.bid_llm_analyzer = BidAnalysisService(model_name=model_name)
        nest_asyncio.apply()

    def validate_input(self, data: DocxElements) -> bool:
        """验证输入数据是否有效"""
        if not isinstance(data, DocxElements):
            return False
        if len(data.elements) == 0:
            return False
        if not data.document_analysis:
            return False
        return True

    def validate_output(self, data: DocxTreeAnalysisResult) -> bool:
        """验证输出数据是否有效"""
        required_keys = {"sections_to_analyze", "analysis_recommendations"}
        return (isinstance(data, DocxTreeAnalysisResult) and 
                all(key in data.to_model() for key in required_keys) and 
                data.document_analysis is not None)

    def _build_context(self, formatted_structure: str) -> str:
        return f"""
文档结构分析：

当前文档结构：
{formatted_structure}

每个标题项格式为：
"[文档位置], 标题层级, 标题内容"
"""

    def _build_requirement(self) -> str:
        """构建大模型分析任务要求"""
        return """
请分析该文档结构，并提供以下建议：
1. 识别哪些章节需要进一步细分或下钻分析
2. 对于需要下钻的章节，说明原因（如：内容过于复杂、缺少子标题等）
3. 评估当前标题层级是否合理

注意：
- 考虑章节的复杂度和重要性
- 评估是否存在标题层级过深或过浅的情况
- 关注可能影响文档理解的结构问题
"""

    def _build_output_format(self) -> str:
        """构建大模型输出格式"""
        return DocxTreeAnalysisResult.get_prompt_specification()

    def process(self, data: DocxElements) -> DocxTreeAnalysisResult:
        """处理文档元素，分析文档树结构"""
        if not self.validate_input(data):
            raise ValueError("输入数据无效")

        current_document_analysis = data.document_analysis.instance

        # 获取完整的文档结构
        document_structure = data.format_full_structure()

        # 构建分析上下文
        context = self._build_context(document_structure)
        requirement = self._build_requirement()
        output_format = self._build_output_format()

        # 创建分析请求
        analysis_input = LLMAnalysisInput(
            context=context,
            requirement=requirement,
            output_format=output_format
        )

        # 调用大模型进行分析
        response = asyncio.run(
            self.bid_llm_analyzer.analyze_document_tree(analysis_input, stream=True)
        )

        # 创建分析结果
        analysis_result = DocxTreeAnalysisResult(
            document_analysis=ModelData(
                model=DocumentAnalysis, 
                instance=current_document_analysis
            ),
            sections_to_analyze=response.get('sections_to_analyze', []),
            analysis_recommendations=response.get('analysis_recommendations', {}),
            user_confirm=False
        )

        if not self.validate_output(analysis_result):
            raise ValueError("大模型输出数据无效")

        # 保存分析结果
        current_document_analysis.docxtree_analysis_result = analysis_result.to_model()
        current_document_analysis.save()

        return analysis_result
