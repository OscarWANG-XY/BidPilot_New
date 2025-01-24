from enum import Enum
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from ._03_element_extractor import ElementType

@dataclass
class SimpleElement:
    """简化的文档元素，不包含raw_xml"""
    element_type: ElementType
    sequence_number: int
    content: str
    #raw_xml: str
    #style_id: Optional[str] = None
    is_heading: bool = False
    heading_level: int = 0
    #heading_type: str = ""
    #heading_info: Optional[Dict] = None
    #alignment: str = ""
    #indentation: int = 0
    #first_line_tabs: int = 0
    is_toc:bool = False
    #toc_info: Optional[Dict] = None
    has_nested: bool = False
    has_merged: bool = False

@dataclass
class DocumentNode:
    """文档树节点"""
    element: SimpleElement
    level: Optional[int] = None  # 只有标题才有层级，其他内容为 None
    children: List['DocumentNode'] = None
    parent: Optional['DocumentNode'] = None
    prev_sibling: Optional['DocumentNode'] = None  # 同级上一个节点
    next_sibling: Optional['DocumentNode'] = None  # 同级下一个节点
    path: str = ""  # 节点路径，例如: "1.2.3" 表示第1章第2节第3小节

    def __post_init__(self):
        if self.children is None:
            self.children = []

class DocumentTreeBuilder:
    """文档树构建器"""
    def __init__(self, elements: List[Any]):
        self.elements = elements
        self.root = DocumentNode(
            element=None,
            level=-1, #根节点没有层级，但要确保它比任何标题的层级都小，所以这里要用-1， 不能用None
            children=[],
            parent=None,
            prev_sibling=None,
            next_sibling=None,
            path="" #节点路径
        )

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

    def build_tree(self) -> DocumentNode:
        """构建文档树"""
        current_node = self.root  # 当前节点，初始为根节点，用来和new_node比较，决定new_node的prev_sibling和next_sibling
        last_node_at_level = {}  # 记录每个层级的最后一个节点, 用来和new_node比较，决定new_node的prev_sibling和next_sibling
        
        for element in self.elements:
            # 遍历每一个元素，假设第一个元素进来，我们为其创建节点叫new_node, element的信息被搬进去。
            new_node = DocumentNode(
                element=self._create_simple_element(element),
                level=element.heading_level if (element.element_type == ElementType.PARAGRAPH and element.is_heading) else None,
                children=[],
                parent=None,
                prev_sibling=None,
                next_sibling=None,
                path=""
            )

            # 如果new_node节点是标题,就调整current_node当前节点的位置
            if new_node.element.element_type == ElementType.PARAGRAPH and new_node.element.is_heading:
                
                # 找到合适的父节点
                # 一开始current_node是根节点，以下这段不执行
                # 当进入到第一个标题时， 
                while (current_node.level is not None and 
                      new_node.level is not None and 
                      current_node.level >= new_node.level):
                    current_node = current_node.parent or self.root

                # 设置相邻节点关系
                # 一开始last_node_at_level为空，level为-1, 以下这段不执行
                if current_node.level in last_node_at_level:
                    prev_node = last_node_at_level[current_node.level]
                    new_node.prev_sibling = prev_node
                    prev_node.next_sibling = new_node

                # 更新该层级的最后一个节点
                # 一开始current_node是根节点，level为-1, 以下这段输出:
                # last_note_at_level = {-1:new_node}
                last_node_at_level[current_node.level] = new_node

                # 生成路径
                # 一开始current_node是根节点，level为-1, 以下这段输出:
                # new_node.path = "1"，为第一个标题的序号
                self._update_path(new_node, current_node)

            # 建立父子关系
            # 一开始current_node是根节点，让new_node.parent为根节点
            new_node.parent = current_node
            current_node.children.append(new_node)   #通过这句，将element逐个装进root数据结构里。 

            # 如果是标题，#移动current_node到new_node的位置
            if element.element_type == ElementType.PARAGRAPH and element.is_heading:
                current_node = new_node    

        return self.root

    def _update_path(self, new_node: DocumentNode, current_node: DocumentNode) -> None:
        """更新节点路径"""
        if current_node == self.root:
            # sibling_count 用于计算之前的同级节点的数量，用来标记标题的序号
            sibling_count = sum(1 for child in current_node.children   #遍历子节点，没找到一个记录为1
                              if child.element and child.element.is_heading and #遍历的子节点必须是标题
                              child.level == new_node.level and  #遍历的子节点必须和new_node在同一层级
                              child != new_node) #遍历的子节点不能是new_node自己
            new_node.path = str(sibling_count + 1) #new_node的path就是同级节点的数量+1 （算上自己）
        else:
            # 子标题
            sibling_count = sum(1 for child in current_node.children 
                              if child.element and child.element.is_heading and 
                              child.level == new_node.level and 
                              child != new_node)
            # 例如：生成路径 "1.2"（父节点的路径 "1" + "." + 当前编号 "2"）
            new_node.path = f"{current_node.path}.{sibling_count + 1}"

    def print_tree(self, node: DocumentNode = None, level: int = 0):
        """打印文档树结构（增强版）"""
        if node is None:
            node = self.root
            
        indent = "  " * level
        if node.element:
            # 显示更多节点信息
            siblings_info = []
            if node.prev_sibling:
                siblings_info.append(f"prev={node.prev_sibling.element.content[:20]}")
            if node.next_sibling:
                siblings_info.append(f"next={node.next_sibling.element.content[:20]}")
            siblings_str = f" [{', '.join(siblings_info)}]" if siblings_info else ""
            
            if node.element.element_type == ElementType.PARAGRAPH and node.element.is_heading:
                print(f"{indent}[L{node.level}][{node.path}] {node.element.content[:50]}...{siblings_str}")
            else:
                print(f"{indent}{node.element.content[:50]}...{siblings_str}")
            
        for child in node.children:
            self.print_tree(child, level + 1)
