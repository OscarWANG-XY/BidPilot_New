from typing import List, Any, Optional, Dict
from dataclasses import dataclass
from ._01_doc_node_creater import DocumentNode_v1, DocumentNodeCreator
from ._02_tree_level_builder import TreeLevelBuilder


@dataclass
class DocumentStructure:
    """文档结构"""
    doc_tree: DocumentNode_v1
    doc_nodes: List[DocumentNode_v1]

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
        self.root = DocumentNode_v1(
            node_id=-1,
            element=None,
            level=0,
            children=[],
            parent=None,
            prev_sibling=None,
            next_sibling=None,
            path=[-1]
        )
        
        # 记录已处理的最大层级
        self._max_level_processed = 0

        # 缓存每个层级的节点列表
        # 注意：这里使用的是字典，而不是列表，因为字典可以存储不同层级的节点列表
        self._level_nodes: Dict[int, List[DocumentNode_v1]] = {}

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

    def build_to_level(self, target_level: int) -> DocumentNode_v1:
        """构建到指定层级的完整文档树
        
        Args:
            target_level: 目标最大层级
            
        Returns:
            DocumentNode_v1: 文档树的根节点
        """
        for level in range(1, target_level + 1):
            self.build_level(level)
            # 选择对应level的标题节点
            selected_title_nodes = [node for node in self.doc_nodes if node.node_type == "title_node" and node.level == level]
            for node in selected_title_nodes:
                # 计算标题节点的分支长度
                node.branch_length = sum(child.node_length for child in (node.children or []))
                node.ttl_nodes_in_branch = len(node.children or [])
        
        # 计算根节点的 branch_length
        self.root.branch_length = sum(
            child.node_length + (child.branch_length or 0)  # 如果 branch_length 为 None，使用 0
            for child in (self.root.children or [])
        )
        
        # 从根节点开始构建所有路径
        self._build_node_paths(self.root)

        return DocumentStructure(doc_tree=self.root, doc_nodes=self.doc_nodes)
    
    def get_tree(self) -> DocumentNode_v1:
        """获当前构建的文档树
        
        Returns:
            DocumentNode_v1: 文档树的根节点
        """
        return DocumentStructure(doc_tree=self.root, doc_nodes=self.doc_nodes)

    def _build_node_paths(self, node: DocumentNode_v1) -> None:
        """递归构建每个节点的完整路径。
        path 是从根节点到当前节点的所有 node_id 列表
        
        Args:
            node: 当前处理的节点
        """
        if not node.parent:
            # 根节点的路径只包含自己的 node_id
            node.path = [node.node_id]
        else:
            # 其他节点的路径 = 父节点的路径 + 自己的 node_id
            node.path = node.parent.path + [node.node_id]
        
        # 递归处理所有子节点
        for child in (node.children or []):
            self._build_node_paths(child)
