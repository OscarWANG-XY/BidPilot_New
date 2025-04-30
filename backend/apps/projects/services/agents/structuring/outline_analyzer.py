"""
招标文件大纲分析模块

本模块提供基于LLM分析的招标文档大纲分析与结构化功能，主要包含：
1. 一级标题(H1)分析
2. 二级/三级标题分析
3. 引言标题添加
"""

import logging
from typing import Dict, List, Tuple, Any, Optional

from apps.projects.tiptap.helpers import TiptapUtils
from apps.projects.services.prompts.structuring.tender_outlines_L1 import TenderOutlinesL1PromptBuilder
from apps.projects.services.prompts.structuring import TenderOutlinesL2PromptBuilder
from apps.projects.services.llm.llm_client import LLMClient
from apps.projects.services.llm.llm_output_processor import LLMOutputProcessor

logger = logging.getLogger(__name__)

class OutlineAnalyzer:
    """
    招标文档大纲分析器，使用LLM分析实现文档结构化
    
    该分析器处理完整流程：
    1. 一级标题分析
    2. 二级/三级标题分析
    3. 添加引言章节
    """
    
    def __init__(self, llm_limit: int = 5):
        """
        初始化大纲分析器
        
        参数：
            llm_limit: 每个层级处理的最大LLM请求数
        """
        self.llm_limit = llm_limit
        self.output_processor = LLMOutputProcessor()

        logger.info("OutlineAnalyzer: 初始化完成")
    
    async def analyze(self, tender_document: Dict) -> Dict:
        """
        完整的招标文档结构分析流程
        
        参数：
            tender_document: Tiptap格式的招标文档
            
        返回：
            带有完整大纲结构的招标文档
        """
        logger.info("开始招标文档结构分析")
        
        # 步骤1：分析一级标题(H1)

        logger.info("OutlineAnalyzer: 开始分析一级标题(H1)")
        document_h1 = await self.analyze_l1_headings(tender_document)
        
        # 步骤2：分析二级/三级标题
        logger.info("OutlineAnalyzer: 开始分析二级/三级标题")
        document_h2 = await self.analyze_l2_l3_headings(document_h1)
        
        # 步骤3：添加引言标题
        logger.info("OutlineAnalyzer: 开始添加引言标题")
        document_final = self.add_introduction_headings(document_h2)
        
        # 打印增强后的目录结构用于验证
        enhanced_toc = TiptapUtils.print_enhanced_toc(document_final)
        logger.info(f"完整分析后的增强目录：\n{enhanced_toc}")
        
        return document_final
    
    async def analyze_l1_headings(self, tender_document: Dict) -> Dict:
        """
        分析文档中的一级标题(H1)
        
        参数：
            tender_document: Tiptap格式的招标文档
            
        返回：
            更新了一级标题的文档
        """
        logger.info("正在分析一级标题(H1)")
        
        # 初始化提示构建器并获取LLM参数
        prompt_builder = TenderOutlinesL1PromptBuilder(tender_document)
        prompt_config, task_inputs, meta = prompt_builder.output_params()
        
        # 调试信息
        logger.debug("已生成L1提示参数")
        headings = TiptapUtils.print_headings(tender_document)
        logger.debug(f"L1分析前的文档标题：\n{headings}")
        
        # 使用LLM处理
        analyzer = LLMClient(prompt_config)
        raw_results = await analyzer.process_with_limit(task_inputs, limit=self.llm_limit)
        
        # 处理结果
        clean_parsed_results = self.output_processor.merge_outputs(raw_results)
        
        # 使用新标题更新文档
        document_h1 = TiptapUtils.update_titles_from_list(
            doc=tender_document,
            title_list=clean_parsed_results,
            index_path_map=meta["index_path_map"]
        )
        
        # 调试信息
        headings = TiptapUtils.print_headings(document_h1)
        logger.debug(f"L1分析后的文档标题：\n{headings}")
        
        return document_h1
    
    async def analyze_l2_l3_headings(self, document_h1: Dict) -> Dict:
        """
        分析文档中的二级和三级标题
        
        参数：
            document_h1: 已应用一级标题的文档
            
        返回：
            更新了二级和三级标题的文档
        """
        logger.info("正在分析二级和三级标题")
        
        # 初始化提示构建器并获取LLM参数
        prompt_builder = TenderOutlinesL2PromptBuilder(document_h1)
        prompt_config, task_inputs, meta = prompt_builder.output_params()
        
        # 调试信息
        logger.debug("已生成L2/L3提示参数")
        
        # 使用LLM处理
        analyzer = LLMClient(prompt_config)
        raw_results = await analyzer.process_with_limit(task_inputs, limit=self.llm_limit)
        
        # 处理结果
        clean_parsed_results = self.output_processor.merge_outputs(raw_results)
        
        # 调整级别值(每个加1)
        for item in clean_parsed_results:
            if 'level' in item:
                item['level'] += 1
        
        # 使用新标题更新文档
        document_h2 = TiptapUtils.update_titles_from_list(
            doc=document_h1,
            title_list=clean_parsed_results,
            index_path_map=meta["index_path_map"]
        )
        
        # 调试信息
        headings = TiptapUtils.print_headings(document_h2)
        logger.debug(f"L2/L3分析后的文档标题：\n{headings}")
        
        return document_h2
    
    def add_introduction_headings(self, document_h2: Dict) -> Dict:
        """
        为文档添加引言标题
        
        参数：
            document_h2: 已应用一、二、三级标题的文档
            
        返回：
            添加了引言标题的文档
        """
        logger.info("正在添加引言标题")
        document_final = TiptapUtils.add_introduction_headings(document_h2)
        
        # 调试信息
        headings = TiptapUtils.print_headings(document_final)
        logger.debug(f"添加引言后的文档标题：\n{headings}")
        
        return document_final
    
    def get_document_outline(self, document: Dict) -> str:
        """
        获取可读格式的文档大纲
        
        参数：
            document: 要提取大纲的文档
            
        返回：
            文档大纲的字符串表示
        """
        return TiptapUtils.print_enhanced_toc(document)