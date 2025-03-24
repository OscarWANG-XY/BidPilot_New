import json
from typing import Dict, List, Any, Optional, Union, Callable
import logging

logger = logging.getLogger(__name__)

class TiptapUtils:
    """
    处理 TipTap JSON 格式文档的工具类
    提供一系列静态方法用于解析、查询和操作 TipTap 文档
    """
    
    @staticmethod
    def load_from_string(json_str: str) -> Dict[str, Any]:
        """
        从 JSON 字符串加载 TipTap 文档
        
        Args:
            json_str: TipTap JSON 文档字符串
            
        Returns:
            解析后的 TipTap 文档对象
            
        Raises:
            json.JSONDecodeError: JSON 解析错误
        """
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error(f"无法解析 TipTap JSON: {e}")
            raise
    
    @staticmethod
    def to_string(doc: Dict[str, Any], indent: Optional[int] = None) -> str:
        """
        将 TipTap 文档转换为 JSON 字符串
        
        Args:
            doc: TipTap 文档对象
            indent: 缩进格式，默认为 None（无缩进）
            
        Returns:
            格式化的 JSON 字符串
        """
        return json.dumps(doc, ensure_ascii=False, indent=indent)
    
    @staticmethod
    def extract_indexed_paragraphs(doc: Dict[str, Any], max_length: Optional[int] = None) -> tuple[List[Dict[str, str]], Dict[int, List[int]]]:
        """
        从 TipTap 文档中提取带有索引的段落，用于大模型分析
        
        Args:
            doc: TipTap 文档对象
            max_length: 内容最大长度，超过此长度将被截断并添加省略号，默认为 None（不截断）
            
        Returns:
            tuple 包含两个元素:
            1. 带索引的段落列表，格式为:
               [
                   {"index": 0, "content": "段落内容1"},
                   {"index": 1, "content": "段落内容2"},
                   ...
               ]
            2. 索引到路径的映射，格式为:
               {
                   0: [0, 1, 0],
                   1: [0, 2, 0],
                   ...
               }
            
        Note:
            - 表格内的段落不会被提取
            - 只提取文本内容，不包含格式信息
            - 可以通过 index_path_map 和 locate_paragraph_by_path 方法定位原始段落
            - 当设置 max_length 时，超长内容将被截断并添加省略号
        """
        paragraphs = []
        index_path_map = {}
        paragraph_index = 0
        
        def process_node(node, path=None, in_table=False):
            nonlocal paragraph_index
            if path is None:
                path = []
            
            # 如果是表格节点，标记在表格内
            if node.get("type") == "table":
                for i, child in enumerate(node.get("content", [])):
                    process_node(child, path + [i], in_table=True)
                return
                
            # 如果是段落节点且不在表格内，提取文本
            if node.get("type") == "paragraph" and not in_table:
                text_content = TiptapUtils._extract_text_from_node(node)
                if text_content.strip():  # 只添加非空段落
                    # 如果设置了最大长度且内容超过最大长度，则截断并添加省略号
                    if max_length and len(text_content) > max_length:
                        text_content = text_content[:max_length] + "..."
                        
                    paragraphs.append({
                        "index": paragraph_index,
                        "content": text_content
                    })
                    index_path_map[paragraph_index] = path.copy()
                    paragraph_index += 1
            
            # 递归处理子节点
            for i, child in enumerate(node.get("content", [])):
                process_node(child, path + [i], in_table)
        
        # 从文档根节点开始处理
        process_node(doc)
        paragraphs = "\n".join(f"content: {p['content']} | index: {p['index']}" for p in paragraphs[50:100])
        return paragraphs, index_path_map
    
    @staticmethod
    def _extract_text_from_node(node: Dict[str, Any]) -> str:
        """
        从节点中提取纯文本内容
        
        Args:
            node: TipTap 节点对象
            
        Returns:
            节点中的纯文本内容
        """
        if node.get("type") == "text":
            return node.get("text", "")
        
        text_parts = []
        for child in node.get("content", []):
            text_parts.append(TiptapUtils._extract_text_from_node(child))
        
        return "".join(text_parts)
    
    @staticmethod
    def locate_paragraph_by_index(doc: Dict[str, Any], index: int, index_path_map: Dict[int, List[int]]) -> Optional[Dict[str, Any]]:
        """
        根据段落索引在 TipTap 文档中定位段落节点
        
        Args:
            doc: TipTap 文档对象
            index: 段落索引
            index_path_map: 索引到路径的映射
            
        Returns:
            找到的段落节点，如果索引无效则返回 None
        """
        if index not in index_path_map:
            return None
        
        path = index_path_map[index]
        return TiptapUtils.locate_paragraph_by_path(doc, path)
    
    @staticmethod
    def locate_paragraph_by_path(doc: Dict[str, Any], path: List[int]) -> Optional[Dict[str, Any]]:
        """
        根据路径在 TipTap 文档中定位段落节点
        
        Args:
            doc: TipTap 文档对象
            path: 段落在文档中的路径
            
        Returns:
            找到的段落节点，如果路径无效则返回 None
        """
        current = doc
        for index in path:
            if "content" not in current or not isinstance(current["content"], list):
                return None
            if index >= len(current["content"]):
                return None
            current = current["content"][index]
        return current






    
    