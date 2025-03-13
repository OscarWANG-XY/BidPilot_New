from typing import List, Optional, Generator, Dict
from dataclasses import dataclass
from ._01_doc_node_creater import DocumentNode_v1

class DocTreeRetriever:
    def __init__(self, doc_tree: DocumentNode_v1):
        self.root = doc_tree

#获取文本内容的函数
    def get_all_content(self) -> List[str]:
        """获取所有内容，按文档顺序返回
        输入：文档树数据， doc_tree
        调用方式: DocTreeRetriever(doc_tree), 然后使用.get_all_content()方法
        返回格式: [content1, content2, ...]
        """
        contents = []
        def traverse(node: DocumentNode_v1):  # 遍历文档树，收集所有内容
            if node.element and node.element.content:
                contents.append(node.element.content)
            for child in node.children or []:
                traverse(child)  # 递归遍历子节点
        
        traverse(self.root)
        return contents

    def get_all_content_grouped_by_heading(self) -> Dict[str, List[str]]:
        """获取所有内容，并按标题分组
        输入：文档树数据， doc_tree
        调用方式: DocTreeRetriever(doc_tree), 然后使用.get_content_followed_by_heading()方法
        返回格式: {heading_content: [content1, content2, ...], heading_content2: [content1, content2, ...], ...}
        """
        result = {}
        current_heading = None
        
        def traverse(node: DocumentNode_v1):
            nonlocal current_heading # 声明使用外部变量，即get_heading_content()方法中的current_heading
            if node.element.is_heading:
                current_heading = node.element.content # 将当前标题添加到结果字典中，作为键
                result[current_heading] = [] # 将当前标题添加到结果字典中，作为键
            elif current_heading and node.element.content:
                result[current_heading].append(node.element.content) # 将当前标题下的内容添加到结果字典中，作为值
            
            for child in node.children:
                traverse(child) # 递归遍历子节点
        
        traverse(self.root)
        return result # 返回结果字典， 键为标题，值为标题下的内容列表

    def get_all_content_grouped_by_path(self) -> Dict[str, str]:
        """获取所有内容，按路径分组 {path: content}
        输入：文档树数据， doc_tree
        调用方式: DocTreeRetriever(doc_tree), 然后使用.get_content_with_path()方法
        返回格式: {path1: content1, path2: content2, ...}
        """
        result = {}   # 用于存储结果的字典， 键为路径，值为内容
        def traverse(node: DocumentNode_v1):
            if node.element.content:
                result[node.path] = node.element.content
            for child in node.children:
                traverse(child)
        
        traverse(self.root)
        return result  # 返回结果字典， 键为路径，值为内容

    def iter_content(self) -> Generator[str, None, None]:
        """生成器方式遍历内容"""
        """
        输入：文档树数据， doc_tree
        调用方式: 
        1. DocTreeRetriever(doc_tree), 然后使用.iter_content()方法
        2. iter_content() 返回一个生成器， 生成器会按文档顺序生成内容
        3. 与.get_all_content()方法不同，它一次返回一个内容，需要使用for循环来遍历
        返回格式: 生成器， 生成器会按文档顺序生成内容
        使用方法： 
        for content in doc_tree_retriever.iter_content():
            print(content)
        """
        def traverse(node: DocumentNode_v1):
            if node.element.content:
                yield node.element.content
            for child in node.children:
                yield from traverse(child)
        
        yield from traverse(self.root)

#获取标题的函数
    def get_headings_by_level(self, level: int) -> List[str]:
        """获取指定层级的标题内容
        输入：文档树数据， doc_tree
        调用方式: DocTreeRetriever(doc_tree), 然后使用.get_headings_by_level(level)方法
        返回格式: [content1, content2, ...] ,      
        """
        contents = []
        
        def traverse(node: DocumentNode_v1):
            # 特殊处理 root 节点
            if level == 0:
                if node == self.root and node.element and node.element.content:
                    contents.append(node.element.content)
                return
            
            # 处理其他层级的节点
            if node.element: #and node.element.is_heading:
                if node.level is not None and node.level == level:
                    contents.append(node.element.content)
            
            # 继续遍历子节点
            # 只有标题节点（有level值的节点）才可能有子节点
            if node.children and node.level is not None and node.level < level:
                for child in node.children:
                    traverse(child)
        
        traverse(self.root)
        return contents


