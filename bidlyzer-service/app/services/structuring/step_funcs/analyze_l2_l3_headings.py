"""
招标文件大纲分析模块

本模块提供基于LLM分析的招标文档大纲分析与结构化功能，主要包含：二级和三级标题分析
"""

import logging
from typing import Dict
from app.clients.tiptap.tools import get_headings, update_nodes_to_headings
from app.services.structuring.prompts.tender_outlines_L2 import TenderOutlinesL2PromptBuilder
from app.services.llm.llm_client import LLMClient
from app.services.llm.llm_output_processor import LLMOutputProcessor

logger = logging.getLogger(__name__)

class OutlineL2L3Analyzer:
    """
    招标文档大纲分析器，使用LLM分析实现文档结构化
    
    该分析器处理二级和三级标题分析
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

    
    async def analyze(self, document_h1: Dict, channel_layer=None, group_name=None ) -> Dict:
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
            # 创建并行任务，每个任务有唯一ID（即使没有流式输出）
            tasks = []
            for i, task_input in enumerate(task_inputs):
                task_id = f"task_{i}"
                tasks.append((task_id, task_input))
                
            # 并行处理（不带流式输出）
            raw_results = await analyzer.process_parallel_stream(tasks, limit=self.llm_limit)

        # 处理结果
        clean_parsed_results = self.output_processor.merge_outputs(raw_results)

        # 调整级别值(每个加1)
        for item in clean_parsed_results:
            if 'level' in item:
                item['level'] += 1
        
        # 使用新标题更新文档
        document_h2h3 = update_nodes_to_headings(
            tiptap_doc=document_h1,
            heading_list=clean_parsed_results,
        )
        
        # 调试信息
        _, print_headings = get_headings(document_h2h3)
        logger.debug(f"L2/L3分析后的文档标题：\n{print_headings}")
        
        return document_h2h3
    

    
