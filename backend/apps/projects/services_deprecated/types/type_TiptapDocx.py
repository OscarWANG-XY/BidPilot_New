from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any, Union
import json
from apps.projects.models import Project
from apps.projects.services.types import ModelData


@dataclass
class TiptapDocx:
    """存储Tiptap JSON格式的文档数据类"""
    content: Dict[str, Any]  # Tiptap文档内容
    _headings_cache: Optional[List[Dict[str, Any]]] = field(default=None, repr=False)
    _paragraphs_cache: Optional[List[Dict[str, Any]]] = field(default=None, repr=False)
    _tables_cache: Optional[List[Dict[str, Any]]] = field(default=None, repr=False)

    def __post_init__(self):
        """初始化后确保content是Dict格式"""
        if isinstance(self.content, str):
            try:
                self.content = json.loads(self.content)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON content provided")

    def to_model(self, indent: Optional[int] = None) -> str:
        """将文档内容转换为JSON字符串"""
        return json.dumps(self.content, ensure_ascii=False, indent=indent)

    @classmethod
    def from_model(cls, data: str) -> 'TiptapDocx':
        """从字典创建TiptapDocx实例"""
        return cls(content=json.loads(data))

    def get_headings(self, reset_cache: bool = False) -> List[Dict[str, Any]]:
        """获取所有标题节点
        
        Args:
            reset_cache: 是否重置缓存，强制重新查找
            
        Returns:
            标题节点列表
        """
        if self._headings_cache is None or reset_cache:
            self._headings_cache = self._find_nodes_by_type("heading")
        return self._headings_cache

    def get_paragraphs(self, reset_cache: bool = False) -> List[Dict[str, Any]]:
        """获取所有段落节点
        
        Args:
            reset_cache: 是否重置缓存，强制重新查找
            
        Returns:
            段落节点列表
        """
        if self._paragraphs_cache is None or reset_cache:
            self._paragraphs_cache = self._find_nodes_by_type("paragraph")
        return self._paragraphs_cache

    def get_tables(self, reset_cache: bool = False) -> List[Dict[str, Any]]:
        """获取所有表格节点
        
        Args:
            reset_cache: 是否重置缓存，强制重新查找
            
        Returns:
            表格节点列表
        """
        if self._tables_cache is None or reset_cache:
            self._tables_cache = self._find_nodes_by_type("table")
        return self._tables_cache

    def _find_nodes_by_type(self, node_type: str) -> List[Dict[str, Any]]:
        """递归查找指定类型的节点
        
        Args:
            node_type: 节点类型
            
        Returns:
            节点列表
        """
        result = []
        self._traverse_nodes(self.content, node_type, result)
        return result

    def _traverse_nodes(self, node: Union[Dict[str, Any], List], target_type: str, result: List[Dict[str, Any]], path: Optional[List[int]] = None):
        """递归遍历节点树查找指定类型的节点
        
        Args:
            node: 当前节点或节点列表
            target_type: 目标节点类型
            result: 结果列表，用于存储找到的节点
            path: 当前节点的路径
        """
        if path is None:
            path = []

        if isinstance(node, list):
            for i, item in enumerate(node):
                current_path = path + [i]
                self._traverse_nodes(item, target_type, result, current_path)
            return

        if isinstance(node, dict):
            # 检查当前节点是否为目标类型
            if node.get("type") == target_type:
                # 添加路径信息
                node_copy = node.copy()
                node_copy["_path"] = path.copy()
                result.append(node_copy)

            # 递归处理子节点
            for key, value in node.items():
                if key == "content" and (isinstance(value, list) or isinstance(value, dict)):
                    self._traverse_nodes(value, target_type, result, path)

    def get_heading_text(self, heading: Dict[str, Any]) -> str:
        """获取标题节点的纯文本内容
        
        Args:
            heading: 标题节点
            
        Returns:
            标题的纯文本内容
        """
        return self._extract_text_from_node(heading)

    def get_paragraph_text(self, paragraph: Dict[str, Any]) -> str:
        """获取段落节点的纯文本内容
        
        Args:
            paragraph: 段落节点
            
        Returns:
            段落的纯文本内容
        """
        return self._extract_text_from_node(paragraph)

    def _extract_text_from_node(self, node: Dict[str, Any]) -> str:
        """从节点中提取纯文本
        
        Args:
            node: 文档节点
            
        Returns:
            节点的纯文本内容
        """
        result = []
        self._collect_text(node, result)
        return "".join(result)

    def _collect_text(self, node: Union[Dict[str, Any], List], result: List[str]):
        """递归收集节点中的所有文本
        
        Args:
            node: 当前节点或节点列表
            result: 用于存储文本的列表
        """
        if isinstance(node, list):
            for item in node:
                self._collect_text(item, result)
            return

        if isinstance(node, dict):
            if node.get("type") == "text":
                result.append(node.get("text", ""))

            # 递归处理子节点
            for key, value in node.items():
                if key == "content" and (isinstance(value, list) or isinstance(value, dict)):
                    self._collect_text(value, result)

    def format_headings_summary(self) -> str:
        """格式化所有标题元素为易读的摘要字符串"""
        headings = self.get_headings()
        
        formatted_headings = []
        for heading in headings:
            level = heading.get("attrs", {}).get("level", 1)
            path = heading.get("_path", [])
            position = path[-1] if path else -1
            text = self.get_heading_text(heading)
            
            formatted_headings.append(
                f'title:{text}, level:{level}, position:{position}'
            )
        
        return "\n".join(formatted_headings)

    def add_heading(self, text: str, level: int = 1, position: Optional[int] = None) -> Dict[str, Any]:
        """添加新的标题
        
        Args:
            text: 标题文本
            level: 标题级别(1-6)
            position: 插入位置，默认为文档末尾
            
        Returns:
            添加的标题节点
        """
        heading_node = {
            "type": "heading",
            "attrs": {"level": min(max(level, 1), 6)},
            "content": [{"type": "text", "text": text}]
        }
        
        if position is None:
            # 添加到文档末尾
            if "content" not in self.content:
                self.content["content"] = []
            self.content["content"].append(heading_node)
        else:
            # 插入到指定位置
            if "content" not in self.content:
                self.content["content"] = []
            self.content["content"].insert(position, heading_node)
        
        # 重置缓存
        self._headings_cache = None
        
        return heading_node

    def add_paragraph(self, text: str, position: Optional[int] = None) -> Dict[str, Any]:
        """添加新的段落
        
        Args:
            text: 段落文本
            position: 插入位置，默认为文档末尾
            
        Returns:
            添加的段落节点
        """
        para_node = {
            "type": "paragraph",
            "content": [{"type": "text", "text": text}]
        }
        
        if position is None:
            # 添加到文档末尾
            if "content" not in self.content:
                self.content["content"] = []
            self.content["content"].append(para_node)
        else:
            # 插入到指定位置
            if "content" not in self.content:
                self.content["content"] = []
            self.content["content"].insert(position, para_node)
        
        # 重置缓存
        self._paragraphs_cache = None
        
        return para_node

    def get_document_toc(self, max_level: int = 3) -> List[Dict[str, Any]]:
        """生成文档的目录结构
        
        Args:
            max_level: 最大标题级别
            
        Returns:
            目录结构列表
        """
        headings = self.get_headings()
        toc = []
        
        for heading in headings:
            level = heading.get("attrs", {}).get("level", 1)
            if level <= max_level:
                text = self.get_heading_text(heading)
                path = heading.get("_path", [])
                position = path[-1] if path else -1
                
                toc.append({
                    "title": text,
                    "level": level,
                    "position": position
                })
        
        return toc

    def clean_text(self, text: str) -> str:
        """清理文本内容
        
        Args:
            text: 原始文本
            
        Returns:
            清理后的文本
        """
        if not text:
            return text
            
        # 去除首尾空格
        text = text.strip()
        # 将多个连续空格替换为单个空格
        text = ' '.join(text.split())
        # 处理换行符前后的空格
        text = '\n'.join(line.strip() for line in text.splitlines())
        
        return text