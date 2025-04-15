from dataclasses import dataclass
from typing import List, Dict, Optional
from apps.projects.models import Project
from apps.projects._deprecated.services_deprecated.types.base_TypesAndHelpers import ModelData


# _01_extrac_docx_elements的输出，数据存储在模型DocumentAnalysis的extracted_elements字段
@dataclass   
class DocxElements:
    """包含所有文档元素的集合类"""
    elements: List[Dict]  # 每个元素存储为字典
    project: ModelData[Project]

    def add_element(self, 
                    element_type: str, 
                    position: int, 
                    content: str, 
                    is_toc: bool = False, 
                    toc_level: Optional[int] = None,
                    is_heading: bool = False,
                    heading_level: Optional[int] = None):
        """添加一个新元素"""
        element = {
            'type': element_type,
            'position': position,
            'content': content,
            'is_toc': is_toc,
            'toc_level': toc_level,
            'is_heading': is_heading,
            'heading_level': heading_level
        }
        self.elements.append(element)

    @staticmethod
    def clean_content(content: str) -> str:
        """
        清理文本内容中的多余空格
        1. 去除首尾空格
        2. 将多个连续空格替换为单个空格
        3. 去除换行符前后的多余空格
        """
        if not content:
            return content
            
        # 去除首尾空格
        content = content.strip()
        # 将多个连续空格替换为单个空格
        content = ' '.join(content.split())
        # 处理换行符前后的空格
        content = '\n'.join(line.strip() for line in content.splitlines())
        
        return content

    def to_model(self) -> Dict:
        """将DocxElements转换为可序列化的字典, 存储在extracted_elements字段中"""
        return {
            'elements': self.elements,
            'project': {
                'model': 'Project',
                'instance': str(self.project.instance.pk)
            }
        }

    @classmethod
    def from_model(cls, data: Dict) -> 'DocxElements':
        """从字典创建DocxElements实例"""
        return cls(
            elements=data['elements'],
            project=ModelData(
                model=Project,
                instance=Project.objects.get(pk=data['project']['instance'])
            )
        )

    def filter_by_type(self, element_type: str) -> 'List[Dict]':
        """按元素类型过滤"""
        return [element for element in self.elements if element['type'] == element_type]

    def get_headings(self) -> 'List[Dict]':
        """获取所有标题元素"""
        return [element for element in self.elements if element.get('is_heading', False)]

    def get_toc(self) -> 'List[Dict]':
        """获取所有目录元素"""
        return [element for element in self.elements if element.get('is_toc', False)]

    def format_toc_chapters(self) -> str:
        """格式化所有chapter级别的目录元素为字符串"""
        formatted_toc = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["toc_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('toc_level') == 1 and elem.get('is_toc', False)
        ]
        return "\n".join(formatted_toc)

    def format_heading_chapters(self) -> str:
        """格式化所有chapter级别的标题元素为字符串"""
        formatted_headings = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["heading_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('heading_level') == 1 and elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)

    def format_toc_sections(self) -> str:
        """格式化所有section级别的目录元素为字符串"""
        formatted_toc = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["toc_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('toc_level') == 2 and elem.get('is_toc', False)
        ]
        return "\n".join(formatted_toc)

    def format_heading_sections(self) -> str:
        """格式化所有section级别的标题元素为字符串"""
        formatted_headings = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["heading_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('heading_level') == 2 and elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)
    
    def format_toc_subsections(self) -> str:
        """格式化所有subsection级别的目录元素为字符串"""
        formatted_toc = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["toc_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('toc_level') == 3 and elem.get('is_toc', False)
        ]
        return "\n".join(formatted_toc)

    def format_heading_subsections(self) -> str:
        """格式化所有subsection级别的标题元素为字符串"""
        formatted_headings = [
            f'title:{self.clean_content(elem["content"])}, level:{elem["heading_level"]}, position:{elem["position"]}'
            for elem in self.elements
            if elem.get('heading_level') == 3 and elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)
