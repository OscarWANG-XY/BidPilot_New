from ..pipeline.base import PipelineStep
from ..pipeline.types import ImprovedDocxElements, SimpleDocxNode, DocxTree, ModelData
from typing import TypeVar, Generic, Type, Optional, Dict, List, Union
from apps.doc_analysis.models import DocumentAnalysis


class BuildDocxTree(PipelineStep[ImprovedDocxElements, DocxTree]):
    """
    Pipeline步骤：将ImprovedDocxElements转换为DocTree结构
    输入：ImprovedDocxElements - 改进后的文档元素
    输出：DocTree - 文档树结构
    """

    def validate_input(self, data: ImprovedDocxElements) -> bool:
        """验证输入数据的有效性"""
        if not isinstance(data, ImprovedDocxElements):
            return False
        if not data.elements:
            return False
        return True

    def validate_output(self, data: DocxTree) -> bool:
        """验证输出数据的有效性"""
        if not isinstance(data, DocxTree):
            return False
        if not data.root:
            return False
        return True

    def process(self, data: ImprovedDocxElements) -> DocxTree:
        """
        处理步骤：将ImprovedDocxElements转换为DocTree
        """
        # 验证输入
        if not self.validate_input(data):
            raise ValueError("Invalid input data for BuildDocxTree")
        
        improved_docx_elements = data

        # 提取当前分析的document_analysis, 注意：data.document_analysis 是ModelData类型
        current_document_analysis = improved_docx_elements.document_analysis.instance

        elements = improved_docx_elements.elements

        # 使用DocTree的from_docx_elements方法构建文档树
        root, ordered_nodes = self.from_docx_elements(elements)

        doc_tree = DocxTree(
            root=root,
            document_analysis=ModelData(model=DocumentAnalysis, instance=current_document_analysis),
            _ordered_nodes=ordered_nodes  # 添加有序节点列表
        )

        # 验证输出
        if not self.validate_output(doc_tree):
            raise ValueError("Invalid output data from BuildDocxTree")
        
        # 保存分析结果
        current_document_analysis.docxtree = doc_tree.to_model()
        current_document_analysis.save()

        return doc_tree
    
    def from_docx_elements(self, docx_elements: List[Dict]) -> SimpleDocxNode:
        """从ImprovedDocxElements构建文档树"""
        # 创建根节点
        root = SimpleDocxNode(
            node_id=0,
            content="ROOT",
            node_type="root",
            level=0,
            path_sequence=[0],  # 根节点的路径序列
            path_titles=""            
        )
        
        # 用于跟踪当前标题级别的节点
        current_levels = {0: root}  # level -> node
        last_level = 0
        
        next_node_id = 1
        ordered_nodes = [root]  # 添加有序节点列表，初始包含根节点
        
        for elem in docx_elements:
            # 确定content_type
            content_type = None
            if not elem.get('is_heading'):
                if elem.get('is_toc', False):  # 检查是否为目录
                    content_type = 'toc'
                else:
                    content_type = elem.get('type', 'paragraph')  # 默认为paragraph

            # 创建新节点
            node = SimpleDocxNode(
                node_id=next_node_id,
                content=elem['content'],
                node_type="title" if elem.get('is_heading') else "content",
                content_type=content_type,
                level=elem['heading_level'] if elem.get('is_heading') and elem.get('heading_level') else None,
                path_sequence=[],
                path_titles=""
            )
            next_node_id += 1
            ordered_nodes.append(node)  # 将新节点添加到有序节点列表
            
            if node.node_type == "title":
                # 处理标题节点
                # 安全地移除所有大于当前节点级别的层级

                parent_level = max(l for l in current_levels.keys() if l < node.level)
                parent = current_levels[parent_level]
                
                # 设置兄弟节点关系
                if parent.children:
                    prev_node = parent.children[-1]
                    node.prev_sibling = prev_node.node_id 
                    if prev_node:
                        prev_node.next_sibling = node.node_id
                else:
                    node.prev_sibling = None
                node.next_sibling = None
                
                # 更新节点关系
                node.parent = parent
                parent.children.append(node)
                
                # 更新当前级别节点
                current_levels[node.level] = node
                # 移除所有更高级别的节点
                levels_to_remove = [l for l in current_levels.keys() if l > node.level]
                for l in sorted(levels_to_remove, reverse=True):
                    current_levels.pop(l)


                last_level = node.level  # 更新last_level为当前节点的级别
                
                # 更新路径信息
                node.path_sequence = parent.path_sequence + [node.node_id]
                node.path_titles = (parent.path_titles + " > " + node.content).strip(" > ")
            else:
                # 处理内容节点，添加到当前最深层级的标题下
                parent = current_levels[last_level]
                
                # 设置兄弟节点关系 (在添加到parent.children之前设置)
                if parent.children:
                    prev_node = parent.children[-1]
                    node.prev_sibling = prev_node.node_id
                    prev_node.next_sibling = node.node_id
                else:
                    node.prev_sibling = None
                node.next_sibling = None
                
                # 更新节点关系 (移到后面)
                node.parent = parent
                parent.children.append(node)
                
                # 更新路径信息
                node.path_sequence = parent.path_sequence + [node.node_id]
                node.path_titles = parent.path_titles
        
        # 返回时创建DocxTree实例，包含有序节点列表
        return root, ordered_nodes
