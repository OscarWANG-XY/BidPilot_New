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





def print_defined_tables_columns(tiptap_doc: Dict[str, Any], key_col_index=0, value_col_index=2) -> str:
    """
    输入：tiptap_doc: Dict[str, Any]
    逻辑： 
    - 遍历所有文档中的表格，提取key列 和 value列，并返回一个字符串，格式为："key1: value1\nkey2: value2\n..."

    输出：str
    """

    if not isinstance(tiptap_doc, dict):
        raise ValueError("输入必须是字典格式")
    
    topic_list = []

    for node in tiptap_doc["content"]:
        if node["type"] != "table":
            continue

        rows = node.get("content", [])
        if not rows or len(rows) <= 1:
            continue  # 没有数据行

        for row in rows[1:]:  # 跳过表头
            cells = row.get("content", [])
            if len(cells) <= max(key_col_index, value_col_index):
                continue  # 列数不足，跳过

            # 提取 key（类型）文本
            key_cell = cells[key_col_index]
            key_text = ""
            try:
                key_text = key_cell["content"][0]["content"][0]["text"]
            except (IndexError, KeyError, TypeError):
                continue  # 如果无法提取文本，跳过这一行
            
            # 提取 value 文本
            value_cell = cells[value_col_index]
            value_text = ""
            try:
                value_text = value_cell["content"][0]["content"][0]["text"]
            except (IndexError, KeyError, TypeError):
                value_text = ""  # 如果无法提取文本，使用空字符串

            topic_list.append(f"{key_text}: {value_text}")

    return "\n".join(topic_list)



def update_all_tables_column_from_dict(tiptap_doc, dict_value, key_col_index=0, value_col_index=3):
    """
    遍历文档中所有表格，统一根据指定列索引进行更新。
    :param tiptap_json: 整个 Tiptap 文档 JSON
    :param type_dict: 字典，键为类型，值为说明
    :param key_col_index: 类型所在列（默认第 1 列）
    :param value_col_index: 说明写入的目标列（默认第 4 列）
    """
    if not isinstance(tiptap_doc, dict):
        raise ValueError("输入必须是字典格式")

    for node in tiptap_doc["content"]:
        if node["type"] != "table":
            continue

        rows = node.get("content", [])
        if not rows or len(rows) <= 1:
            continue  # 没有数据行

        for row in rows[1:]:  # 跳过表头
            cells = row.get("content", [])
            if len(cells) <= max(key_col_index, value_col_index):
                continue  # 列数不足，跳过

            # 提取 key（类型）文本
            key_cell = cells[key_col_index]
            key_text = ""
            try:
                key_text = key_cell["content"][0]["content"][0]["text"]
            except (IndexError, KeyError, TypeError):
                pass

            if key_text in dict_value:
                value_text = dict_value[key_text]
                cells[value_col_index]["content"] = [{
                    "type": "paragraph",
                    "content": [{"type": "text", "text": value_text}]
                }]

    return tiptap_doc



