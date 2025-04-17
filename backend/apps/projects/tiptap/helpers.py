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
        paragraphs = "\n".join(f"content: {p['content']} | index: {p['index']}" for p in paragraphs)
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
    
    # 提取带有索引的段落
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
        paragraphs = "\n".join(f"content: {p['content']} | index: {p['index']}" for p in paragraphs)
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
    
    # 按章节分块并提取带索引的段落
    @staticmethod
    def extract_chapters(doc: Dict[str, Any], max_length: Optional[int] = None, heading_types: List[str] = None) -> Dict[str, Any]:
        """
        从 TipTap 文档中提取章节和段落，并按章节分组
        
        Args:
            doc: TipTap 文档对象
            max_length: 内容最大长度，超过此长度将被截断并添加省略号，默认为 None（不截断）
            heading_types: 作为章节标题的节点类型列表，默认为 ["heading"]
            
        Returns:
            按章节分组的内容字典，格式为:
            {
                "chapters": [
                    {
                        "title": "章节标题",
                        "level": 1,  # 标题级别
                        "path": [0, 1],  # 标题节点在文档中的路径
                        "paragraphs": "content: 段落内容1 | index: 0\ncontent: 段落内容2 | index: 1"
                    },
                    ...
                ],
                "index_path_map": {
                    0: [0, 2, 0],
                    1: [0, 3, 0],
                    ...
                }
            }
            
        Note:
            - 如果文档开头没有标题，将创建一个标题为"引言"的默认章节
            - 表格内的段落不会被提取
            - 只提取文本内容，不包含格式信息
            - 可以通过 index_path_map 和 locate_paragraph_by_path 方法定位原始段落
            - 当设置 max_length 时，超长内容将被截断并添加省略号
        """
        if heading_types is None:
            heading_types = ["heading"]
            
        chapters = []
        index_path_map = {}
        paragraph_index = 0
        
        # 初始化默认章节（如果文档开头没有标题）
        current_chapter = {
            "title": "引言",
            "level": 0,
            "path": [],
            "paragraphs": [] # 临时存储段落对象列表
        }
        
        def process_node(node, path=None, in_table=False):
            nonlocal paragraph_index, current_chapter
            if path is None:
                path = []
                
            # 处理标题节点（章节分隔符）
            if node.get("type") in heading_types:
                # 如果当前章节不为空且不是默认章节或者有内容，则添加到章节列表
                if current_chapter["paragraphs"] or current_chapter["level"] > 0:
                    # 将段落列表转换为字符串格式
                    paragraphs_str = "\n".join(f"content: {p['content']} | index: {p['index']}" for p in current_chapter["paragraphs"])
                    current_chapter["paragraphs"] = paragraphs_str
                    chapters.append(current_chapter)
                
                # 创建新章节
                title_text = TiptapUtils._extract_text_from_node(node)
                level = node.get("attrs", {}).get("level", 1)
                
                current_chapter = {
                    "title": title_text,
                    "level": level,
                    "path": path.copy(),
                    "paragraphs": [] # 临时存储段落对象列表
                }
                return
                
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
                        
                    paragraph_data = {
                        "index": paragraph_index,
                        "content": text_content
                    }
                    
                    # 添加到当前章节
                    current_chapter["paragraphs"].append(paragraph_data)
                    
                    # 记录索引到路径的映射
                    index_path_map[paragraph_index] = path.copy()
                    paragraph_index += 1
            
            # 递归处理子节点
            for i, child in enumerate(node.get("content", [])):
                process_node(child, path + [i], in_table)
        
        # 从文档根节点开始处理
        process_node(doc)
        
        # 添加最后一个章节
        if current_chapter["paragraphs"] or current_chapter["level"] > 0:
            # 将最后一个章节的段落列表转换为字符串格式
            paragraphs_str = "\n".join(f"content: {p['content']} | index: {p['index']}" for p in current_chapter["paragraphs"])
            current_chapter["paragraphs"] = paragraphs_str
            chapters.append(current_chapter)
            
        return {
            "chapters": chapters,
            "index_path_map": index_path_map
        }


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
    

    # 更新标题
    @staticmethod
    def update_titles_from_list(doc: Dict[str, Any], title_list: List[Dict[str, Any]], index_path_map: Dict[int, List[int]]) -> Dict[str, Any]:
        """
        根据标题列表更新 TipTap 文档中的标题
        
        Args:
            doc: TipTap 文档对象
            title_list: 标题列表，格式为:
                [
                    {"index": 45, "level": 1, "title": "第一章 招标公告"},
                    {"index": 93, "level": 1, "title": "第二章 招标需求"},
                    ...
                ]
            index_path_map: 索引到路径的映射
            
        Returns:
            更新后的 TipTap 文档对象
            
        Note:
            - 标题列表中的 index 必须存在于 index_path_map 中
            - level 将被用于设置标题级别（1-6）
            - 如果节点不是标题节点，会将其转换为标题节点
        """
        # 创建文档的深拷贝，避免修改原始文档
        updated_doc = json.loads(json.dumps(doc))
        
        for title_info in title_list:
            paragraph_index = title_info.get("index")
            title_level = title_info.get("level", 1)
            title_text = title_info.get("title", "")
            
            # 确保 level 在有效范围内（1-6）
            if title_level < 1:
                title_level = 1
            elif title_level > 6:
                title_level = 6
                
            # 查找段落节点
            # 将 paragraph_index 转换为字符串，以便与 index_path_map 中的键匹配
            str_index = str(paragraph_index)
            int_index = paragraph_index
            
            # 尝试同时匹配字符串和整数索引
            if str_index in index_path_map:
                path = index_path_map[str_index]
            elif int_index in index_path_map:
                path = index_path_map[int_index]
            else:
                logger.warning(f"索引 {paragraph_index} 不存在于索引路径映射中，跳过此标题")
                continue
            
            # 获取段落节点
            current_node = updated_doc
            parent_node = None
            current_path_index = -1
            
            for i, path_index in enumerate(path):
                parent_node = current_node
                current_path_index = path_index
                
                if "content" not in current_node or not isinstance(current_node["content"], list):
                    logger.warning(f"路径 {path} 在索引 {i} 处无效，跳过此标题")
                    break
                    
                if path_index >= len(current_node["content"]):
                    logger.warning(f"路径 {path} 在索引 {i} 处越界，跳过此标题")
                    break
                    
                current_node = current_node["content"][path_index]
                
                # 如果是最后一个路径索引，更新节点
                if i == len(path) - 1:
                    # 创建标题节点
                    heading_node = {
                        "type": f"heading{title_level}",
                        "content": [
                            {
                                "type": "text",
                                "text": title_text
                            }
                        ]
                    }
                    
                    # 保留原节点的属性（如果有）
                    for key, value in current_node.items():
                        if key not in ["type", "content"]:
                            heading_node[key] = value
                            
                    # 更新父节点中的内容
                    parent_node["content"][current_path_index] = heading_node
            
        return updated_doc

    # 查找所有标题
    @staticmethod
    def find_all_headings(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        查找并返回文档中的所有标题节点
        
        Args:
            doc: TipTap 文档对象
            
        Returns:
            标题节点列表，格式为:
            [
                {
                    "path": [0, 1, 0],     # 节点路径
                    "level": 1,            # 标题级别 (1-6)
                    "title": "第一章 招标公告",  # 标题文本
                    "node": {...}          # 原始节点对象
                },
                ...
            ]
        """
        headings = []
        
        def process_node(node, path=None):
            if path is None:
                path = []
                
            # 检查节点类型是否为标题
            node_type = node.get("type", "")
            if node_type.startswith("heading") and len(node_type) > 7:
                try:
                    # 提取标题级别
                    level = int(node_type[7:])
                    if 1 <= level <= 6:
                        # 提取标题文本
                        title_text = TiptapUtils._extract_text_from_node(node)
                        headings.append({
                            "path": path.copy(),
                            "level": level,
                            "title": title_text,
                            "node": node
                        })
                except ValueError:
                    # 如果标题级别不是有效数字，则跳过
                    pass
            
            # 递归处理子节点
            for i, child in enumerate(node.get("content", [])):
                process_node(child, path + [i])
        
        # 从文档根节点开始处理
        process_node(doc)
        return headings
    
    # 打印所有标题 
    @staticmethod
    def print_headings(doc: Dict[str, Any], indent: bool = True) -> str:
        """
        查找并打印文档中的所有标题节点
        
        Args:
            doc: TipTap 文档对象
            indent: 是否按标题级别缩进输出
            
        Returns:
            格式化的标题列表字符串
        """
        headings = TiptapUtils.find_all_headings(doc)
        
        # 按文档顺序排序（根据路径）
        headings.sort(key=lambda h: h["path"])
        
        result = []
        for heading in headings:
            prefix = "  " * (heading["level"] - 1) if indent else ""
            result.append(f"{prefix}[H{heading['level']}] {heading['title']}")
        
        return "\n".join(result)