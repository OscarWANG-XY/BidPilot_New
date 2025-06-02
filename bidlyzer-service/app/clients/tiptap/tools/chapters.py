from typing import Dict, List, Any, Optional, Tuple
import json
from copy import deepcopy
from app.clients.tiptap.tools import extract_text_from_node, get_headings

import logging

logger = logging.getLogger(__name__)

# 为h2h3大纲分析提供素材
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
                if node.get("type") == "table":
                    formatted_node = (f"[table]: 表格内容此处省略... | position: {index}")
                else:
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
        - 会过滤掉前言章节里全部是空节点的情况
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
                # 检查中间节点是否为段落且包含非空文本
                middle_node_contents = []
                for idx in range(current_pos + 1, next_pos):
                    middle_node_contents.append(extract_text_from_node(content[idx]))
                
                text = "".join(middle_node_contents)
                if text.strip():
                    has_content_between = True
            
            # 只有当前标题和子标题之间有内容时，才添加前言标题
            if has_content_between:
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


def extract_introductions_by_nodes(tiptap_doc: Dict[str, Any]) -> List[List[Dict[str, Any]]]:
    """
    提取所有前言章节的内容
    
    Args:
        tiptap_doc: Tiptap JSON 格式的文档
        
    Returns:
        前言章节列表，每个前言章节是一个节点列表（包含前言标题节点）
        [
            [introduction_heading_node, content_node1, content_node2, ...],  # 第一个前言章节
            [introduction_heading_node, content_node1, content_node2, ...],  # 第二个前言章节
            ...
        ]
    """
    if not isinstance(tiptap_doc, dict) or tiptap_doc.get("type") != "doc":
        raise ValueError("输入必须是有效的 Tiptap 文档")
    
    content = tiptap_doc.get("content", [])
    if not content:
        return []
    
    introduction_chapters = []
    current_introduction = []
    in_introduction = False
    current_intro_level = None  # 记录当前前言标题的级别
    
    for i, node in enumerate(content):
        if not isinstance(node, dict):
            continue
        
        # 检查是否是标题节点
        if node.get("type") == "heading":
            heading_text = extract_text_from_node(node).strip()
            heading_level = node.get("attrs", {}).get("level", 1)
            
            # 如果是前言标题
            if heading_text == "前言":
                # 如果之前有未完成的前言章节，先保存它
                if current_introduction:
                    introduction_chapters.append(current_introduction)
                
                # 开始新的前言章节
                current_introduction = [node]
                in_introduction = True
                current_intro_level = heading_level
            else:
                # 如果是其他标题，检查是否应该结束当前前言章节
                if in_introduction and current_introduction:
                    # 只有遇到同级或更高级的标题才结束前言章节
                    if heading_level <= current_intro_level:
                        introduction_chapters.append(current_introduction)
                        current_introduction = []
                        in_introduction = False
                        current_intro_level = None
                    else:
                        # 如果是子标题，继续包含在前言章节中
                        current_introduction.append(node)
                else:
                    # 如果不在前言章节中，不做任何处理
                    pass
        else:
            # 如果在前言章节中，添加内容节点
            if in_introduction:
                current_introduction.append(node)
    
    # 添加最后一个前言章节（如果存在）
    if current_introduction:
        introduction_chapters.append(current_introduction)
    
    return introduction_chapters

