from ..pipeline.base import PipelineStep
from ..pipeline.types import DocxElements, OutlineAnalysisResult, ImprovedDocxElements, ModelData
from apps.doc_analysis.models import DocumentAnalysis
from typing import Tuple

class OutlineImprovementStep(PipelineStep[Tuple[DocxElements, OutlineAnalysisResult], ImprovedDocxElements]):
    def process(self, data: Tuple[DocxElements, OutlineAnalysisResult]) -> ImprovedDocxElements:
        """处理文档元素，根据分析结果进行改进"""

        if not self.validate_input(data):
            raise ValueError("输入数据无效")

        docx_elements, outline_analysis_result = data

        # 提取当前分析的document_analysis, 注意：data.document_analysis 是ModelData类型
        current_document_analysis = docx_elements.document_analysis.instance
        
        # 创建改进后的文档元素副本
        import copy
        improved_elements = copy.deepcopy(docx_elements.elements)
        
        # 第一步：处理heading_only_elements
        for heading_element in outline_analysis_result.heading_only_elements:
            position = heading_element['position']
            # 找到对应元素并去除标题属性
            for element in improved_elements:
                if element['position'] == position:
                    element.pop('is_heading', None)
                    element.pop('heading_level', None)
                    break
        
        # 第二步：处理toc_only_elements
        for toc_element in outline_analysis_result.toc_only_elements:
            content = toc_element['content']
            # 找到内容匹配的元素并添加标题属性
            for element in improved_elements:
                if element['content'] == content:
                    element['is_heading'] = True
                    element['heading_level'] = toc_element['toc_level']
                    break

        improved_docx_elements = ImprovedDocxElements(
            elements=improved_elements,
            document_analysis= ModelData(model=DocumentAnalysis, instance=current_document_analysis),  #需要经过ModelData包装
            user_confirm=True
        )

        if not self.validate_output(improved_docx_elements):
            raise ValueError("大模型输出数据无效")
        
        # 保存分析结果
        current_document_analysis.improved_docx_elements = improved_docx_elements.to_model()
        current_document_analysis.save()

        return improved_docx_elements
    




    def validate_input(self, data: Tuple[DocxElements, OutlineAnalysisResult]) -> bool:
        """验证输入数据是否有效"""
        docx_elements, analysis_result = data
        return (isinstance(docx_elements, DocxElements) and 
                isinstance(analysis_result, OutlineAnalysisResult) and 
                analysis_result.user_confirm and 
                docx_elements.document_analysis.instance.pk == analysis_result.document_analysis.instance.pk
                ) 

    def validate_output(self, data: ImprovedDocxElements) -> bool:
        """验证输出数据是否有效"""
        return isinstance(data, ImprovedDocxElements)
