from ..pipeline.base import PipelineStep
from ..pipeline.types import DocxElements, OutlineAnalysisResult, ImprovedDocxElements, ModelData
from apps.doc_analysis.models import DocumentAnalysis
from typing import Tuple, Dict, List
import json

class OutlineImprovementStep(PipelineStep[Tuple[DocxElements, OutlineAnalysisResult], ImprovedDocxElements]):
    def process(self, data: Tuple[DocxElements, OutlineAnalysisResult]) -> ImprovedDocxElements:
        """处理文档元素，根据分析结果进行改进"""

        if not self.validate_input(data):
            raise ValueError("输入数据无效")

        docx_elements, outline_analysis_result = data

        # 提取当前分析的document_analysis, 注意：data.document_analysis 是ModelData类型
        current_document_analysis = docx_elements.document_analysis.instance
        
        # 获取当前分析的outline_analysis_result
        titles_to_improve = self.extract_titles_from_analysis(outline_analysis_result)
    
        improved_elements = self.improve_document_elements(docx_elements, titles_to_improve)

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
        
        # 检查输入类型
        if not isinstance(docx_elements, DocxElements):
            raise ValueError(f"输入的docx_elements类型错误: 期望DocxElements, 实际为{type(docx_elements)}")
            
        if not isinstance(analysis_result, OutlineAnalysisResult):
            raise ValueError(f"输入的analysis_result类型错误: 期望OutlineAnalysisResult, 实际为{type(analysis_result)}")
        
        # 检查用户确认状态
        if not analysis_result.user_confirm:
            raise ValueError("分析结果未经用户确认，请先确认分析结果")
        
        # 检查文档一致性
        if docx_elements.document_analysis.instance.pk != analysis_result.document_analysis.instance.pk:
            raise ValueError(
                f"文档不匹配: docx_elements的文档ID为{docx_elements.document_analysis.instance.pk}, "
                f"analysis_result的文档ID为{analysis_result.document_analysis.instance.pk}"
            )
        
        return True

    def validate_output(self, data: ImprovedDocxElements) -> bool:
        """验证输出数据是否有效"""
        return isinstance(data, ImprovedDocxElements)

    def extract_titles_from_analysis(self, outline_analysis_result: OutlineAnalysisResult) -> Dict[str, List[Dict]]:
        """
        从分析结果中提取需要改进的标题
        
        Args:
            outline_analysis_result: 目录分析结果对象
            
        Returns:
            Dict[str, List[Dict]]: 包含目录独有和正文独有标题的字典
        """
        to_improve_titles = {
            "toc_only_titles": [],
            "heading_only_titles": []
        }

        # Process each result in the batch
        for result in outline_analysis_result.analysis_result.result:
            # Parse the JSON string in the 'value' field
            value_dict = json.loads(result['value'])
        
            # Extend the merged lists with new titles
            to_improve_titles["toc_only_titles"].extend(value_dict["toc_only_titles"])
            to_improve_titles["heading_only_titles"].extend(value_dict["heading_only_titles"])

        return to_improve_titles


    def improve_document_elements(
        self, 
        docx_elements: DocxElements, 
        titles_to_improve: Dict[str, List[Dict]]
    ) -> List[Dict]:
        """
        根据分析结果改进文档元素的标题属性
        
        Args:
            docx_elements: 原始文档元素对象
            to_improve_titles: 需要改进的标题字典，包含 toc_only_titles 和 heading_only_titles
            
        Returns:
            List[Dict]: 改进后的文档元素列表
        """
        # 创建改进后的文档元素副本
        import copy
        improved_elements = copy.deepcopy(docx_elements.elements)

        # 第一步：处理heading_only_elements（移除不正确的标题标记）
        for heading_element in titles_to_improve["heading_only_titles"]:
            position = heading_element['position']
            # 找到对应元素并去除标题属性
            for element in improved_elements:
                if element['position'] == int(position):
                    element.pop('is_heading', None)
                    element.pop('heading_level', None)
                    break
        
        # 第二步：处理toc_only_elements（添加漏掉的标题标记）
        for toc_element in titles_to_improve["toc_only_titles"]:
            content = toc_element['content']
            # 找到内容匹配的元素并添加标题属性
            for element in improved_elements:
                if element['content'] == content:
                    element['is_heading'] = True
                    element['heading_level'] = toc_element['toc_level']
                    break

        return improved_elements

    # 使用示例：
    # improved_elements = self.improve_document_elements(docx_elements, titles_to_improve)