#获取层级结构化的内容
    def get_structured_content(self) -> Dict:
        """获取层级结构化的内容，doc_tree的结构化/字典化
        输入：文档树数据， doc_tree
        调用方式: DocTreeRetriever(doc_tree), 然后使用.get_structured_content()方法
        返回格式: 字典，字典的键为content，type，is_heading，heading_level，children
        使用方法： 
        """
        def build_structure(node: DocumentNode_v1) -> Dict:
            result = {
                'content': node.element.content,
                'type': node.element.element_type,
                'is_heading': node.element.is_heading,
                'heading_level': node.element.heading_level,
                'children': []
            }
            
            for child in node.children:
                result['children'].append(build_structure(child))
            return result
        
        return build_structure(self.root)    

#获取节点列表的函数
    def get_next_level_nodes_by_nodeID(self, node_id: str) -> List[DocumentNode_v1]:
        """获取指定节点ID的下一级节点列表
        
        Args:
            node_id: 节点ID，例如 "1.2.3"
            
        Returns:
            List[DocumentNode]: 下一级节点列表
            
        Example:
            如果输入node_id="1.2"，会返回"1.2"节点的所有直接子节点（如"1.2.1", "1.2.2"等）
        """
        # 首先找到目标节点
        target_node = None
        def find_node(node: DocumentNode_v1):
            if node.id == node_id:
                return node
            for child in node.children:
                result = find_node(child)
                if result:
                    return result
            return None
        
        target_node = find_node(self.root)
        
        # 如果找不到目标节点，返回空列表
        if not target_node:
            return []
            
        # 返回目标节点的直接子节点
        return target_node.children or []
    
#打印树形结构
    def print_list_of_all_heading_nodes_by_tree(self):
        """按树形结构打印所有标题节点
        
        打印格式示例：
        root （5 子nodes，其中 2 子标题nodes）
         ├─ 1 第一章  （5 子nodes，其中 1 子标题nodes）
              ├─ 4 第1.1节  （0 子nodes, 其中 0 标题nodes）
              ├─ 7 第1.2节  （3 子nodes, 其中 1 标题nodes）
        """
        def get_child_count(node: DocumentNode_v1) -> int:
            if not node.children:
                return 0
            return len([child for child in node.children])

        def get_heading_child_count(node: DocumentNode_v1) -> int:
            if not node.children:
                return 0
            return len([child for child in node.children if child.element.is_heading])
        
        def print_node(node: DocumentNode_v1, prefix=""):
            if node == self.root:
                child_count = get_child_count(node)
                heading_child_count = get_heading_child_count(node)
                print(f"root （{child_count} 子nodes，其中 {heading_child_count} 子标题nodes）")
                prefix = " "
            
            # 只处理标题节点
            heading_children = []
            if node.children:
                heading_children = [child for child in node.children if child.element.is_heading]
            
            for i, child in enumerate(heading_children):
                is_last = i == len(heading_children) - 1
                current_prefix = prefix + ("└─ " if is_last else "├─ ")
                
                # 打印当前节点
                child_count = get_child_count(child)
                heading_child_count = get_heading_child_count(child)
                print(f"{prefix}{current_prefix}{child.node_id} {child.element.content}  （{child_count} 子nodes, 其中 {heading_child_count} 子标题nodes）")
                
                # 处理子节点，增加缩进
                next_prefix = prefix + ("    " if is_last else " |  ")
                print_node(child, next_prefix)
        
        print_node(self.root)
    

    
