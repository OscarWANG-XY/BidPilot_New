import logging
from typing import Optional, Dict, Any
from datetime import datetime
import asyncio
import json
import traceback

from .state_manager import create_state_manager, AgentStateData
from .state import (
    SystemInternalState, UserVisibleState, ProcessingStep, UserAction,
    StateRegistry, ING_STATE_POOL, ED_STATE_POOL, AWAITING_STATE_POOL,
    StateTransitionError, InvalidActionError, ProcessingError
)

# 假设这些执行组件已经正确迁移
from .step_funcs.docx_extractor import DocxExtractor
from .step_funcs.analyze_l1_headings import OutlineL1Analyzer
from .step_funcs.analyze_l2_l3_headings import OutlineL2L3Analyzer
from .step_funcs.add_intro_headings import AddIntroHeadings

logger = logging.getLogger(__name__)


class StructuringAgent:
    """
    文档结构化Agent - FastAPI版本
    负责将上传的投标文件提取+分析大纲+注入TiptapJSON
    
    主要变化：
    1. 使用新的双层状态系统 (SystemInternalState + UserVisibleState)
    2. 状态存储从Django缓存/数据库改为Redis
    3. 通信从WebSocket改为SSE
    4. 使用统一的状态管理器
    """

    def __init__(self, project_id: str, lazy_init: bool = False):
        """
        初始化结构化代理
        
        Args:
            project_id: 项目ID
            lazy_init: 是否延迟初始化组件
        """
        self.project_id = project_id
        self.state_manager = create_state_manager(project_id)
        
        # 延迟初始化组件  (测试done)
        self._docx_extractor = None    # 完成测试
        self._outline_l1_analyzer = None
        self._outline_l2_l3_analyzer = None
        self._add_intro_headings = None
        
        if not lazy_init:
            # 在FastAPI中，组件初始化将在第一次使用时进行
            pass

    async def _init_components(self):
        """异步初始化组件"""
        if self._docx_extractor is None:
            self._docx_extractor = DocxExtractor(self.project_id)

        if self._outline_l1_analyzer is None:
            self._outline_l1_analyzer = OutlineL1Analyzer()

        if self._outline_l2_l3_analyzer is None:
            self._outline_l2_l3_analyzer = OutlineL2L3Analyzer()

        if self._add_intro_headings is None:
            self._add_intro_headings = AddIntroHeadings()

    # =============== 组件属性访问器 ===============
    @property  
    async def docx_extractor(self):
        """获取文档提取器"""
        if self._docx_extractor is None:
            await self._init_components()
        return self._docx_extractor
    
    @property
    async def outline_l1_analyzer(self):
        """获取一级标题分析器"""
        if self._outline_l1_analyzer is None:
            await self._init_components()
        return self._outline_l1_analyzer
    
    @property
    async def outline_l2_l3_analyzer(self):
        """获取二级/三级标题分析器"""
        if self._outline_l2_l3_analyzer is None:
            await self._init_components()
        return self._outline_l2_l3_analyzer
    
    @property
    async def add_intro_headings(self):
        """获取引言标题分析器"""
        if self._add_intro_headings is None:
            await self._init_components()
        return self._add_intro_headings

    # =============== 状态管理 ===============
    @property
    async def current_state(self) -> Optional[AgentStateData]:
        """获取当前状态数据"""
        return await self.state_manager.cache.get_agent_state()
    
    @property
    async def current_internal_state(self) -> Optional[SystemInternalState]:
        """获取当前内部状态"""
        agent_state = await self.state_manager.cache.get_agent_state()
        current_internal_state = agent_state.current_internal_state
        return current_internal_state
    
    # @property
    # async def current_user_state(self) -> Optional[UserVisibleState]:
    #     """获取当前用户可见状态"""
    #     return await self.state_manager.get_user_visible_state()


    # =============== 主要处理流程 ===============
    async def start_analysis(self) -> Dict[str, Any]:
        """
        开始文档分析流程
        注意：文件上传由Django完成，微服务从文档提取开始
        """
        try:
            # 初始化Agent状态
            await self.state_manager.initialize_agent()
            
            # 开始文档提取 （使用了状态机，所以直接await就好了）
            await self.process_step(ProcessingStep.EXTRACT)
            
        except Exception as e:
            error_msg = f"启动分析失败: {str(e)}"
            logger.error(error_msg)
            await self.state_manager._handle_error("start_analysis_error", error_msg)
            raise ProcessingError(error_msg)

    async def handle_user_action(self, action: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        处理用户操作
        
        Args:
            action: 用户操作类型
            payload: 操作数据
            
        Returns:
            处理结果
        """
        trace_id = f"{self.project_id}_{action}_{datetime.now().isoformat()}"
        logger.info(f"[{trace_id}] 处理用户操作: {action}")
        
        try:
            # 验证操作
            try:
                action_enum = UserAction(action)
            except ValueError:
                return {
                    "status": "error",
                    "message": f"未知的用户操作: {action}",
                    "trace_id": trace_id
                }
            
            # 使用状态管理器处理操作
            success = await self.state_manager.handle_user_action(
                action_enum, 
                payload
            )
            
            if success:
                return {
                    "status": "success",
                    "message": "操作执行成功",
                    "trace_id": trace_id
                }
            else:
                return {
                    "status": "error", 
                    "message": "操作执行失败",
                    "trace_id": trace_id
                }
                
        except Exception as e:
            error_msg = f"处理用户操作失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}")
            return {
                "status": "error",
                "message": error_msg,
                "trace_id": trace_id
            }


   
    async def process_step(self, step: ProcessingStep, user_input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        执行处理步骤
        
        Args:
            step: 处理步骤
            user_input: 用户输入数据
            
        Returns:
            处理结果
        """
        trace_id = f"{self.project_id}_{step}_{datetime.now().isoformat()}"
        logger.info(f"[{trace_id}] 开始处理步骤: {step}")
        
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
                
            elif step == ProcessingStep.USER_EDITING:
                await self._process_editing(trace_id, user_input)
                
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
            # 检查当前状态，如果不是 EXTRACTING_DOCUMENT，则更新状态
            current_state = await self.current_internal_state
            if current_state != SystemInternalState.EXTRACTING_DOCUMENT:
                await self.state_manager.transition_to_state(
                    SystemInternalState.EXTRACTING_DOCUMENT,
                    progress=10,
                    message="正在提取文档内容..."
                )
            
            # tender_file 是TenderFile类型，包含url字段
            tender_file = await self.state_manager.storage.get_tender_file_url()

            # 执行文档提取
            extractor = await self.docx_extractor  # 注意docx_extractor是异步属性，不要加()
            raw_document = await extractor.extract_content(tender_file.url)
            
            if not raw_document:
                raise ProcessingError("文档提取失败，内容为空")
            
            # 更新状态为提取完成
            await self.state_manager.transition_to_state(
                SystemInternalState.DOCUMENT_EXTRACTED,
                progress=20,
                message="文档提取完成",
                result_data=raw_document
            )
            
            logger.info(f"[{trace_id}] 文档提取成功")

            # 自动触发下一步
            await asyncio.sleep(0.5)  # 短暂延迟
            await self.process_step(ProcessingStep.ANALYZE_H1)
            
        except Exception as e:
            logger.error(f"[{trace_id}] 文档提取失败: {str(e)}")
            raise ProcessingError(f"文档提取失败: {str(e)}")
    
    async def _process_analyze_h1(self, trace_id: str) -> Dict[str, Any]:
        """处理一级标题分析步骤"""
        try:
            # 获取原始文档
            document = await self.state_manager.cache.get_document('raw_document')
            if not document:
                raise ProcessingError("没有可用的文档内容")
            
            # 更新状态
            await self.state_manager.transition_to_state(
                SystemInternalState.ANALYZING_OUTLINE_H1,
                progress=30,
                message="正在分析文档主要章节..."
            )
            
            # 执行H1分析
            analyzer = await self.outline_l1_analyzer
            h1_document = await analyzer.analyze(document, self.project_id)
            
            if not h1_document:
                raise ProcessingError("H1大纲分析失败，结果为空")
            
            # 更新状态
            await self.state_manager.transition_to_state(
                SystemInternalState.OUTLINE_H1_ANALYZED,
                progress=50,
                message="主要章节分析完成",
                result_data=h1_document
            )
            
            logger.info(f"[{trace_id}] H1分析成功")

            # 自动触发下一步
            await asyncio.sleep(0.5)  # 短暂延迟
            await self.process_step(ProcessingStep.ANALYZE_H2H3)
            
        except Exception as e:
            logger.error(f"[{trace_id}] H1分析失败: {str(e)}")
            raise ProcessingError(f"H1分析失败: {str(e)}")
    
    async def _process_analyze_h2h3(self, trace_id: str) -> Dict[str, Any]:
        """处理二级/三级标题分析步骤"""
        try:
            # 获取H1分析结果
            h1_document = await self.state_manager.cache.get_document('h1_document')
            if not h1_document:
                raise ProcessingError("没有可用的H1分析结果")
            
            # 更新状态
            await self.state_manager.transition_to_state(
                SystemInternalState.ANALYZING_OUTLINE_H2H3,
                progress=60,
                message="正在分析文档子章节..."
            )
            
            # 执行H2H3分析
            analyzer = await self.outline_l2_l3_analyzer
            h2h3_document = await analyzer.analyze(h1_document, self.project_id)
            
            if not h2h3_document:
                raise ProcessingError("H2H3大纲分析失败，结果为空")
            
            # 更新状态
            await self.state_manager.transition_to_state(
                SystemInternalState.OUTLINE_H2H3_ANALYZED,
                progress=75,
                message="子章节分析完成",
                result_data=h2h3_document
            )
            
            logger.info(f"[{trace_id}] H2H3分析成功")

            # 自动触发下一步
            await asyncio.sleep(0.5)  # 短暂延迟
            await self.process_step(ProcessingStep.ADD_INTRODUCTION)
            
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
                SystemInternalState.ADDING_INTRODUCTION,
                progress=85,
                message="正在添加引言部分..."
            )
            
            # 执行引言添加
            analyzer = await self.add_intro_headings
            intro_document = await analyzer.add(h2h3_document)
            
            if not intro_document:
                raise ProcessingError("引言添加失败，结果为空")
            
            # 更新状态为引言添加完成
            await self.state_manager.transition_to_state(
                SystemInternalState.INTRODUCTION_ADDED,
                progress=95,
                message="引言添加完成",
                result_data=intro_document
            )
            
            # 自动转换到等待编辑状态
            await asyncio.sleep(1)  # 短暂延迟
            await self.state_manager.transition_to_state(
                SystemInternalState.AWAITING_EDITING,
                progress=100,
                message="文档已准备就绪，请在编辑器中查看和调整"
            )
            
            logger.info(f"[{trace_id}] 引言添加成功")

        except Exception as e:
            logger.error(f"[{trace_id}] 引言添加失败: {str(e)}")
            raise ProcessingError(f"引言添加失败: {str(e)}")
    
    async def _process_editing(self, trace_id: str, user_input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """处理完成编辑步骤"""
        try:
            # 获取用户编辑后的文档
            final_document = None
            if user_input and 'document' in user_input:
                final_document = user_input['document']
                logger.info(f"[{trace_id}] 收到用户编辑后的文档")
            else:
                # 如果没有用户编辑，使用引言文档作为最终文档
                final_document = await self.state_manager.cache.get_document('intro_document')
                logger.info(f"[{trace_id}] 使用引言文档作为最终文档")
            
            if not final_document:
                raise ProcessingError("没有可用的最终文档")
            
            # 更新状态为完成
            await self.state_manager.transition_to_state(
                SystemInternalState.COMPLETED,
                progress=100,
                message="文档结构化完成！",
                result_data=final_document
            )
            
            logger.info(f"[{trace_id}] 文档结构化流程完成")
            
        except Exception as e:
            logger.error(f"[{trace_id}] 完成编辑失败: {str(e)}")
            raise ProcessingError(f"完成编辑失败: {str(e)}")


    # =============== 状态恢复  并 接续 ===============
    async def _try_restore_state(self):
        """尝试恢复状态和文档数据"""
        try:
            # 检查是否已有状态
            agent_state = await self.current_state
            
            if agent_state:
                logger.info(f"项目 {self.project_id} 状态已存在: {agent_state.current_internal_state}")
                
                # 处理中断状态的恢复
                current_internal_state = agent_state.current_internal_state
                await self._handle_interrupted_state(current_internal_state)
            else:
                logger.info(f"项目 {self.project_id} 没有保存的状态，将在开始分析时初始化")
                await self.start_analysis()
                
        except Exception as e:
            logger.error(f"恢复状态时出错: {str(e)}")
            raise ProcessingError(f"状态恢复失败: {str(e)}")

    async def _handle_interrupted_state(self, current: SystemInternalState):
        """处理中断状态的恢复"""
        logger.info(f"检查中断状态: 当前状态为 {current}")
        
        # 根据完成状态决定下一步
        print(f"current 值为: {current}")
        if current in ED_STATE_POOL and current != SystemInternalState.COMPLETED:
            logger.info(f"从状态 {current} 恢复，直接执行下一步")
            next_step = StateRegistry.get_state_config(current).next_step
            await self.process_step(next_step)
        
        elif current in ING_STATE_POOL:
            # 处理中状态需要重试
            if current == SystemInternalState.EXTRACTING_DOCUMENT:
                # EXTRACTING_DOCUMENT 是初始状态，直接重新开始
                logger.info(f"项目 {self.project_id} 从文档提取状态恢复，重新开始提取")
                await self.process_step(ProcessingStep.EXTRACT)
            else:
                # 其他ING状态被中断，跳回上一个状态重试
                logger.warning(f"项目 {self.project_id} 在处理状态 {current} 被中断，标记为失败")
                previous_state = StateRegistry.get_state_config(current).previous_state
                await self.state_manager.transition_to_state(
                    previous_state,
                    message=f"处理在 {current} 状态被中断，跳回上一个状态{previous_state}，准备重试"
                )
                next_step = StateRegistry.get_state_config(previous_state).next_step
                await self.process_step(next_step)
        
        elif current in AWAITING_STATE_POOL:
            logger.info(f"项目 {self.project_id} 当前为等待编辑状态，无需恢复")
            return
        
        else:  # 当前状态为Failed或其他特殊状态
            logger.warning(f"项目 {self.project_id} 当前为失败状态，跳回上一个非失败状态")
            state_history = await self.state_manager.cache._get_agent_state_history()
            if not state_history:
                logger.warning(f"项目 {self.project_id} 没有状态历史，从文档提取开始重试")
                await self.state_manager._handle_restart_from_beginning()
            
            # 找到最后一个非失败状态
            last_success_state = None
            for state_record in state_history.agent_states: #由于history是按时间倒序排列，所以会找到第一个非失败的状态。 
                if state_record.current_internal_state != SystemInternalState.FAILED:
                    last_success_state = state_record.current_internal_state
                    break
            
            if not last_success_state:
                logger.warning(f"项目 {self.project_id} 没有找到成功状态，从文档提取开始重试")
                await self.state_manager._handle_restart_from_beginning()
            
            await self.state_manager.transition_to_state(
                last_success_state,
                message=f"跳回最近一个非失败的状态{last_success_state}，准备重试"
            )
            await self._handle_interrupted_state(last_success_state)


# =============== 全局实例管理 (用于celery任务) ===============

_agent_instances: Dict[str, StructuringAgent] = {}

async def create_or_get_agent(project_id: str) -> StructuringAgent:
    """获取或创建Agent实例"""

    # 检查实例是否存在，存在直接返回，不存在则新建，并尝试恢复状态
    if project_id not in _agent_instances:
        # 没有实例时，构建Agent实例并初始化
        agent = StructuringAgent(project_id, lazy_init=True)
        # 尝试恢复状态
        await agent._try_restore_state()
        # 保存实例
        _agent_instances[project_id] = agent

    return _agent_instances[project_id]

async def remove_agent(project_id: str):
    """移除Agent实例"""

    if project_id in _agent_instances:
        #这里我们没有添加清理documents的动作，因为我们在每个步骤的保存中都执行 不必要文档的删除
        # 保留的缓存包括：agent_state, raw_document, final_document
        del _agent_instances[project_id]
