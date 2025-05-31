import json
from typing import Dict, List, Any, Optional, Union, Callable
import logging
from app.clients.tiptap.tools import turn_block_nodes_to_tiptap_doc


logger = logging.getLogger(__name__)

def get_table_nodes_with_position(tiptap_doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    # 输入：tiptap json 文档
    # 输出：包含表格节点和位置信息的列表，格式为:
    # [{"node": table_node, "index": 0}, {"node": table_node, "index": 2}, ...]
    # 注意：这里不包括嵌套在表格等其他节点中的表格
    """
    if not isinstance(tiptap_doc, dict):
        raise ValueError("输入必须是字典格式")
    
    if tiptap_doc.get('type') != 'doc':
        raise ValueError("输入必须是有效的 Tiptap 文档（根节点类型应为 'table'）")
    
    content = tiptap_doc.get('content', [])
    if not isinstance(content, list):
        return []
    
    tables_info = []
    # 遍历第一层节点，只收集段落节点及其位置
    for index, node in enumerate(content):
        if isinstance(node, dict) and node.get('type') == 'table':
            tables_info.append({
                "node": node,
                "position": index,
                "type": "table"
            })
    
    return tables_info


async def turn_tables_to_md_with_position(tables_info: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    输入：tables_info: List[Dict[str, Any]]
    输出：List[Dict[str, Any]]
    """


    tables_info_md = []
    for table_info in tables_info:
        position = table_info['position']
        table_node = table_info['node']

        #将table_node 转为 tiptap json 文档
        table_doc = turn_block_nodes_to_tiptap_doc([table_node])

        # 将table_doc 转为 markdown
        from app.clients.tiptap.client import TiptapClient
        tiptap_client = TiptapClient()
        table_md = await tiptap_client.json_to_markdown(table_doc)
        
        tables_info_md.append({
            'content': table_md,
            'position': position,
            'type': 'table'
        })

    return tables_info_md



async def get_table_md_with_position(tiptap_doc: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    输入：tables_info: List[Dict[str, Any]]
    输出：List[Dict[str, Any]]
    """
    # 输入必须是 tiptap json 文档, 这个在get_paragraph_text_with_position 中做了验证
    tables_info = get_table_nodes_with_position(tiptap_doc)
    tables_info_md = await turn_tables_to_md_with_position(tables_info)
    
    return tables_info_md