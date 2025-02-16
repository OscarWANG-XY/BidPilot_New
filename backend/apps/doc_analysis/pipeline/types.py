from dataclasses import dataclass, field
from datetime import datetime
from django.db.models import Model
from typing import TypeVar, Generic, Type, Optional, Dict, List

#定义泛型Model类型 【通用的框架代码】
DjangoModel = TypeVar('DjangoModel', bound=Model)

@dataclass
class ModelData(Generic[DjangoModel]):
    model: Type[DjangoModel]
    instance: DjangoModel

# 使用： ModelData(模型名)

# ------------------补充说明-----------------------
# 如果需要针对特定模型的子类进行支持，可以使用以下方式，
# 例如：
#OrderModel = TypeVar('OrderModel', bound=Order)
#PaymentModel = TypeVar('PaymentModel', bound=Payment)
# 使用： ModelData(OrderModel); ModelData(PaymentModel)


@dataclass
class DocxElements:
    """包含所有文档元素的集合类"""
    elements: List[Dict]  # 每个元素存储为字典

    def __len__(self):
        return len(self.elements)

    def __getitem__(self, index):
        return self.elements[index]

    def __iter__(self):
        return iter(self.elements)

    def add_element(self, 
                    element_type: str, 
                    position: int, 
                    content: str, 
                    is_toc: bool = False, 
                    toc_level: Optional[str] = None,
                    is_heading: bool = False,
                    heading_level: Optional[str] = None):
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

    def to_model(self) -> List[Dict]:
        """将DocxElements转换为可序列化的字典列表"""
        return self.elements

    @classmethod
    def from_model(cls, data: List[Dict]) -> 'DocxElements':
        """从字典列表创建DocxElements实例"""
        return cls(data)

    def filter_by_type(self, element_type: str) -> 'DocxElements':
        """按元素类型过滤"""
        return DocxElements([element for element in self.elements if element['type'] == element_type])

    def get_headings(self) -> 'DocxElements':
        """获取所有标题元素"""
        return DocxElements([element for element in self.elements if element.get('is_heading', False)])

    def get_toc(self) -> 'DocxElements':
        """获取所有目录元素"""
        return DocxElements([element for element in self.elements if element.get('is_toc', False)])

    def format_toc_chapters(self) -> str:
        """格式化所有chapter级别的目录元素为字符串"""
        formatted_toc = [
            f"[{elem['position']}], {elem['toc_level']}, 标题：{elem['content']}"
            for elem in self.elements
            if elem.get('toc_level') == "chapter" and elem.get('is_toc', False)
        ]
        return "\n".join(formatted_toc)

    def format_heading_chapters(self) -> str:
        """格式化所有chapter级别的标题元素为字符串"""
        formatted_headings = [
            f"[{elem['position']}], {elem['heading_level']}, 标题：{elem['content']}"
            for elem in self.elements
            if elem.get('heading_level') == "chapter" and elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)

    def format_toc_sections(self) -> str:
        """格式化所有section级别的目录元素为字符串"""
        formatted_toc = [
            f"[{elem['position']}], {elem['toc_level']}, 标题：{elem['content']}"
            for elem in self.elements
            if elem.get('toc_level') == "section" and elem.get('is_toc', False)
        ]
        return "\n".join(formatted_toc)

    def format_heading_sections(self) -> str:
        """格式化所有section级别的标题元素为字符串"""
        formatted_headings = [
            f"[{elem['position']}], {elem['heading_level']}, 标题：{elem['content']}"
            for elem in self.elements
            if elem.get('heading_level') == "section" and elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)
    
    def format_toc_subsections(self) -> str:
        """格式化所有subsection级别的目录元素为字符串"""
        formatted_toc = [
            f"[{elem['position']}], {elem['toc_level']}, 标题：{elem['content']}"
            for elem in self.elements
            if elem.get('toc_level') == "subsection" and elem.get('is_toc', False)
        ]
        return "\n".join(formatted_toc)

    def format_heading_subsections(self) -> str:
        """格式化所有subsection级别的标题元素为字符串"""
        formatted_headings = [
            f"[{elem['position']}], {elem['heading_level']}, 标题：{elem['content']}"
            for elem in self.elements
            if elem.get('heading_level') == "subsection" and elem.get('is_heading', False)
        ]
        return "\n".join(formatted_headings)


@dataclass
class OutlineAnalysisResult:
    """目录分析结果"""
    TOC_only_elements: List[Dict] = field(default_factory=list)
    heading_only_elements: List[Dict] = field(default_factory=list)

    def add_toc_element(self, 
                        position: int, 
                        content: str, 
                        is_toc: bool = False, 
                        toc_level: Optional[str] = None, 
                        reason: Optional[str] = None):
        """添加一个目录独有的元素"""
        self.TOC_only_elements.append({
            'position': position,
            'content': content,
            'is_toc': is_toc,
            'toc_level': toc_level,
            'reason': reason,
        })

    def add_heading_element(self, 
                        position: int, 
                        content: str, 
                        is_heading: bool = False, 
                        heading_level: Optional[str] = None, 
                        reason: Optional[str] = None):
        """添加一个正文独有的元素"""
        self.heading_only_elements.append({
            'position': position,
            'content': content,
            'is_heading': is_heading,
            'heading_level': heading_level,
            'reason': reason,
        })

    def to_model(self) -> Dict:
        """将结果转换为适合存储在models.py中的格式"""
        return {
            'TOC_only_elements': self.TOC_only_elements,
            'heading_only_elements': self.heading_only_elements
        }

    @classmethod
    def from_model(cls, data: Dict) -> 'OutlineAnalysisResult':
        """从models.py中的字段数据创建实例"""
        return cls(
            TOC_only_elements=data.get('TOC_only_elements', []),
            heading_only_elements=data.get('heading_only_elements', [])
        )

    @staticmethod
    def get_prompt_specification() -> str:
        """
        OutlineAnalysis会按chapter,section,subsection逐个层级比较<目录标题列表> 与 <正文标题列表>
        以下定义了，大模型返回的输出格式的规范说明
        """
        return """
        请按照以下JSON格式输出目录分析结果：
        {
            "TOC_only_elements": [
                {
                    "position": int,  # 元素在文档中的位置索引
                    "content": str,   # 元素内容
                    "is_toc": bool,   # 是否为目录
                    "toc_level": str, # 目录级别（如"chapter", "section", "subsection"等）
                    "reason": str     # 判断为入选的原因
                }
            ],
            "heading_only_elements": [
                {
                    "position": int,      # 元素在文档中的位置索引
                    "content": str,       # 元素内容
                    "is_heading": bool,   # 是否为标题
                    "heading_level": str, # 标题级别（如"chapter", "section", "subsection"等）
                    "reason": str         # 判断为入选的原因
                }
            ]
        }
        注意：
        1. 每个元素必须包含所有字段
        2. 如果某个字段无值，请使用null
        3. 保持JSON格式严格有效
        """


