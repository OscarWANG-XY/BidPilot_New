from typing import Dict, List, Any
from app.clients.tiptap.tools import get_paragraph_text_with_position, get_table_md_with_position

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

async def get_paras_and_tables_md_with_position(tiptap_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    输入：tiptap_doc: List[Dict[str, Any]]
    输出：List[Dict[str, Any]]
    """
    paragraphs_md = get_paragraph_text_with_position(tiptap_doc)
    tables_md = await get_table_md_with_position(tiptap_doc)

    document_md = paragraphs_md + tables_md
    document_md.sort(key=lambda x: x["position"])

    return document_md
