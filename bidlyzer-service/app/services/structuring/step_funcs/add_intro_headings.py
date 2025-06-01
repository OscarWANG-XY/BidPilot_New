"""
招标文件大纲分析模块

本模块提供基于LLM分析的招标文档大纲分析与结构化功能，主要包含：添加引言章节
"""

import logging
from typing import Dict, List, Tuple, Any, Optional

from app.clients.tiptap.tools import add_introduction_headings, get_headings

logger = logging.getLogger(__name__)

class AddIntroHeadings:
    """
    招标文档大纲分析器，使用LLM分析实现文档结构化
    
    该分析器处理添加引言章节
    """
    
    def __init__(self):
        pass

    
    async def add(self, document_h2: Dict) -> Dict:
        """
        为文档添加引言标题
        
        参数：
            document_h2: 已应用一、二、三级标题的文档
            
        返回：
            添加了引言标题的文档
        """
        logger.info("正在添加引言标题")
        document_final = add_introduction_headings(document_h2)
        
        # 调试信息
        headings, print_headings = get_headings(document_final)
        logger.debug(f"添加引言后的文档标题：\n{print_headings}")
        
        return document_final