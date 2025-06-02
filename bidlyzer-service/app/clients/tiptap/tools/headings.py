from typing import Dict, List, Any, Optional, Tuple
import json
from copy import deepcopy
from app.clients.tiptap.tools import extract_text_from_node

import logging

logger = logging.getLogger(__name__)


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
            formatted_headings.append(f"{prefix}[H{level}] {title} | position: {position}")
    
    print_headings = "\n".join(formatted_headings)
    return heading_nodes, print_headings



