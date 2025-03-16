from dataclasses import dataclass
from typing import List, Dict
from apps.projects.services.types.type_DocxElements import DocxElements
from apps.projects.services.types.base_TypesAndHelpers import ModelData

# _03_outline_improvement的输出，数据存储在模型DocumentAnalysis的improved_docx_elements字段
@dataclass
class ImprovedDocxElements(DocxElements):
    """改进后的文档元素，包含用户确认状态"""
    user_confirm: bool = False  # 用户是否确认了推荐内容

    def to_model(self) -> Dict:
        """将ImprovedDocxElements转换为可序列化的字典"""
        data = super().to_model()
        data['user_confirm'] = self.user_confirm
        return data

    @classmethod
    def from_model(cls, data: Dict) -> 'ImprovedDocxElements':
        """从字典创建ImprovedDocxElements实例"""
        from ..models import DocumentAnalysis
        return cls(
            elements=data['elements'],
            document_analysis=ModelData(
                model=DocumentAnalysis,
                instance=DocumentAnalysis.objects.get(pk=data['document_analysis']['instance'])
            ),
            user_confirm=data.get('user_confirm', False)
        )

    def get_headings(self) -> List[Dict]:
        """获取文档中的所有标题"""
        return super().get_headings()  # 直接调用父类的get_headings方法   
    

    def format_headings(self) -> str:
        formatted_headings = [
            f"[{elem['position']}], Lvl:{elem['heading_level']}, 标题：{elem['content']}"
            for elem in self.elements
            if  elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)
    
    def normalize_heading_levels(self) -> None:
        """
        检查所有标题元素，将heading_level > 4的标题转换为普通元素
        通过移除is_heading和heading_level字段来实现转换
        """
        for element in self.elements:
            if element.get('is_heading', False) and element.get('heading_level', 0) > 4:
                # 移除标题相关字段
                element.pop('is_heading', None)
                element.pop('heading_level', None)
                # 将type设置为paragraph（如果之前不是其他特殊类型）
                if element.get('type') == 'heading':
                    element['type'] = 'paragraph'
