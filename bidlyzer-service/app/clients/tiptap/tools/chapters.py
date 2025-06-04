from typing import Dict, List, Any, Optional, Tuple
import json
from copy import deepcopy
from app.clients.tiptap.tools import extract_text_from_node, get_headings

import logging

logger = logging.getLogger(__name__)


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


# 添加 "前言" 标题, 同时输出 前言章节 以tiptap json格式 , 同时包含了 前言章节 position
@staticmethod
def add_introduction_headings(doc: Dict[str, Any]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    检查文档标题节点，为带有子标题但缺少前言部分的标题添加前言标题节点
    
    Args:
        doc: TipTap 文档对象
        
    Returns:
        Tuple[Dict[str, Any], List[Dict[str, Any]]]: (更新后的文档, 前言章节文档列表)
        
    Note:
        - 当一个标题后面紧跟着子标题（而非段落内容）时，会在它们之间添加一个"前言"标题
        - 添加的前言标题级别将比父标题高一级
        - 前言标题的文本默认为"前言"
        - 会过滤掉前言章节里全部是空节点的情况
        - 每个前言章节被包装成独立的 TipTap JSON 文档格式 {"type": "doc", "content": [...], "meta": {...}}
        - meta 字段记录前言章节内容在原文档中的起始位置
    """
    # 创建文档的深拷贝，避免修改原始文档
    updated_doc = json.loads(json.dumps(doc))
    
    # 查找所有标题及其位置
    headings, _ = get_headings(updated_doc)
    
    # 按文档顺序排序（根据位置）
    headings.sort(key=lambda h: h["position"])
    
    # 需要添加前言标题的位置列表
    intro_positions = []
    # 前言章节信息列表
    introduction_sections = []
    
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
                intro_info = {
                    "position": current_pos + 1,  # 在当前标题后插入
                    "level": next_heading["level"],  # 与子标题同级
                    "title": "前言"
                }
                
                # 收集前言章节的内容节点
                intro_nodes = []
                for idx in range(current_pos + 1, next_pos):
                    intro_nodes.append(content[idx])
                
                intro_positions.append(intro_info)
                
                # 将节点列表包装成独立的 TipTap 文档格式
                introduction_doc = {
                    "type": "doc",
                    "content": intro_nodes,
                    "meta": {
                        "position": current_pos + 1
                    }
                }
                introduction_sections.append(introduction_doc)
    
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
    
    return updated_doc, introduction_sections


# 提取叶子章节,未来添加 章节内容长度 和 章节内容token数 的逻辑，e.g. 如果超过2000token，则需要进一步提取标题。 
@staticmethod
def extract_leaf_chapters(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    提取文档中所有叶子章节（没有子标题的章节）
    
    Args:
        doc: TipTap 文档对象
        
    Returns:
        List[Dict[str, Any]]: 叶子章节文档列表，每个章节都是独立的 TipTap JSON 文档格式
        
    Note:
        - 叶子章节是指没有子标题的章节
        - 每个叶子章节包含该标题下的所有内容，直到下一个同级或更高级标题
        - 每个章节被包装成独立的 TipTap JSON 文档格式 {"type": "doc", "content": [...], "meta": {...}}
        - 章节内容包括标题本身和其下的所有内容节点
        - meta 字段记录叶子章节标题在原文档中的位置
    """
    # 查找所有标题及其位置
    headings, _ = get_headings(doc)
    
    # 按文档顺序排序（根据位置）
    headings.sort(key=lambda h: h["position"])
    
    if not headings:
        return []
    
    leaf_chapters = []
    content = doc.get("content", [])
    
    # 检查每个标题是否为叶子标题
    for i in range(len(headings)):
        current = headings[i]
        is_leaf = True
        
        # 查找下一个标题，判断是否有子标题
        for j in range(i + 1, len(headings)):
            next_heading = headings[j]
            
            # 如果下一个标题级别更高（数字更大），说明是子标题
            if next_heading["level"] > current["level"]:
                is_leaf = False
                break
            # 如果下一个标题级别相同或更低（数字相同或更小），说明不是子标题
            elif next_heading["level"] <= current["level"]:
                break
        
        # 如果是叶子标题，提取其章节内容
        if is_leaf:
            current_pos = current["position"]
            current_level = current["level"]
            
            # 找到章节结束位置
            end_pos = len(content)  # 默认到文档末尾
            
            # 查找下一个同级或更高级标题的位置
            for j in range(i + 1, len(headings)):
                next_heading = headings[j]
                # 如果遇到同级或更高级标题，章节在此结束
                if next_heading["level"] <= current_level:
                    end_pos = next_heading["position"]
                    break
            
            # 提取章节内容节点（包含标题本身）
            chapter_nodes = []
            for idx in range(current_pos, end_pos):
                if idx < len(content):
                    chapter_nodes.append(content[idx])
            
            # 包装成独立的 TipTap 文档格式
            if chapter_nodes:  # 只有当章节有内容时才添加
                leaf_chapter_doc = {
                    "type": "doc",
                    "content": chapter_nodes,
                    "meta": {
                        "position": current_pos,
                        "title": current["title"]
                    }
                }
                leaf_chapters.append(leaf_chapter_doc)
    
    return leaf_chapters




