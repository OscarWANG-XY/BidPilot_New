"""
招标文件大纲分析模块

本模块提供基于LLM分析的招标文档大纲分析与结构化功能，主要包含：一级标题(H1)分析
"""

import logging
from typing import Dict, List, Tuple, Any, Optional

from apps.clients.tiptap.helpers import TiptapUtils
from apps.projects.services.prompts.structuring.tender_outlines_L1 import TenderOutlinesL1PromptBuilder
from apps.projects.services.llm.llm_client import LLMClient
from apps.projects.services.llm.llm_output_processor import LLMOutputProcessor

logger = logging.getLogger(__name__)

class OutlineL1Analyzer:
    """
    招标文档大纲分析器，使用LLM分析实现文档结构化
    该分析器处理一级标题分析
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
    
    async def analyze(self, tender_document: Dict, channel_layer=None, group_name=None) -> Dict:
        """
        分析文档中的一级标题(H1)
        
        参数：
            tender_document: Tiptap格式的招标文档
            channel_layer: 可选的Channels层，用于WebSocket流式输出
            group_name: 可选的组名称，用于WebSocket流式输出
            
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

        if channel_layer and group_name:
            # 创建并行任务，每个任务有唯一ID
            tasks = []
            for i, task_input in enumerate(task_inputs):
                # 为每个任务添加ID
                task_id = f"task_{i}"
                tasks.append((task_id, task_input))
                
            # 并行处理并支持流式输出
            raw_results = await analyzer.process_parallel_stream(
                tasks,
                channel_layer=channel_layer,
                group_name=group_name,
                limit=self.llm_limit
            )
        else:
            # 原有的并行处理（不带流式输出）
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
    

    

