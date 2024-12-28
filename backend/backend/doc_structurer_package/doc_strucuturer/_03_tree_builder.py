from typing import List, Any, Optional, Dict
from dataclasses import dataclass
from ._01_doc_node_creater import DocumentNode, DocumentNodeCreator
from ._02_tree_level_builder import TreeLevelBuilder


@dataclass
class DocumentStructure:
    """文档结构"""
    doc_tree: DocumentNode
    doc_nodes: List[DocumentNode]

class TreeBuilder:
    """文档树构建器，负责协调整个文档树的构建过程"""
    
    def __init__(self, elements: List[Any]):
        """初始化文档树构建器
        
        Args:
            elements: 文档元素列表
        """
        # 创建基础节点
        node_creator = DocumentNodeCreator(elements)
        self.doc_nodes = node_creator.get_nodes()  #这里的get_nodes()是DocumentNodeCreator类中的方法
        
        # 初始化根节点
        self.root = DocumentNode(
            node_id=-1,
            element=None,
            level=0,
            children=[],
            parent=None,
            prev_sibling=None,
            next_sibling=None,
            path=""
        )
        
        # 记录已处理的最大层级
        self._max_level_processed = 0

        # 缓存每个层级的节点列表
        # 注意：这里使用的是字典，而不是列表，因为字典可以存储不同层级的节点列表
        self._level_nodes: Dict[int, List[DocumentNode]] = {}

    def build_level(self, level: int) -> None:
        """构建指定层级的结构
        
        Args:
            level: 要构建的目标层级 (1表示一级标题，2表示二级标题，以此类推)
        """
        if level <= self._max_level_processed:
            raise ValueError(f"Level {level} has already been processed")
        
        if level == 1:
            # 构建第一层级
            new_level_nodes = TreeLevelBuilder.build(
                self.doc_nodes, 
                target_level=1
            )
            # 设置父节点关系
            for node in new_level_nodes:
                node.parent = self.root

            self.root.children = new_level_nodes

            # 缓存一级标题节点
            self._level_nodes[1] = [        #这里的1是level，是键
                node for node in self.root.children 
                if node.element and node.element.is_heading 
                and node.element.heading_level == 1
            ]
        else:
            # 从缓存中获取上一层级的节点
            parent_nodes = self._level_nodes.get(level - 1, []) #get是内置方法，获取字典中指定键的值，如果键不存在，则返回默认值
            current_level_nodes = []
            
            # 为每个上层节点构建下一层级
            for parent_node in parent_nodes:
                # 确保 parent_node.children 不为 None
                if parent_node.children is None:
                    parent_node.children = []
                    
                new_level_nodes = TreeLevelBuilder.build(
                    parent_node.children,
                    target_level=level
                )
                # 更新父节点关系
                for node in new_level_nodes:
                    node.parent = parent_node
                # 更新父节点的children
                parent_node.children = new_level_nodes
                
                # 收集当前层级的标题节点到缓存
                current_level_nodes.extend([
                    node for node in new_level_nodes 
                    if node.element and node.element.is_heading 
                    and node.element.heading_level == level
                ])
            
            # 缓存当前层级的节点
            self._level_nodes[level] = current_level_nodes
        
        self._max_level_processed = level

    def build_to_level(self, target_level: int) -> DocumentNode:
        """构建到指定层级的完整文档树
        
        Args:
            target_level: 目标最大层级
            
        Returns:
            DocumentNode: 文档树的根节点
        """
        for level in range(1, target_level + 1):
            self.build_level(level)
        return DocumentStructure(doc_tree=self.root, doc_nodes=self.doc_nodes)

    def get_tree(self) -> DocumentNode:
        """获��当前构建的文档树
        
        Returns:
            DocumentNode: 文档树的根节点
        """
        return DocumentStructure(doc_tree=self.root, doc_nodes=self.doc_nodes)
