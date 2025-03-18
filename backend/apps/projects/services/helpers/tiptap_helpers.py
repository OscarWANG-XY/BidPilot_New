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
    def find_nodes_by_type(doc: Dict[str, Any], node_type: str) -> List[Dict[str, Any]]:
        """
        在文档中查找特定类型的节点
        
        Args:
            doc: TipTap 文档对象
            node_type: 节点类型（如 'heading', 'paragraph', 'table'）
            
        Returns:
            匹配节点的列表，每个节点包含额外的 _path 属性表示节点路径
        """
        result = []
        
        def traverse(node, path=None):
            if path is None:
                path = []
                
            if isinstance(node, list):
                for i, item in enumerate(node):
                    traverse(item, path + [i])
                return
                
            if isinstance(node, dict):
                # 检查当前节点是否为目标类型
                if node.get("type") == node_type:
                    # 创建节点副本并添加路径信息
                    node_copy = node.copy()
                    node_copy["_path"] = path.copy()
                    result.append(node_copy)
                
                # 递归处理子节点
                for key, value in node.items():
                    if key == "content" and isinstance(value, (list, dict)):
                        traverse(value, path)
        
        traverse(doc)
        return result
    
    @staticmethod
    def get_headings(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取文档中的所有标题节点
        
        Args:
            doc: TipTap 文档对象
            
        Returns:
            标题节点列表
        """
        return TiptapUtils.find_nodes_by_type(doc, "heading")
    
    @staticmethod
    def get_paragraphs(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取文档中的所有段落节点
        
        Args:
            doc: TipTap 文档对象
            
        Returns:
            段落节点列表
        """
        return TiptapUtils.find_nodes_by_type(doc, "paragraph")
    
    @staticmethod
    def get_tables(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取文档中的所有表格节点
        
        Args:
            doc: TipTap 文档对象
            
        Returns:
            表格节点列表
        """
        return TiptapUtils.find_nodes_by_type(doc, "table")
    
    @staticmethod
    def extract_text_from_node(node: Dict[str, Any]) -> str:
        """
        从节点中提取纯文本内容
        
        Args:
            node: TipTap 节点对象
            
        Returns:
            节点的纯文本内容
        """
        result = []
        
        def collect_text(node):
            if isinstance(node, list):
                for item in node:
                    collect_text(item)
                return
                
            if isinstance(node, dict):
                if node.get("type") == "text":
                    result.append(node.get("text", ""))
                
                # 递归处理子节点
                for key, value in node.items():
                    if key == "content" and isinstance(value, (list, dict)):
                        collect_text(value)
        
        collect_text(node)
        return "".join(result)
    
    @staticmethod
    def get_document_toc(doc: Dict[str, Any], max_level: int = 3) -> List[Dict[str, Any]]:
        """
        生成文档的目录结构
        
        Args:
            doc: TipTap 文档对象
            max_level: 最大标题级别
            
        Returns:
            目录结构列表
        """
        headings = TiptapUtils.get_headings(doc)
        toc = []
        
        for heading in headings:
            level = heading.get("attrs", {}).get("level", 1)
            if level <= max_level:
                text = TiptapUtils.extract_text_from_node(heading)
                path = heading.get("_path", [])
                position = path[-1] if path else -1
                
                toc.append({
                    "title": text,
                    "level": level,
                    "position": position
                })
        
        return toc
    
    @staticmethod
    def find_node_by_path(doc: Dict[str, Any], path: List[int]) -> Optional[Dict[str, Any]]:
        """
        根据路径查找节点
        
        Args:
            doc: TipTap 文档对象
            path: 节点路径
            
        Returns:
            找到的节点或 None
        """
        current = doc
        
        for index in path:
            if isinstance(current, dict) and "content" in current:
                current = current["content"]
            
            if isinstance(current, list) and 0 <= index < len(current):
                current = current[index]
            else:
                return None
        
        return current
    
    @staticmethod
    def update_node_by_path(doc: Dict[str, Any], path: List[int], updater: Callable[[Dict[str, Any]], Dict[str, Any]]) -> bool:
        """
        根据路径更新节点
        
        Args:
            doc: TipTap 文档对象
            path: 节点路径
            updater: 更新函数，接收节点并返回更新后的节点
            
        Returns:
            是否成功更新
        """
        if not path:
            return False
            
        # 最后一个索引和父路径
        last_index = path[-1]
        parent_path = path[:-1]
        
        # 查找父节点
        parent = doc
        for index in parent_path:
            if isinstance(parent, dict) and "content" in parent:
                parent = parent["content"]
            
            if isinstance(parent, list) and 0 <= index < len(parent):
                parent = parent[index]
            else:
                return False
        
        # 确保父节点有内容数组
        if isinstance(parent, dict) and "content" in parent:
            parent = parent["content"]
        
        # 检查索引是否有效
        if isinstance(parent, list) and 0 <= last_index < len(parent):
            parent[last_index] = updater(parent[last_index])
            return True
            
        return False
    
    @staticmethod
    def add_node(doc: Dict[str, Any], node: Dict[str, Any], position: Optional[int] = None) -> bool:
        """
        向文档添加新节点
        
        Args:
            doc: TipTap 文档对象
            node: 要添加的节点
            position: 插入位置，默认为文档末尾
            
        Returns:
            是否成功添加
        """
        try:
            if "content" not in doc:
                doc["content"] = []
                
            if position is None:
                doc["content"].append(node)
            else:
                doc["content"].insert(min(position, len(doc["content"])), node)
                
            return True
        except Exception as e:
            logger.error(f"添加节点失败: {e}")
            return False
    
    @staticmethod
    def create_heading(text: str, level: int = 1) -> Dict[str, Any]:
        """
        创建标题节点
        
        Args:
            text: 标题文本
            level: 标题级别(1-6)
            
        Returns:
            标题节点
        """
        return {
            "type": "heading",
            "attrs": {"level": min(max(level, 1), 6)},
            "content": [{"type": "text", "text": text}]
        }
    
    @staticmethod
    def create_paragraph(text: str) -> Dict[str, Any]:
        """
        创建段落节点
        
        Args:
            text: 段落文本
            
        Returns:
            段落节点
        """
        return {
            "type": "paragraph",
            "content": [{"type": "text", "text": text}]
        }
    
    @staticmethod
    def create_empty_document() -> Dict[str, Any]:
        """
        创建空文档
        
        Returns:
            空的 TipTap 文档对象
        """
        return {"type": "doc", "content": []}
    
    @staticmethod
    def validate_tiptap_structure(doc: Dict[str, Any]) -> bool:
        """
        验证 TipTap 文档结构是否有效
        
        Args:
            doc: TipTap 文档对象
            
        Returns:
            文档结构是否有效
        """
        try:
            # 基本结构检查
            if not isinstance(doc, dict):
                return False
                
            if doc.get("type") != "doc":
                return False
                
            if "content" not in doc or not isinstance(doc["content"], list):
                return False
                
            # 可以添加更多验证规则
                
            return True
        except Exception:
            return False
    
    @staticmethod
    def html_to_tiptap(html: str) -> Dict[str, Any]:
        """
        转换 HTML 到 TipTap 格式
        
        注意：这是一个占位方法，需要实际实现
        可以考虑使用 lxml 或 BeautifulSoup 进行实现
        
        Args:
            html: HTML 字符串
            
        Returns:
            TipTap 文档对象
        """
        # 这需要更复杂的实现
        # 可能需要使用专门的 HTML 解析库
        logger.warning("html_to_tiptap 方法尚未实现")
        return TiptapUtils.create_empty_document()
    
    @staticmethod
    def tiptap_to_html(doc: Dict[str, Any]) -> str:
        """
        转换 TipTap 格式到 HTML
        
        注意：这是一个占位方法，需要实际实现
        
        Args:
            doc: TipTap 文档对象
            
        Returns:
            HTML 字符串
        """
        # 这需要更复杂的实现
        logger.warning("tiptap_to_html 方法尚未实现")
        return "<div></div>"
    
    @staticmethod
    def clean_text(text: str) -> str:
        """
        清理文本内容
        
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
    
    @staticmethod
    def remove_node_by_path(doc: Dict[str, Any], path: List[int]) -> bool:
        """
        根据路径删除节点
        
        Args:
            doc: TipTap 文档对象
            path: 节点路径
            
        Returns:
            是否成功删除
        """
        if not path:
            return False
            
        # 最后一个索引和父路径
        last_index = path[-1]
        parent_path = path[:-1]
        
        # 查找父节点
        parent = doc
        for index in parent_path:
            if isinstance(parent, dict) and "content" in parent:
                parent = parent["content"]
            
            if isinstance(parent, list) and 0 <= index < len(parent):
                parent = parent[index]
            else:
                return False
        
        # 确保父节点有内容数组
        if isinstance(parent, dict) and "content" in parent:
            parent = parent["content"]
        
        # 检查索引是否有效
        if isinstance(parent, list) and 0 <= last_index < len(parent):
            del parent[last_index]
            return True
            
        return False


# Django 模型整合示例
class TiptapDocumentMixin:
    """
    为 Django 模型提供 TipTap 文档支持的 Mixin 类
    
    示例用法:
    ```python
    class Document(models.Model, TiptapDocumentMixin):
        title = models.CharField(max_length=255)
        content_json = models.TextField(blank=True, default='{"type":"doc","content":[]}')
        
        # 可选：自定义 JSON 字段名
        tiptap_field_name = 'content_json'
    ```
    """
    
    # 默认 TipTap 内容字段名
    tiptap_field_name = 'content_json'
    
    def get_tiptap_content(self) -> Dict[str, Any]:
        """获取 TipTap 文档内容"""
        field_name = getattr(self, 'tiptap_field_name', 'content_json')
        content = getattr(self, field_name, None)
        
        if not content:
            return TiptapUtils.create_empty_document()
            
        try:
            return json.loads(content)
        except (json.JSONDecodeError, TypeError):
            return TiptapUtils.create_empty_document()
    
    def set_tiptap_content(self, content: Dict[str, Any]) -> None:
        """设置 TipTap 文档内容"""
        field_name = getattr(self, 'tiptap_field_name', 'content_json')
        setattr(self, field_name, json.dumps(content, ensure_ascii=False))
    
    def get_document_headings(self) -> List[Dict[str, Any]]:
        """获取文档中的所有标题"""
        doc = self.get_tiptap_content()
        return TiptapUtils.get_headings(doc)
    
    def get_document_toc(self, max_level: int = 3) -> List[Dict[str, Any]]:
        """获取文档目录结构"""
        doc = self.get_tiptap_content()
        return TiptapUtils.get_document_toc(doc, max_level)
    
    def add_heading(self, text: str, level: int = 1, position: Optional[int] = None) -> bool:
        """添加标题到文档"""
        doc = self.get_tiptap_content()
        heading = TiptapUtils.create_heading(text, level)
        
        if TiptapUtils.add_node(doc, heading, position):
            self.set_tiptap_content(doc)
            return True
        return False
    
    def add_paragraph(self, text: str, position: Optional[int] = None) -> bool:
        """添加段落到文档"""
        doc = self.get_tiptap_content()
        paragraph = TiptapUtils.create_paragraph(text)
        
        if TiptapUtils.add_node(doc, paragraph, position):
            self.set_tiptap_content(doc)
            return True
        return False