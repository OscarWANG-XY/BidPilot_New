from enum import Enum
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from docx_parser_package.docx_parser._03_element_extractor import ElementType, DocumentElement

@dataclass
class SimpleElement:
    """简化的文档元素，不包含raw_xml"""
    element_type: ElementType
    sequence_number: int
    content: str
    is_heading: bool = False
    heading_level: int = 0
    is_toc:bool = False
    has_nested: bool = False
    has_merged: bool = False

@dataclass
class DocumentNode:
    """文档树节点"""
    node_id: int
    element: SimpleElement
    level: Optional[int] = None  # 只有标题才有层级，其他内容为 None
    children: List['DocumentNode'] = None
    parent: Optional['DocumentNode'] = None
    prev_sibling: Optional['DocumentNode'] = None  # 同级上一个节点
    next_sibling: Optional['DocumentNode'] = None  # 同级下一个节点
    path: str = ""  # 节点路径，例如: "1.2.3" 表示第1章第2节第3小节
    key_message: str = ""  # 节点关键信息，例如: "招标文件-第1包：一级压榨花生油"
    node_type: str = ""  # 节点类型，例如: "chapter", "section", "sub_section"，"paragraph", "table", "figure", "toc" , "cover" 
    node_length: int = 0  # 节点长度，例如: 1000


class DocumentNodeCreator:
    # 初始化，为所有element创建
    def __init__(self, elements: List[DocumentElement]):
        self.elements = elements
        self.nodes = []
        self._create_nodes()  # 添加初始化时创建节点的调用

    def _create_simple_element(self, element: Any) -> SimpleElement:
        """创建简化的元素对象"""
        common_attrs = {
            'element_type': element.element_type,
            'sequence_number': element.sequence_number,
            'content': element.content,
            #'style_id': element.style_id
        }
        
        # 根据元素类型添加特定属性
        if element.element_type == ElementType.PARAGRAPH:
            common_attrs.update({
                'is_heading': getattr(element, 'is_heading', False),
                'is_toc':getattr(element, 'is_toc', False),
                'heading_level': getattr(element, 'heading_level', 0),
                #'heading_type': getattr(element, 'heading_type', ""),
                #'alignment': getattr(element, 'alignment', ""),
                #'indentation': getattr(element, 'indentation', 0)
            })
        elif element.element_type == ElementType.TABLE:
            common_attrs.update({
                'has_nested': getattr(element, 'has_nested', False),
                'has_merged': getattr(element, 'has_merged', False)
            })
            
        return SimpleElement(**common_attrs)
    

    def _create_nodes(self) -> List[DocumentNode]:
        """为每个元素创建对应的文档节点"""
        for element in self.elements:
            simple_element = self._create_simple_element(element)
            doc_node = DocumentNode(node_id=element.sequence_number, element=simple_element, level=simple_element.heading_level)
            self.nodes.append(doc_node)
        return self.nodes

    def get_nodes(self) -> List[DocumentNode]:
        """返回创建的所有节点"""
        return self.nodes