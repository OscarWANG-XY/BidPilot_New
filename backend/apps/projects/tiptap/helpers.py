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
    
    # 提取带有索引的段落 （用于LLM分析）
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
    
    # 按章节分块并提取带索引的段落 （用于LLM分析）
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
                
            # 如果是表格节点，标记在表格内，process_node时不处理。 
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
            
        return chapters,index_path_map
        

    # 将段落节点改为标题
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

                    # 创建 Tiptap 格式的标题节点
                    heading_node = {
                        "type": "heading",
                        "attrs": {
                            "level": title_level
                        },
                        "content": [
                            {
                                "type": "text",
                                "text": title_text
                            }
                        ]
                    }
                    
                # 正确合并原节点的属性
                for key, value in current_node.items():
                    if key not in ["type", "content"]:
                        if key == "attrs":
                            # 合并attrs对象而不是替换
                            for attr_key, attr_value in value.items():
                                heading_node["attrs"][attr_key] = attr_value
                        else:
                            heading_node[key] = value
                            
                    # 更新父节点中的内容
                    parent_node["content"][current_path_index] = heading_node
            
        return updated_doc

    # 打印所有标题 
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
            
            # 处理新的heading格式：type为"heading"，level存储在attrs.level中
            if node_type == "heading":
                # 从attrs中获取level
                level = node.get("attrs", {}).get("level", 0)
                if 1 <= level <= 6:  # 确保level在有效范围内
                    # 提取标题文本
                    title_text = TiptapUtils._extract_text_from_node(node)
                    headings.append({
                        "path": path.copy(),
                        "level": level,
                        "title": title_text,
                        "node": node
                    })
            # 保留对旧格式的兼容性（如果需要）
            elif node_type.startswith("heading") and len(node_type) > 7:
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
    

    # 提取表格，并转为markdown （用于LLM分析）
    @staticmethod
    def extract_tables_to_markdown(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        从 TipTap 文档中提取所有表格，并转换为 Markdown 格式
        
        Args:
            doc: TipTap 文档对象
            
        Returns:
            tuple 包含两个元素:
            1. 表格列表，格式为:
            [
                {
                    "index": 0,           # 表格在文档中的索引
                    "markdown": "| 表头1 | 表头2 |\n|-----|-----|\n| 内容1 | 内容2 |",  # 表格的 Markdown 格式
                },
                ...
            ]
            2. 索引到路径的映射: 
                
        Note:
            - 索引按照表格在文档中出现的顺序从0开始编号
            - 会自动合并跨页拆分的表格（如果两个表格的路径是连续的）
        """
        tables = []
        tables_str = []
        table_index = 0
        index_path_map = {}
        last_table_path = None
        
        def process_node(node, path=None):
            nonlocal table_index, last_table_path
            if path is None:
                path = []
                
            # 检查节点类型是否为表格
            if node.get("type") == "table":
                # 创建一个包含表格的临时文档
                table_doc = {
                    "type": "doc",
                    "content": [node]
                }
                
                # 使用 TiptapClient 将表格转换为 Markdown
                try:
                    from apps.projects.tiptap.client import TiptapClient
                    tiptap_client = TiptapClient()
                    markdown_result = tiptap_client.json_to_markdown(table_doc)
                    markdown_text = markdown_result["data"].strip()
                    
                    # 检查是否需要合并表格（判断路径是否连续）
                    is_continuous = False
                    if last_table_path and len(tables) > 0:
                        # 判断路径是否连续
                        # 两个路径除了最后一个元素外应该相同，且最后一个元素应该相差1
                        if (len(path) == len(last_table_path) and 
                            path[:-1] == last_table_path[:-1] and 
                            path[-1] == last_table_path[-1] + 1):
                            is_continuous = True
                    
                    if is_continuous:
                        # 合并表格：将当前表格的markdown内容追加到上一个表格
                        # 移除markdown表格头部（如果存在）
                        markdown_lines = markdown_text.split('\n')
                        if len(markdown_lines) >= 2 and '|' in markdown_lines[0] and '---' in markdown_lines[1]:
                            markdown_text = '\n'.join(markdown_lines[2:])
                        
                        # 追加到上一个表格
                        tables[-1]["markdown"] += "\n" + markdown_text
                        tables_str[-1]["markdown"] += "\n" + markdown_text
                    else:
                        # 添加新表格
                        tables.append({
                            "index": table_index,
                            # "path": path.copy(),
                            "markdown": markdown_text,
                        })
                        tables_str.append({"markdown": f"index:{table_index}\n {markdown_text} "})

                        index_path_map[table_index] = path.copy()
                        table_index += 1
                    
                    # 更新最后一个表格的路径
                    last_table_path = path.copy()
                    
                except Exception as e:
                    logger.error(f"表格转换为 Markdown 失败: {e}")
            
            # 递归处理子节点
            for i, child in enumerate(node.get("content", [])):
                process_node(child, path + [i])
        
        # 从文档根节点开始处理
        process_node(doc)
        return tables_str, index_path_map
    

    # 给节点添加“字幕说明”信息
    @staticmethod
    def add_captions_to_nodes(doc: Dict[str, Any], captions: List[Dict[str, Any]], index_path_map: Dict[int, List[int]]) -> Dict[str, Any]:
        """
        为 TipTap 文档中的节点添加说明信息
        
        Args:
            doc: TipTap 文档对象
            explanations: 说明信息列表，格式为:
                [
                    {"index": 0, "caption": "这是第一段的说明"},
                    {"index": 1, "caption": "这是第二段的说明"},
                    ...
                ]
            index_path_map: 索引到路径的映射
            
        Returns:
            更新后的 TipTap 文档对象
            
        Note:
            - 说明信息将被添加到节点的 attrs.explanation 属性中
            - 如果节点已有 attrs，将保留原有属性并添加 explanation
            - 如果节点没有 attrs，将创建新的 attrs 对象
        """
        # 创建文档的深拷贝，避免修改原始文档
        updated_doc = json.loads(json.dumps(doc))
        
        for caption_info in captions:
            paragraph_index = caption_info.get("index")
            caption_text = caption_info.get("caption", "")
            
            # 查找节点路径
            # 尝试同时匹配字符串和整数索引
            str_index = str(paragraph_index)
            int_index = paragraph_index
            
            path = None
            if str_index in index_path_map:
                path = index_path_map[str_index]
            elif int_index in index_path_map:
                path = index_path_map[int_index]
            
            if not path:
                logger.warning(f"索引 {paragraph_index} 不存在于索引路径映射中，跳过此说明")
                continue
            
            # 获取节点
            current_node = updated_doc
            for i, path_index in enumerate(path):
                if "content" not in current_node or not isinstance(current_node["content"], list):
                    logger.warning(f"路径 {path} 在索引 {i} 处无效，跳过此说明")
                    break
                    
                if path_index >= len(current_node["content"]):
                    logger.warning(f"路径 {path} 在索引 {i} 处越界，跳过此说明")
                    break
                
                if i == len(path) - 1:
                    # 找到目标节点，添加说明信息
                    node = current_node["content"][path_index]
                    
                    # 确保节点有 attrs 属性
                    if "attrs" not in node:
                        node["attrs"] = {}
                    
                    # 添加说明信息
                    node["attrs"]["caption"] = caption_text
                else:
                    current_node = current_node["content"][path_index]
        
        return updated_doc


    # 打印“增强型”目录框架
    @staticmethod
    def print_enhanced_toc(doc: Dict[str, Any]) -> str:
        """
        打印增强型目录框架，显示完整目录结构，包括标题和图表的说明信息
        
        Args:
            doc: TipTap 文档对象
            
        Returns:
            格式化的增强型目录字符串，包含标题层级和图表说明
        """
        # 查找所有标题
        headings = TiptapUtils.find_all_headings(doc)
        
        # 按文档顺序排序（根据路径）
        headings.sort(key=lambda h: h["path"])
        
        # 查找所有带有caption的节点（图表、表格等）
        captions = []
        
        def find_captions(node, path=None):
            if path is None:
                path = []
                
            # 检查节点是否有caption属性
            if isinstance(node, dict) and "attrs" in node and "caption" in node.get("attrs", {}):
                node_type = node.get("type", "unknown")
                caption_text = node["attrs"]["caption"]
                
                # 提取节点内容的简短描述
                content_preview = ""
                if node_type == "table":
                    content_preview = "表格"
                elif node_type == "image":
                    content_preview = "图片"
                else:
                    # 尝试提取内容预览
                    content_preview = TiptapUtils._extract_text_from_node(node)
                    if len(content_preview) > 30:
                        content_preview = content_preview[:30] + "..."
                
                captions.append({
                    "path": path.copy(),
                    "type": node_type,
                    "caption": caption_text,
                    "preview": content_preview
                })
            
            # 递归处理子节点
            for i, child in enumerate(node.get("content", [])):
                find_captions(child, path + [i])
        
        # 从文档根节点开始查找caption
        find_captions(doc)
        
        # 按文档顺序排序（根据路径）
        captions.sort(key=lambda c: c["path"])
        
        # 合并标题和caption，按照在文档中的顺序排序
        toc_items = []
        
        # 添加标题
        for heading in headings:
            toc_items.append({
                "path": heading["path"],
                "type": "heading",
                "level": heading["level"],
                "content": heading["title"]
            })
        
        # 添加caption
        for caption in captions:
            toc_items.append({
                "path": caption["path"],
                "type": caption["type"],
                "level": 0,  # 将在后续处理中确定
                "content": caption["caption"],
                "preview": caption["preview"]
            })
        
        # 按文档顺序排序
        toc_items.sort(key=lambda item: item["path"])
        
        # 确定caption的级别（基于前一个标题的级别）
        current_level = 1
        for i, item in enumerate(toc_items):
            if item["type"] == "heading":
                current_level = item["level"]
            else:
                # 非标题项的级别比当前标题级别高一级
                item["level"] = current_level + 1
        
        # 生成格式化的目录
        result = []
        for item in toc_items:
            prefix = "  " * (item["level"] - 1)
            path_str = f"path:{item['path']}"
            
            if item["type"] == "heading":
                result.append(f"{prefix}[H{item['level']}] {item['content']} ({path_str})")
            elif item["type"] == "table":
                result.append(f"{prefix}[表] {item['content']} ({path_str})")
            elif item["type"] == "image":
                result.append(f"{prefix}[图] {item['content']} ({path_str})")
            else:
                type_label = item["type"].capitalize() if item["type"] != "unknown" else ""
                result.append(f"{prefix}[{type_label}] {item['content']} ({item['preview']}) ({path_str})")
        
        return "\n".join(result)
    

    # 添加 “前言” 标题
    @staticmethod
    def add_introduction_headings(doc: Dict[str, Any]) -> Dict[str, Any]:
        """
        检查文档标题节点，为带有子标题但缺少前言部分的标题添加前言标题节点
        
        Args:
            doc: TipTap 文档对象
            
        Returns:
            更新后的 TipTap 文档对象
            
        Note:
            - 当一个标题后面紧跟着子标题（而非段落内容）时，会在它们之间添加一个"前言"标题
            - 添加的前言标题级别将比父标题高一级
            - 前言标题的文本默认为"前言"
        """
        # 创建文档的深拷贝，避免修改原始文档
        updated_doc = json.loads(json.dumps(doc))
        
        # 查找所有标题及其路径
        headings = TiptapUtils.find_all_headings(updated_doc)
        
        # 按文档顺序排序（根据路径）
        headings.sort(key=lambda h: h["path"])
        
        # 需要添加前言标题的位置列表
        intro_positions = []
        
        # 检查每个标题
        for i in range(len(headings) - 1):
            current = headings[i]
            next_heading = headings[i + 1]
            
            # 检查当前标题是否有子标题（下一个标题级别更高）
            if next_heading["level"] > current["level"]:
                # 检查两个标题之间是否有内容
                current_path = current["path"]
                next_path = next_heading["path"]
                
                # 检查两个标题是否紧邻（中间没有其他内容）
                has_content_between = False
                
                # 获取当前标题的父节点
                parent_node = updated_doc
                for idx in current_path[:-1]:
                    parent_node = parent_node["content"][idx]
                
                # 获取当前标题和下一个标题在父节点中的索引
                current_idx = current_path[-1]
                
                # 如果下一个标题与当前标题在同一父节点下
                if current_path[:-1] == next_path[:-1]:
                    next_idx = next_path[-1]
                    
                    # 检查两个标题之间是否有其他节点
                    if next_idx - current_idx > 1:
                        # 检查中间节点是否为段落且包含文本
                        for idx in range(current_idx + 1, next_idx):
                            middle_node = parent_node["content"][idx]
                            if middle_node.get("type") == "paragraph":
                                text = TiptapUtils._extract_text_from_node(middle_node)
                                if text.strip():
                                    has_content_between = True
                                    break
                
                # 如果没有内容，添加前言标题
                if not has_content_between:
                    # 创建前言标题的插入位置
                    insert_path = current_path[:-1] + [current_path[-1] + 1]
                    intro_positions.append({
                        "path": insert_path,
                        "level": next_heading["level"],  # 与子标题同级
                        "title": "前言"
                    })
        
        # 从后向前添加前言标题（避免路径变化）
        intro_positions.sort(key=lambda p: p["path"], reverse=True)
        
        for position in intro_positions:
            # 创建前言标题节点
            intro_heading = {
                "type": "heading",
                "attrs": {
                    "level": position["level"]
                },
                "content": [
                    {
                        "type": "text",
                        "text": position["title"]
                    }
                ]
            }
            
            # 插入前言标题
            parent_path = position["path"][:-1]
            insert_idx = position["path"][-1]
            
            # 获取父节点
            parent_node = updated_doc
            for idx in parent_path:
                parent_node = parent_node["content"][idx]
            
            # 插入前言标题
            parent_node["content"].insert(insert_idx, intro_heading)
        
        return updated_doc
    


    
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
    



    
    
    
    @staticmethod
    def extract_content_under_heading(doc: Dict[str, Any], heading_path: List[int], tiptap_client=None) -> str:
        """
        提取指定标题下的所有内容，并转换为Markdown格式
        
        Args:
            doc: TipTap 文档对象
            heading_path: 标题节点在文档中的路径
            tiptap_client: TiptapClient实例，如果为None则会创建新实例
            
        Returns:
            标题下内容的Markdown格式字符串
            
        Note:
            - 提取的内容包括标题下直到下一个同级或更高级标题之前的所有内容
            - 包含表格、图片等所有内容
            - 使用TiptapClient的json_to_markdown方法进行转换
        """
        # 如果未提供TiptapClient实例，创建一个新的
        if tiptap_client is None:
            from apps.projects.tiptap.client import TiptapClient
            tiptap_client = TiptapClient()
        
        # 定位标题节点
        heading_node = TiptapUtils.locate_paragraph_by_path(doc, heading_path)
        if not heading_node or heading_node.get("type") != "heading":
            logger.warning(f"在路径 {heading_path} 处未找到标题节点")
            return ""
        
        # 获取标题级别
        heading_level = heading_node.get("attrs", {}).get("level", 1)
        
        # 获取标题所在的父节点
        parent_node = doc
        for i in range(len(heading_path) - 1):
            parent_node = parent_node["content"][heading_path[i]]
        
        # 标题在父节点中的索引
        heading_index = heading_path[-1]
        
        # 查找下一个同级或更高级标题的索引
        next_heading_index = None
        for i in range(heading_index + 1, len(parent_node.get("content", []))):
            node = parent_node["content"][i]
            if (node.get("type") == "heading" and 
                node.get("attrs", {}).get("level", 6) <= heading_level):
                next_heading_index = i
                break
        
        # 提取标题下的内容
        content_nodes = []
        # 添加标题本身
        content_nodes.append(heading_node)
        
        # 添加标题后到下一个同级或更高级标题之前的所有内容
        if next_heading_index is not None:
            content_nodes.extend(parent_node["content"][heading_index + 1:next_heading_index])
        else:
            content_nodes.extend(parent_node["content"][heading_index + 1:])
        
        # 创建包含提取内容的临时文档
        temp_doc = {
            "type": "doc",
            "content": content_nodes
        }
        
        # 使用TiptapClient将内容转换为Markdown
        try:
            markdown_result = tiptap_client.json_to_markdown(temp_doc)
            return markdown_result.get("data", "")
        except Exception as e:
            logger.error(f"将内容转换为Markdown失败: {e}")
            return ""
