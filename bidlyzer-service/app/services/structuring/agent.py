import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncio
import json
import traceback

from app.core.redis_helper import RedisClient
from app.core.cache_manager import CacheManager
from .state_manager import create_state_manager, AgentStateData
from .state import (
    SystemInternalState, UserVisibleState, ProcessingStep, UserAction,
    StateRegistry, INTERNAL_TO_USER_STATE_MAP,
    StateTransitionError, InvalidActionError, ProcessingError
)

# 假设这些执行组件已经正确迁移
from .docx_extractor import DocxExtractor
from .analyze_l1_headings import OutlineL1Analyzer
from .analyze_l2_l3_headings import OutlineL2L3Analyzer
from .add_intro_headings import AddIntroHeadings

logger = logging.getLogger(__name__)


class DocumentStructureAgent:
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
        return await self.state_manager.get_agent_state()
    
    @property
    async def current_internal_state(self) -> Optional[SystemInternalState]:
        """获取当前内部状态"""
        return await self.state_manager.get_internal_state()
    
    @property
    async def current_user_state(self) -> Optional[UserVisibleState]:
        """获取当前用户可见状态"""
        return await self.state_manager.get_user_visible_state()


    # =============== 主要处理流程 ===============
    async def start_analysis(self) -> Dict[str, Any]:
        """
        开始文档分析流程
        注意：文件上传由Django完成，微服务从文档提取开始
        """
        try:
            # 初始化Agent状态
            agent_state = await self.state_manager.initialize_agent()
            
            
            # 开始文档提取
            return await self.process_step(ProcessingStep.EXTRACT)
            
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
                return await self._process_extract(trace_id)
                
            elif step == ProcessingStep.ANALYZE_H1:
                return await self._process_analyze_h1(trace_id)
                
            elif step == ProcessingStep.ANALYZE_H2H3:
                return await self._process_analyze_h2h3(trace_id)
                
            elif step == ProcessingStep.ADD_INTRODUCTION:
                return await self._process_add_introduction(trace_id)
                
            elif step == ProcessingStep.COMPLETE_EDITING:
                return await self._process_complete_editing(trace_id, user_input)
                
            else:
                return {
                    "status": "error",
                    "message": f"未知的处理步骤: {step}",
                    "trace_id": trace_id
                }
                
        except Exception as e:
            error_msg = f"处理步骤失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}\n{traceback.format_exc()}")
            await self.state_manager._handle_error("step_processing_error", error_msg)
            return {
                "status": "error",
                "message": error_msg,
                "trace_id": trace_id,
                "error_type": "step_processing"
            }

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
            else:
                # 如果已经是提取状态，只更新进度和消息
                await self.state_manager.update_step_progress(
                    ProcessingStep.EXTRACT,
                    10
                )
            
            # 通过project_id获取文件url
            from app.clients.django.client import DjangoClient
            django_client = DjangoClient()
            result = await django_client.get_tender_file_url(self.project_id)
            file_url = result['files'][0]['url']

            # 执行文档提取
            extractor = await self.docx_extractor  # 注意docx_extractor是异步属性，不要加()
            raw_document = await extractor.extract_content(file_url)
            
            if not raw_document:
                raise ProcessingError("文档提取失败，内容为空")
            
            # 保存提取结果
            await self._save_document('raw_document', raw_document)
            
            # 更新状态为提取完成
            await self.state_manager.transition_to_state(
                SystemInternalState.DOCUMENT_EXTRACTED,
                progress=20,
                message="文档提取完成",
                result_data={"document_size": len(json.dumps(raw_document))}
            )
            
            logger.info(f"[{trace_id}] 文档提取成功")

            # 自动触发下一步
            await asyncio.sleep(0.5)  # 短暂延迟
            await self.process_step(ProcessingStep.ANALYZE_H1)

            # 返回给process_step 集中跟踪（暂时未使用起来）
            return {"status": "success", "step": "extract"}
            
        except Exception as e:
            logger.error(f"[{trace_id}] 文档提取失败: {str(e)}")
            raise ProcessingError(f"文档提取失败: {str(e)}")
    
    async def _process_analyze_h1(self, trace_id: str) -> Dict[str, Any]:
        """处理一级标题分析步骤"""
        try:
            # 获取原始文档
            document = await self._get_document('raw_document')
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
            
            # 保存分析结果
            await self._save_document('h1_document', h1_document)
            
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

            # 返回给process_step 集中跟踪（暂时未使用起来）
            return {"status": "success", "step": "analyze_h1"}
            
        except Exception as e:
            logger.error(f"[{trace_id}] H1分析失败: {str(e)}")
            raise ProcessingError(f"H1分析失败: {str(e)}")
    
    async def _process_analyze_h2h3(self, trace_id: str) -> Dict[str, Any]:
        """处理二级/三级标题分析步骤"""
        try:
            # 获取H1分析结果
            h1_document = await self._get_document('h1_document')
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
            
            # 保存分析结果
            await self._save_document('h2h3_document', h2h3_document)
            
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

            # 返回给process_step 集中跟踪（暂时未使用起来）
            return {"status": "success", "step": "analyze_h2h3"}
            
        except Exception as e:
            logger.error(f"[{trace_id}] H2H3分析失败: {str(e)}")
            raise ProcessingError(f"H2H3分析失败: {str(e)}")
    
    async def _process_add_introduction(self, trace_id: str) -> Dict[str, Any]:
        """处理引言添加步骤"""
        try:
            # 获取H2H3分析结果
            h2h3_document = await self._get_document('h2h3_document')
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
            
            # 保存结果
            await self._save_document('intro_document', intro_document)
            
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
            return {"status": "success", "step": "add_introduction", "document": intro_document}
            
        except Exception as e:
            logger.error(f"[{trace_id}] 引言添加失败: {str(e)}")
            raise ProcessingError(f"引言添加失败: {str(e)}")
    
    async def _process_complete_editing(self, trace_id: str, user_input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """处理完成编辑步骤"""
        try:
            # 获取用户编辑后的文档
            final_document = None
            if user_input and 'document' in user_input:
                final_document = user_input['document']
                logger.info(f"[{trace_id}] 收到用户编辑后的文档")
            else:
                # 如果没有用户编辑，使用引言文档作为最终文档
                final_document = await self._get_document('intro_document')
                logger.info(f"[{trace_id}] 使用引言文档作为最终文档")
            
            if not final_document:
                raise ProcessingError("没有可用的最终文档")
            
            # 保存最终文档
            await self._save_document('final_document', final_document)
            
            # 更新状态为完成
            await self.state_manager.transition_to_state(
                SystemInternalState.COMPLETED,
                progress=100,
                message="文档结构化完成！",
                result_data=final_document
            )
            
            logger.info(f"[{trace_id}] 文档结构化流程完成")
            return {
                "status": "success",
                "step": "complete",
                "document": final_document,
                "trace_id": trace_id
            }
            
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
                await self._handle_interrupted_state(agent_state)
            else:
                logger.info(f"项目 {self.project_id} 没有保存的状态，将在开始分析时初始化")
                
        except Exception as e:
            logger.error(f"恢复状态时出错: {str(e)}")
            raise ProcessingError(f"状态恢复失败: {str(e)}")

    async def _handle_interrupted_state(self, agent_state: AgentStateData):
        """处理中断状态的恢复"""
        current = agent_state.current_internal_state
        logger.info(f"检查中断状态: 当前状态为 {current}")
        
        # 根据完成状态决定下一步
        if current == SystemInternalState.DOCUMENT_EXTRACTED:
            logger.info("从文档提取完成状态恢复，继续H1分析")
            await self.process_step(ProcessingStep.ANALYZE_H1)
        
        elif current == SystemInternalState.OUTLINE_H1_ANALYZED:
            logger.info("从H1分析完成状态恢复，继续H2H3分析")
            await self.process_step(ProcessingStep.ANALYZE_H2H3)
        
        elif current == SystemInternalState.OUTLINE_H2H3_ANALYZED:
            logger.info("从H2H3分析完成状态恢复，继续添加引言")
            await self.process_step(ProcessingStep.ADD_INTRODUCTION)
        
        elif current == SystemInternalState.INTRODUCTION_ADDED:
            logger.info("从引言添加完成状态恢复，转换到等待编辑")
            await self.state_manager.transition_to_state(
                SystemInternalState.AWAITING_EDITING,
                progress=100,
                message="文档已准备就绪，请在编辑器中查看和调整"
            )
        
        elif current in [
            SystemInternalState.EXTRACTING_DOCUMENT,
            SystemInternalState.ANALYZING_OUTLINE_H1,
            SystemInternalState.ANALYZING_OUTLINE_H2H3,
            SystemInternalState.ADDING_INTRODUCTION
        ]:
            # 处理中状态需要重试
            logger.warning(f"项目 {self.project_id} 在处理状态 {current} 被中断，标记为失败")
            await self.state_manager.transition_to_state(
                SystemInternalState.FAILED,
                message=f"处理在 {current} 状态被中断，请重试"
            )



# =============== 全局实例管理 (用于celery任务) ===============

_agent_instances: Dict[str, DocumentStructureAgent] = {}

async def create_or_get_agent(project_id: str) -> DocumentStructureAgent:
    """获取或创建Agent实例"""
    if project_id not in _agent_instances:
        agent = DocumentStructureAgent(project_id, lazy_init=True)
        await agent._try_restore_state()
        _agent_instances[project_id] = agent
    return _agent_instances[project_id]

async def remove_agent(project_id: str):
    """移除Agent实例"""
    if project_id in _agent_instances:
        #这里我们没有添加清理documents的动作，因为我们在每个步骤的保存中都执行 不必要文档的删除
        # 保留的缓存包括：agent_state, raw_document, final_document
        del _agent_instances[project_id]
