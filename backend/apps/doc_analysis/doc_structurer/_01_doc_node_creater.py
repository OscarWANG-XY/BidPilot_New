from enum import Enum
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
import tiktoken
from ..docx_parser._03_element_extractor import ElementType, DocumentElement

@dataclass
class SimpleElement:
    """简化的文档元素，不包含raw_xml"""
    element_type: ElementType
    sequence_number: int
    content: str
    is_heading: bool = False
    heading_level: Optional[int] = None
    is_toc:bool = False
    has_nested: bool = False
    has_merged: bool = False

@dataclass
class DocumentNode_v1:
    """文档树节点"""
    node_id: int
    element: SimpleElement
    level: Optional[int] = None  # 只有标题才有层级，其他内容为 None
    children: List['DocumentNode_v1'] = field(default_factory=list)
    parent: Optional['DocumentNode_v1'] = None
    prev_sibling: Optional[int] = None  # 同级上一个节点, 用Node_id表示
    next_sibling: Optional[int] = None  # 同级下一个节点, 用Node_id表示
    path_sequence: List[int] = field(default_factory=list)   # 路径中节点的node_id
    path_titles: str = ""  # 节点路径，例如 第1章 > 第2节 > 第3小节
    path_title_id: str = ""  # 标题节点才有标题id，1, 1.1, 1.1.1
    node_type: str = "content_node"  # 节点类型: title_node, content_node
    content_type: str = ""  # 节点内容类型，例如: "paragraph", "table", "figure", "toc" , "cover" 
    node_length: int = 0  # 节点长度，例如: 1000
    branch_length: Optional[int] = None  # 标题节点才有分支长度，例如: 1000
    ttl_nodes_in_branch: Optional[int] = None  # 分支下的节点总数(包括标题节点和内容节点)
    # 以下为配套enrich_doc_structure 增加的节点
    enrich_pre_screened_result: Optional[str] = None  # 增强节点预筛选结果
    enrich_added_heading_nodes: Optional[List[int]] = field(default_factory=list)  # 增强节点预筛选后添加的标题节点
    # 以下为配套模型分析第一轮结果
    #appendix_type: Optional[str] = None  # 附件类型
    summary: Optional[str] = None  # 章节摘要
    content_include: Optional[str] = None  # 章节内容包括
    usage_in_interpretation: Optional[str] = None  # 招标文件解读环节的作用
    usage_in_preparation: Optional[str] = None  # 投标文件编制环节的作用
    key_actions: Optional[List[Dict[str, str]]] = field(default_factory=list)  # 关键行动
    status: str = "unread" # 默认都是未读


class DocumentNodeCreator:
    # 初始化，为所有element创建
    def __init__(self, elements: List[DocumentElement]):
        self.elements = elements
        self.nodes = []
        self._create_nodes()  # 添加初始化时创建节点的调用

    def count_tokens(self, text: str) -> int:
        """计算文本的token数量"""
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        return len(encoding.encode(text))

    def _create_simple_element(self, element: Any) -> SimpleElement:
        """创建简化的元素对象"""
        common_attrs = {
            'element_type': element['element_type'],
            'sequence_number': element['sequence_number'],
            'content': element['content'],
            #'style_id': element.style_id
        }
        
        # 根据元素类型添加特定属性
        if element['element_type'] == "ElementType.PARAGRAPH":
            common_attrs.update({
                'is_heading': element.get('is_heading', False),
                'is_toc':element.get('is_toc', False),
                'heading_level': element.get('heading_level', None),
                #'heading_type': element.get('heading_type', ""),
                #'alignment': element.get('alignment', ""),
                #'indentation': element.get('indentation', 0)
            })
        elif element['element_type'] == "ElementType.TABLE":
            common_attrs.update({
                'has_nested': element.get('has_nested', False),
                'has_merged': element.get('has_merged', False)
            })
            
        return SimpleElement(**common_attrs)
    

    def _create_nodes(self) -> List[DocumentNode_v1]:
        """为每个元素创建对应的文档节点"""
        for element in self.elements:
            simple_element = self._create_simple_element(element)
            node_type = "title_node" if simple_element.is_heading else "content_node"
            content_type = "text" if simple_element.element_type == ElementType.PARAGRAPH else "table"
            node_length = self.count_tokens(simple_element.content)
            doc_node = DocumentNode_v1(
                node_id=simple_element.sequence_number, 
                element=simple_element, 
                level=simple_element.heading_level,
                node_type=node_type,   # title_node, content_node
                content_type=content_type,  #
                node_length=node_length
                )
            self.nodes.append(doc_node)
        return self.nodes

    def get_nodes(self) -> List[DocumentNode_v1]:
        """返回创建的所有节点"""
        return self.nodes