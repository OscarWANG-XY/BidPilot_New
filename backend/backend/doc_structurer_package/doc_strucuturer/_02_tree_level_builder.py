from typing import List
from ._01_doc_node_creater import DocumentNode_v1

class TreeLevelBuilder:
    """构建单层级树节点的工具类"""
    
    @staticmethod
    def build(nodes: List[DocumentNode_v1], target_level: int) -> List[DocumentNode_v1]:
        """构建下一层级的节点结构
        
        Args:
            nodes: 未建立层级关系的文档节点列表
            parent_level: 父节点的层级 (0 表示根节点, 1 表示一级标题，以此类推)
        
        Returns:
            List[DocumentNode_v1]: 构建好的下一层级节点列表
        """
        
        # 添加防御性检查
        if nodes is None:
            return []   #如果输入的节点列表为空，则返回空列表   
        
        result = []  #用来存储构建好的目标层级的节点
        current_heading_node = None # 当前正在处理的标题节点。用来跟踪树中的父节点。
        current_content = [] # 当前标题节点下的所有非标题节点，这些节点会被归到父标题节点下。
        
        for node in nodes:
            # 检查是否是目标层级的标题节点
            is_target_heading = (
                node.element.is_heading and 
                node.element.heading_level == target_level
            )
            
            if is_target_heading:    #若当前节点是标题
                # 处理之前收集的内容
                if current_heading_node and current_content:  # 如果当前已经有一个标题节点，并且当前有一些非标题内容
                    if current_heading_node.children is None:
                        current_heading_node.children = []
                    current_heading_node.children.extend(current_content)
                    for content_node in current_content: #遍历 current_content 中的每个节点，设置其父节点为当前的标题节点 (parent)。
                        content_node.parent = current_heading_node
                
                current_content = [] #清空 current_content，准备处理下一个标题节点
                
                # 设置新标题节点的关系
                node.prev_sibling = current_heading_node.node_id if current_heading_node else None    #设置新标题节点的 prev_sibling 为 current_heading_node，当不存在当前节点时，prev_sibling 为 None
                if current_heading_node:
                    current_heading_node.next_sibling = node.node_id #如果当前标题节点存在，设置前一个标题节点的 next_sibling 为当前标题节点，即建立双向兄弟关系
                
                result.append(node) #将新标题节点添加到 result 列表中，表示它已经构建完成
                current_heading_node = node #将当前标题节点设置为新标题节点，准备处理下一个标题节点
            else:
                # 收集非标题内容
                if current_heading_node: # 如果存在当前标题节点
                    current_content.append(node) #将非标题节点添加到 current_content 列表中，表示它们属于当前标题节点
                else:
                    result.append(node) #如果当前没有标题节点，说明这是属于父级的直接内容
        
        # 处理最后一个标题节点的内容
        # 在循环结束后，如果有内容还未被添加到树中（即最后一个标题节点下的内容），则将这些内容归到最后一个标题节点下，更新它们的父节点。
        if current_heading_node and current_content:
            if current_heading_node.children is None:
                current_heading_node.children = []
            current_heading_node.children.extend(current_content)
            for content_node in current_content:
                content_node.parent = current_heading_node   #更新内容的父节点
        
        return result

    