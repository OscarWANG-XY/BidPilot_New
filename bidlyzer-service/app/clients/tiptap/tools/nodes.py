import json
from typing import Dict, List, Any, Optional, Union, Callable
import logging

logger = logging.getLogger(__name__)

def extract_text_from_node(node: Dict[str, Any]) -> str:
    """
    输入：接受tiptap json 文档中的节点，也接受整个文档输入。 
    输出：节点中的纯文本内容
    """
    if node.get("type") == "text":
        return node.get("text", "")
    
    text_parts = []
    for child in node.get("content", []):
        text_parts.append(extract_text_from_node(child))
    
    return "".join(text_parts)


# 在块级节点外添加doc层包裹， 返回完整的 Tiptap JSON 文档
# 为了给到
def turn_block_nodes_to_tiptap_doc(nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    将节点列表转换为完整的 Tiptap JSON 文档格式
    输入：从 Tiptap JSON 文档中截取的块级节点列表
    输出：完整的 Tiptap JSON 文档
    ValueError: 1）当输入为空列表时；2）当节点类型不是块级节点时
    """
    if not nodes:
        raise ValueError("节点列表不能为空")
    
    # 定义块级节点类型
    block_node_types = {
        'paragraph', 'heading', 'blockquote', 'codeBlock', 'table', 
        'bulletList', 'orderedList', 'listItem', 'horizontalRule',
        'image', 'video', 'figure', 'div', 'section'
    }
    
    # 内联节点类型如下： 这里不处理内联节点 
    # inline_node_types = {
    #     'text', 'bold', 'italic', 'underline', 'strike', 'code',
    #     'link', 'mention', 'emoji', 'hardBreak'
    # }
    
    processed_nodes = []
    
    for node in nodes:
        if not isinstance(node, dict) or 'type' not in node:
            raise ValueError(f"无效的节点格式: {node}")
        
        node_type = node['type']
        
        if node_type in block_node_types:
            # 块级节点可以直接添加到 doc 的 content 中
            processed_nodes.append(node)
        else:
            raise ValueError(f"无效的节点类型: {node_type}")
        
    # 构建完整的 Tiptap 文档
    tiptap_doc = {
        "type": "doc",
        "content": processed_nodes
    }
    
    return tiptap_doc
        
