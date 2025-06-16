import logging
from typing import Optional, Dict, Any
from datetime import datetime
import asyncio
import json
import traceback
from app.services.cache import Cache
from app.services.storage import Storage
from app.services.structuring.state import StateRegistry
from .state_manager import create_state_manager, AgentStateData
from .state import (
    StateEnum, ProcessingStep,
    StateRegistry, ING_STATE_POOL, ED_STATE_POOL,
    ProcessingError
)

# 假设这些执行组件已经正确迁移
from .step_funcs.docx_extractor import DocxExtractor
from .step_funcs.analyze_l1_headings import OutlineL1Analyzer
from .step_funcs.analyze_l2_l3_headings import OutlineL2L3Analyzer
from .step_funcs.add_intro_headings import AddIntroHeadings

logger = logging.getLogger(__name__)


class Structuring:
    """
    文档结构化Agent - FastAPI版本
    负责将上传的投标文件提取+分析大纲+注入TiptapJSON
    
    主要变化：
    1. 使用新的双层状态系统 (SystemInternalState + UserVisibleState)
    2. 状态存储从Django缓存/数据库改为Redis
    3. 通信从WebSocket改为SSE
    4. 使用统一的状态管理器
    """

    def __init__(self, project_id: str):
        """
        初始化结构化代理
        
        Args:
            project_id: 项目ID
            lazy_init: 是否延迟初始化组件
        """
        self.project_id = project_id
        self.state_manager = create_state_manager(project_id)
        self._docx_extractor = DocxExtractor(project_id)
        self._outline_l1_analyzer = OutlineL1Analyzer()
        self._outline_l2_l3_analyzer = OutlineL2L3Analyzer()
        self._add_intro_headings = AddIntroHeadings()
        self.cache = Cache(project_id)
        self.storage = Storage(project_id)
    
   
    async def process(self, step: ProcessingStep) -> Dict[str, Any]:
        """
        执行处理步骤
        """
        trace_id = f"{self.project_id}_{step}_{datetime.now().isoformat()}"
        logger.info(f"[{trace_id}] 开始处理步骤: {step}")

        is_valid = await self._is_valid_step(step)
        if not is_valid:
            raise ProcessingError(f"无效的步骤: {step}")


        try:
            # 根据步骤类型执行相应处理
            if step == ProcessingStep.EXTRACT:
                await self._process_extract(trace_id)
                
            elif step == ProcessingStep.ANALYZE_H1:
                await self._process_analyze_h1(trace_id)
                
            elif step == ProcessingStep.ANALYZE_H2H3:
                await self._process_analyze_h2h3(trace_id)
                
            elif step == ProcessingStep.ADD_INTRODUCTION:
                await self._process_add_introduction(trace_id)
                
            elif step == ProcessingStep.REVIEW_STRUCTURE:
                await self._process_review_structure(trace_id)
                
            else:
                raise ProcessingError(f"未知的处理步骤: {step}")
                
        except Exception as e:
            error_msg = f"处理步骤失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}\n{traceback.format_exc()}")
            await self.state_manager._handle_error("step_processing_error", error_msg)
            raise ProcessingError(f"处理步骤失败: {str(e)}")

    # =============== 具体处理步骤实现 ===============
    async def _process_extract(self, trace_id: str) -> Dict[str, Any]:
        """处理文档提取步骤"""
        try:
            
            # tender_file 是TenderFile类型，包含url字段
            tender_file = await self.storage.get_tender_file_url()

            # 执行文档提取
            raw_document = await self._docx_extractor.extract_content(tender_file.url)
            
            if not raw_document:
                raise ProcessingError("文档提取失败，内容为空")
            
            # 更新状态为提取完成
            await self.state_manager.transition_to_state(
                StateEnum.DOCUMENT_EXTRACTED,
                progress=20,
                message="文档提取完成",
                document_data=raw_document
            )
            
            logger.info(f"[{trace_id}] 文档提取成功")

            # 自动触发下一步
            await asyncio.sleep(0.5)  # 短暂延迟
            await self.process(ProcessingStep.ANALYZE_H1)
            
        except Exception as e:
            logger.error(f"[{trace_id}] 文档提取失败: {str(e)}")
            raise ProcessingError(f"文档提取失败: {str(e)}")
    
    async def _process_analyze_h1(self, trace_id: str) -> Dict[str, Any]:
        """处理一级标题分析步骤"""
        try:
            # 获取原始文档
            document = await self.cache.get_document('raw_document')
            if not document:
                raise ProcessingError("没有可用的文档内容")
            
            # 更新状态
            await self.state_manager.transition_to_state(
                StateEnum.ANALYZING_OUTLINE_H1,
                progress=30,
                message="正在分析文档主要章节..."
            )
            
            # 执行H1分析
            h1_document = await self._outline_l1_analyzer.analyze(document, self.project_id)
            
            if not h1_document:
                raise ProcessingError("H1大纲分析失败，结果为空")
            
            # 更新状态
            await self.state_manager.transition_to_state(
                StateEnum.OUTLINE_H1_ANALYZED,
                progress=50,
                message="主要章节分析完成",
                document_data=h1_document
            )
            
            logger.info(f"[{trace_id}] H1分析成功")

            # 自动触发下一步
            await asyncio.sleep(0.5)  # 短暂延迟
            await self.process(ProcessingStep.ANALYZE_H2H3)
            
        except Exception as e:
            logger.error(f"[{trace_id}] H1分析失败: {str(e)}")
            raise ProcessingError(f"H1分析失败: {str(e)}")
    
    async def _process_analyze_h2h3(self, trace_id: str) -> Dict[str, Any]:
        """处理二级/三级标题分析步骤"""
        try:
            # 获取H1分析结果
            h1_document = await self.cache.get_document('h1_document')
            if not h1_document:
                raise ProcessingError("没有可用的H1分析结果")
            
            # 更新状态
            await self.state_manager.transition_to_state(
                StateEnum.ANALYZING_OUTLINE_H2H3,
                progress=60,
                message="正在分析文档子章节..."
            )
            
            # 执行H2H3分析
            h2h3_document = await self._outline_l2_l3_analyzer.analyze(h1_document, self.project_id)
            
            if not h2h3_document:
                raise ProcessingError("H2H3大纲分析失败，结果为空")
            
            # 更新状态
            await self.state_manager.transition_to_state(
                StateEnum.OUTLINE_H2H3_ANALYZED,
                progress=75,
                message="子章节分析完成",
                document_data=h2h3_document
            )
            
            logger.info(f"[{trace_id}] H2H3分析成功")

            # 自动触发下一步
            await asyncio.sleep(0.5)  # 短暂延迟
            await self.process(ProcessingStep.ADD_INTRODUCTION)
            
        except Exception as e:
            logger.error(f"[{trace_id}] H2H3分析失败: {str(e)}")
            raise ProcessingError(f"H2H3分析失败: {str(e)}")
    
    async def _process_add_introduction(self, trace_id: str) -> Dict[str, Any]:
        """处理引言添加步骤"""
        try:
            # 获取H2H3分析结果
            h2h3_document = await self.state_manager.cache.get_document('h2h3_document')
            if not h2h3_document:
                raise ProcessingError("没有可用的H2H3分析结果")
            
            # 更新状态
            await self.state_manager.transition_to_state(
                StateEnum.ADDING_INTRODUCTION,
                progress=85,
                message="正在添加引言部分..."
            )
            
            # 执行引言添加
            intro_document = await self._add_intro_headings.add(h2h3_document)
            
            if not intro_document:
                raise ProcessingError("引言添加失败，结果为空")
            
            # 更新状态为引言添加完成
            await self.state_manager.transition_to_state(
                StateEnum.INTRODUCTION_ADDED,
                progress=95,
                message="引言添加完成",
                document_data=intro_document
            )            
            
            logger.info(f"[{trace_id}] 引言添加成功")

            # 自动触发下一步
            await asyncio.sleep(0.5)  # 短暂延迟
            await self.process(ProcessingStep.REVIEW_STRUCTURE)

        except Exception as e:
            logger.error(f"[{trace_id}] 引言添加失败: {str(e)}")
            raise ProcessingError(f"引言添加失败: {str(e)}")
    
    async def _process_review_structure(self, trace_id: str) -> Dict[str, Any]:
        """处理完成编辑步骤"""
        try:
            # 用户核查定稿前，先复制引言文档作为最终文档
            intro_document = await self.state_manager.cache.get_document('intro_document')
            if not intro_document:
                raise ProcessingError("没有可用的引言文档")
        

            # 更新状态
            await self.state_manager.transition_to_state(
                StateEnum.REVIEWING_STRUCTURE,
                progress=100,
                message="文档已准备就绪，请在编辑器中查看和调整"
            )
 
            # ###### 待 完成 大模型分析
            final_document = intro_document
            review_suggestion = {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "建议的文档 占位， 待大模型使用大模型实际分析的结果"
                            }
                        ]
                    },
                ],
            }
            
            # 更新状态为完成
            await self.state_manager.transition_to_state(
                StateEnum.STRUCTURE_REVIEWED,
                progress=100,
                message="文档结构化分析完成！",
                document_data=final_document,
                suggestions_data=review_suggestion,
            )      
            
            logger.info(f"[{trace_id}] 文档结构化流程完成")
            
        except Exception as e:
            logger.error(f"[{trace_id}] 完成编辑失败: {str(e)}")
            raise ProcessingError(f"完成编辑失败: {str(e)}")


    async def _is_valid_step(self, step: ProcessingStep) -> bool:

        # 检查状态是否存在，并获取状态数据
        agent_state = await self.cache.get_agent_state()
        if not agent_state:
            raise ProcessingError("没有可用的状态数据")
        
        state = agent_state.state
        if not state:
            raise ProcessingError("没有可用的状态数据")
        

        if state != StateEnum.EXTRACTING_DOCUMENT:
            # 检查state是否合法
            # 未来要补充 stage的检查，需要时state是structuring阶段的state. 
            if state not in ED_STATE_POOL:
                raise ProcessingError(f"无效的状态: {state}")

            if state == StateEnum.STRUCTURE_REVIEWED:
                raise ProcessingError(f"结构化流程已完成，无法继续处理")

        # 检查ProcessingStep是否合法
        state_config = StateRegistry.get_state_config(state)
        if state_config.next_step != step:
            raise ProcessingError(f"无效的步骤: {step}")
        
        return True