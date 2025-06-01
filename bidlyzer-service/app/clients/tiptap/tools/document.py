from typing import Dict, List, Any, Optional, Tuple
import json
from copy import deepcopy
from app.clients.tiptap.tools import get_paragraph_text_with_position, get_table_md_with_position, extract_text_from_node

import logging

logger = logging.getLogger(__name__)


def get_all_nodes_with_position(tiptap_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    # 输入：tiptap json 文档
    # 输出：包含所有节点和位置信息的列表，格式为:
    # [{"node": node, "index": 0}, {"node": node, "index": 2}, ...]
    # 注意：这里包括嵌套在表格等其他节点中的段落
    """
    if not isinstance(tiptap_doc, dict):
        raise ValueError("输入必须是字典格式")
    
    if tiptap_doc.get('type') != 'doc':
        raise ValueError("输入必须是有效的 Tiptap 文档（根节点类型应为 'doc'）")
    
    content = tiptap_doc.get('content', [])
    if not isinstance(content, list):
        return []
    
    nodes_info = []
    
    # 遍历第一层节点，只收集段落节点及其位置
    for index, node in enumerate(content):
        if isinstance(node, dict):
            nodes_info.append({
                "node": node,
                "position": index,
                "type": node.get('type')
            })
    
    return nodes_info

# 提取所有的段落和表格，内容用text或md表示， 节点按position排序, 输出的是列表
async def get_document_md_with_position(tiptap_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    输入：tiptap_doc: List[Dict[str, Any]]
    输出：List[Dict[str, Any]]
    """
    paragraphs_md = get_paragraph_text_with_position(tiptap_doc)
    tables_md = await get_table_md_with_position(tiptap_doc)

    document_md = paragraphs_md + tables_md
    document_md.sort(key=lambda x: x["position"])

    return document_md

# 在get_document_md_with_position的基础上， 输出字符串， 一个节点段，长度超过max_length时，截断， 并添加...
# 用于最初文本分析来提取 h1的标题
async def formatted_document_md_with_position(tiptap_doc: Dict[str, Any], max_length: Optional[int] = None) -> str:
    """
    输入：tiptap_doc: Dict[str, Any]
    输出：str
    """
    document_md = await get_document_md_with_position(tiptap_doc)

    formatted_elements = []
    for ele in document_md:
        if ele["content"] != "":
            if max_length:
                if len(ele["content"]) > max_length:
                    formatted_element = (f"content: {ele['content'][:max_length]}... | position: {ele['position']}")
                else:
                    formatted_element = (f"content: {ele['content']} | position: {ele['position']}")
            else:
                formatted_element = (f"content: {ele['content']} | position: {ele['position']}")
            formatted_elements.append(formatted_element)

    return "\n".join(formatted_elements)


def update_nodes_to_headings(tiptap_doc: Dict[str, Any], heading_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    将Tiptap JSON文档中指定位置的节点修改为标题节点
    
    Args:
        tiptap_doc: Tiptap JSON格式的文档
        heading_list: 标题信息列表，格式为 [{'level': 1, 'position': 75, 'title': '标题文本'}, ...]
        
    Returns:
        修改后的Tiptap文档（深拷贝，不影响原文档）
        
    Raises:
        ValueError: 当输入不是有效的Tiptap文档时
        IndexError: 当position超出文档内容范围时
    """
    if not isinstance(tiptap_doc, dict) or tiptap_doc.get('type') != 'doc':
        raise ValueError("输入必须是有效的Tiptap文档（根节点类型应为 'doc'）")
    
    if not isinstance(heading_list, list):
        raise ValueError("heading_list必须是列表格式")
    
    # 深拷贝文档，避免修改原文档
    modified_doc = deepcopy(tiptap_doc)
    content = modified_doc.get('content', [])
    
    if not isinstance(content, list):
        raise ValueError("文档content必须是数组格式")
    
    # 按position排序，确保处理顺序
    sorted_headings = sorted(heading_list, key=lambda x: x.get('position', 0))
    
    for heading_info in sorted_headings:
        position = heading_info.get('position')
        level = heading_info.get('level')
        title = heading_info.get('title')
        
        # 验证必要字段
        if position is None or level is None or title is None:
            print(f"警告: 跳过无效的标题信息 {heading_info}")
            continue
        
        # 验证position范围
        if position < 0 or position >= len(content):
            print(f"警告: position {position} 超出文档范围 (0-{len(content)-1})")
            continue
        
        # 验证level范围（通常是1-6）
        if not isinstance(level, int) or level < 1 or level > 6:
            print(f"警告: 无效的标题级别 {level}，使用默认级别1")
            level = 1
        
        # 直接修改原节点的 attrs.level，不改变其他属性
        original_node = content[position]
        
        original_node['type'] = 'heading'
        # 确保attrs存在
        if 'attrs' not in original_node:
            original_node['attrs'] = {}
        
        # 直接设置level，不管原节点是什么类型
        original_node['attrs']['level'] = level
        
        print(f"已将位置 {position} 的节点设置level为: {level}")
    
    return modified_doc


def get_headings(tiptap_doc: Dict[str, Any], indent: bool = True) -> Tuple[List[Dict[str, Any]], str]:
    """
    从 Tiptap JSON 文档中提取第一层的标题节点
    
    Args:
        tiptap_doc: Tiptap JSON 格式的文档
        
    Returns:
        包含标题节点和位置信息的列表，格式为:
        [
            {
                "node": heading_node,
                "position": 0,
                "level": 1,
                "title": "标题文本"
            },
            ...
        ]
        print_headings: 打印的标题信息，格式为:
        "level: 1, title: 标题文本"
        "level: 1, title: 标题文本"
        ...
    Raises:
        ValueError: 当输入不是有效的 Tiptap 文档时
    """
    if not isinstance(tiptap_doc, dict):
        raise ValueError("输入必须是字典格式")
    
    if tiptap_doc.get('type') != 'doc':
        raise ValueError("输入必须是有效的 Tiptap 文档（根节点类型应为 'doc'）")
    
    content = tiptap_doc.get('content', [])
    if not isinstance(content, list):
        return []
    
    heading_nodes = []
    formatted_headings = []
    
    # 直接遍历第一层内容，找到标题节点
    for position, node in enumerate(content):
        if isinstance(node, dict) and node.get('type') == 'heading':
            # 提取标题级别
            level = node.get('attrs', {}).get('level', 1)
            
            # 提取标题文本
            title = extract_text_from_node(node)
            
            heading_nodes.append({
                "node": node,
                "position": position,
                "level": level,
                "title": title
            })
            prefix = "  " * (level - 1) if indent else ""
            formatted_headings.append(f"{prefix}[H{level}] {title}")
    
    print_headings = "\n".join(formatted_headings)
    return heading_nodes, print_headings





def extract_chapters_by_nodes(tiptap_doc: Dict[str, Any]) -> List[List[Dict[str, Any]]]:
    """
    按一级标题将文档节点分块成章节
    
    Args:
        doc: Tiptap JSON 格式的文档
        
    Returns:
        章节列表，每个章节是一个节点列表（包含标题节点）
        [
            [heading_node, content_node1, content_node2, ...],  # 第一章
            [heading_node, content_node1, content_node2, ...],  # 第二章
            ...
        ]
    """
    if not isinstance(tiptap_doc, dict) or tiptap_doc.get("type") != "doc":
        raise ValueError("输入必须是有效的 Tiptap 文档")
    
    content = tiptap_doc.get("content", [])
    if not content:
        return []
    
    chapters = []
    current_chapter = []
    found_first_chapter = False
    
    for node in content:
        if not isinstance(node, dict):
            continue
        
        # 如果是一级标题
        if (node.get("type") == "heading" and 
            node.get("attrs", {}).get("level") == 1):
            
            # 如果当前章节不为空，保存它并开始新章节
            if current_chapter:
                chapter_doc = {
                    "type": "doc",
                    "content": current_chapter
                }
                chapters.append(chapter_doc)
            
            # 开始新章节（包括第一个标题）
            current_chapter = [node]
            found_first_chapter = True
        else:
            # 只有找到第一个标题后，才开始收集内容
            if found_first_chapter:
                current_chapter.append(node)
    
    # 添加最后一个章节
    if current_chapter:
        chapter_doc = {
            "type": "doc",
            "content": current_chapter
        }
        chapters.append(chapter_doc)
    
    return chapters



def formatted_chapters_md_with_position(tiptap_doc: Dict[str, Any]) -> List[str]:
    """
    按一级标题将文档节点分块成章节， 输出的是列表， 每个章节是一个字符串， 格式为:
    "章节标题: 章节标题 | position: 章节位置"
    "content: 章节内容 | position: 章节位置"
    "content: 章节内容 | position: 章节位置"
    ...
    """
    if not isinstance(tiptap_doc, dict) or tiptap_doc.get("type") != "doc":
        raise ValueError("输入必须是有效的 Tiptap 文档")
    
    content = tiptap_doc.get("content", [])
    if not content:
        return []
    
    chapters = []
    current_chapter = []
    found_first_chapter = False
    
    for index, node in enumerate(content):
        if not isinstance(node, dict):
            continue
        
        # 如果是一级标题
        if (node.get("type") == "heading" and 
            node.get("attrs", {}).get("level") == 1):
            
            # 如果当前章节不为空，保存它并开始新章节
            if current_chapter:
                chapter_doc = {
                    "type": "doc",
                    "content": "\n".join(current_chapter)
                }
                chapters.append(chapter_doc)
            
            # 开始新章节（包括第一个标题）
            formatted_node = (f"章节标题: {extract_text_from_node(node)} | position: {index}")
            current_chapter = [formatted_node]
            found_first_chapter = True
        else:
            # 只有找到第一个标题后，才开始收集内容
            if found_first_chapter:
                formatted_node = (f"content: {extract_text_from_node(node)} | position: {index}")
                current_chapter.append(formatted_node)
    
    # 添加最后一个章节
    if current_chapter:
        chapter_doc = {
            "type": "doc",
            "content": "\n".join(current_chapter)
        }
        chapters.append(chapter_doc)
    
    return chapters



# 添加 "前言" 标题
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
    
    # 查找所有标题及其位置
    headings, _ = get_headings(updated_doc)
    
    # 按文档顺序排序（根据位置）
    headings.sort(key=lambda h: h["position"])
    
    # 需要添加前言标题的位置列表
    intro_positions = []
    
    # 检查每个标题
    for i in range(len(headings) - 1):
        current = headings[i]
        next_heading = headings[i + 1]
        
        # 检查当前标题是否有子标题（下一个标题级别更高）
        if next_heading["level"] > current["level"]:
            # 检查两个标题之间是否有内容
            current_pos = current["position"]
            next_pos = next_heading["position"]
            
            # 检查两个标题是否紧邻（中间没有其他内容）
            has_content_between = False
            
            # 获取文档内容数组
            content = updated_doc.get("content", [])
            
            # 检查两个标题之间是否有其他节点
            if next_pos - current_pos > 1:
                # 检查中间节点是否为段落且包含文本
                for idx in range(current_pos + 1, next_pos):
                    if idx < len(content):
                        middle_node = content[idx]
                        if middle_node.get("type") == "paragraph":
                            text = extract_text_from_node(middle_node)
                            if text.strip():
                                has_content_between = True
                                break
            
            # 如果没有内容，添加前言标题
            if not has_content_between:
                # 记录需要插入前言标题的位置
                intro_positions.append({
                    "position": current_pos + 1,  # 在当前标题后插入
                    "level": next_heading["level"],  # 与子标题同级
                    "title": "前言"
                })
    
    # 从后向前添加前言标题（避免位置变化）
    intro_positions.sort(key=lambda p: p["position"], reverse=True)
    
    for position_info in intro_positions:
        # 创建前言标题节点
        intro_heading = {
            "type": "heading",
            "attrs": {
                "level": position_info["level"]
            },
            "content": [
                {
                    "type": "text",
                    "text": position_info["title"]
                }
            ]
        }
        
        # 插入前言标题到文档内容中
        insert_idx = position_info["position"]
        content = updated_doc.get("content", [])
        content.insert(insert_idx, intro_heading)
    
    return updated_doc
