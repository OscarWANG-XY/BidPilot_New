import json
from typing import Dict, List, Any, Optional, Union, Callable
import logging
from app.clients.tiptap.tools import extract_text_from_node
logger = logging.getLogger(__name__)

def get_paragraph_nodes_with_position(tiptap_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    # 输入：tiptap json 文档
    # 输出：包含段落节点和位置信息的列表，格式为:
    # [{"node": paragraph_node, "index": 0}, {"node": paragraph_node, "index": 2}, ...]
    # 注意：这里不包括嵌套在表格等其他节点中的段落
    """
    if not isinstance(tiptap_doc, dict):
        raise ValueError("输入必须是字典格式")
    
    if tiptap_doc.get('type') != 'doc':
        raise ValueError("输入必须是有效的 Tiptap 文档（根节点类型应为 'doc'）")
    
    content = tiptap_doc.get('content', [])
    if not isinstance(content, list):
        return []
    
    paragraphs_info = []
    
    # 遍历第一层节点，只收集段落节点及其位置
    for index, node in enumerate(content):
        if isinstance(node, dict) and node.get('type') in ['paragraph', 'heading']:
            paragraphs_info.append({
                "node": node,
                "position": index,
                "type": node.get('type')
            })
    
    return paragraphs_info




def get_paragraph_text_with_position(tiptap_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    # 输入：tiptap json 文档
    # 输出：包含段落节点和位置信息的列表，格式为:
    # [{"text": paragraph_text, "index": 0}, {"text": paragraph_text, "index": 2}, ...]
    # 注意：这里不包括嵌套在表格等其他节点中的段落
    """
    if not isinstance(tiptap_doc, dict):
        raise ValueError("输入必须是字典格式")
    
    if tiptap_doc.get('type') != 'doc':
        raise ValueError("输入必须是有效的 Tiptap 文档（根节点类型应为 'doc'）")
    
    content = tiptap_doc.get('content', [])
    if not isinstance(content, list):
        return []
    
    paragraphs_info = []
    
    # 遍历第一层节点，只收集段落节点及其位置
    for index, node in enumerate(content):
        if isinstance(node, dict) and node.get('type') in ['paragraph', 'heading']:
            paragraphs_info.append({
                "content": extract_text_from_node(node),
                "position": index,
                "type": node.get('type')
            })
    
    return paragraphs_info