import asyncio
import nest_asyncio
from typing import List, Dict, Tuple
from ..pipeline.base import PipelineStep
from apps.doc_analysis.pipeline.types import DocxTree, EXAMPLE_OUTPUT, ModelData
from apps.doc_analysis.LLM_services._llm_data_types import BatchResult
from apps.doc_analysis.models import DocumentAnalysis
from apps.doc_analysis.LLM_services.outline_llm_analyzer import OutlineLLMAnalyzer


import logging
logger = logging.getLogger(__name__)


class DocxOutlineAnalyzerStep(PipelineStep[DocxTree, EXAMPLE_OUTPUT]):
    """文档大纲分析器，用于比较和分析文档的目录(TOC)和大纲(Outline)结构"""

    def __init__(self):
        super().__init__()
        self.outline_llm_analyzer = OutlineLLMAnalyzer()
        #nest_asyncio.apply()  # 允许在Jupyter Notebook中运行异步代码


    def validate_input(self, data: DocxTree) -> bool:
        """
        验证输入数据是否有效
        """
        return True
    

    def validate_output(self, data: EXAMPLE_OUTPUT) -> bool:
        """
        验证输出数据是否有效
        """
        return True



    def process(self, data: DocxTree) -> EXAMPLE_OUTPUT:
        """
        处理文档元素，分析目录和正文标题的一致性
        """

        if not self.validate_input(data):
            raise ValueError("输入数据无效")
        
        
        # 提取当前分析的document_analysis, 注意：data.document_analysis 是ModelData类型
        current_document_analysis = data.document_analysis.instance

        # --------------------- 大模型分析 --------------------
        # build contexts, requirements & output_format
        contexts, requirements, output_formats = self.prepare_requests_data(data)

        # 调用大模型进行比较
        #response = asyncio.run(self.bid_llm_analyzer.batch_outline_analysis(requests,stream=True))

        raw_batch_results = self.analyze(
            contexts=contexts, 
            requirements=requirements, 
            output_formats=output_formats,
            repeats=3
        )
        final_results = BatchResult.merge_hybrid(raw_batch_results)

        # --------------------- 大模型分析结束 -------------------- 

        # 创建 OutlineAnalysisResult 实例
        analysis_result = EXAMPLE_OUTPUT(
            document_analysis= ModelData(model=DocumentAnalysis, instance=current_document_analysis),  #需要经过ModelData包装
            analysis_result= final_results,
            user_confirm=False
        )

        #if not self.validate_output(analysis_result):
        #    raise ValueError("大模型输出数据无效")
        
        # ---- 保存分析结果 ----
        #current_document_analysis.outline_analysis_result = analysis_result.to_model()
        #current_document_analysis.save()
        
        return analysis_result

    def analyze(self, contexts: List[str], requirements: List[str], output_formats: List[str], repeats: int = 1):
        async def _analyze():
            return await self.outline_llm_analyzer.batch_analyze_with_repeats(
                contexts=contexts, 
                requirements=requirements, 
                output_formats=output_formats,
                repeats=repeats)
        
        return asyncio.run(_analyze())
    
    def prepare_requests_data(self, data) -> Tuple[List[str], List[str], List[str]]:
        """
        准备大模型分析所需的数据
            
        Returns:
            Tuple[List[str], List[str], List[str]]: 返回 (contexts, requirements, output_formats)
        """