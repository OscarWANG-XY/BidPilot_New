import logging
from typing import Optional, Dict, Any, List, Tuple, Type
from dataclasses import dataclass
import json
import traceback
from datetime import datetime

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from django.core.cache import cache

from .docx_extractor import DocxExtractor
from .analyze_l1_headings import OutlineL1Analyzer
from .analyze_l2_l3_heading import OutlineL2L3Analyzer
from .add_intro_headings import AddIntroHeadings
from .state_manager import StateManager

from .state import (
    AgentState, STATE_CONFIG, 
    StateError, InvalidStateTransitionError, DocumentProcessingError, OutlineAnalysisError,
    UserAction, ACTION_CONFIG, 
    ProcessStep, STEP_CONFIG,
    STATE_TO_STEP, ACTION_TO_STEP,
    AgentMessage, DocumentData, UserActionPayload,
    UploadDocumentPayload, CompleteEditingPayload, RetryPayload,
    UserActionRequest, AgentResponse,
    STATE_DATA_TYPES, ACTION_PAYLOAD_TYPES
)

# 设置日志
logger = logging.getLogger(__name__)


class DocumentStructureAgent:
    """
    StructuringAgent：负责将上传的投标文件提取+分析大纲+注入TiptapJSON
    """

    def __init__(self, project_id: str, lazy_init: bool = False):
        """
        初始化结构化代理
        
        Args:
            project_id: 项目ID
            lazy_init: 是否延迟初始化组件（用于减少不必要的资源消耗）
        """
        self.project_id = project_id
        self.channel_layer = get_channel_layer()
        self.group_name = f"project_{self.project_id}"
        
        # 状态管理器
        self.state_manager = StateManager(project_id)
        self.state_manager._agent_reference = self  # 反向引用, 在state_manager.py中才能调用agent的数据进行持久化。

        # 文档数据
        self.document = None
        self.H1_document = None
        self.H2H3_document = None
        self.Intro_document = None
        self.final_document = None
        
        # 延迟初始化组件
        self._docx_extractor = None
        self._outline_l1_analyzer = None
        self._outline_l2_l3_analyzer = None
        self._add_intro_headings = None
        
        # 如果不是延迟初始化，则立即创建组件
        if not lazy_init:
            self._init_components()
            
        # 尝试从数据库恢复状态
        self._try_restore_state()

    def _init_components(self):
        """初始化组件，仅在需要时调用"""
        if self._docx_extractor is None:  # 避免重复初始化
            self._docx_extractor = DocxExtractor(self.project_id)

        if self._outline_l1_analyzer is None:
            self._outline_l1_analyzer = OutlineL1Analyzer()

        if self._outline_l2_l3_analyzer is None:
            self._outline_l2_l3_analyzer = OutlineL2L3Analyzer()

        if self._add_intro_headings is None:
            self._add_intro_headings = AddIntroHeadings()
    

    # --------- 以下提供了另一种方式的懒加载 --------- 
    # 与__init__()方法的lazy_init条件初始化 形成 双重保险。 
    # 下面这种方式，让每一个组件只在真正需要使用时才初始化， 比如__init__()的方式更灵活。
    @property
    def docx_extractor(self):
        """获取文档提取器，确保已初始化"""
        self._init_components()
        return self._docx_extractor
    
    @property
    def outline_l1_analyzer(self):
        """获取一级标题分析器，确保已初始化"""
        self._init_components()
        return self._outline_l1_analyzer
    
    @property   
    def outline_l2_l3_analyzer(self):
        """获取二级/三级标题分析器，确保已初始化"""
        self._init_components()
        return self._outline_l2_l3_analyzer
    
    @property
    def add_intro_headings(self):
        """获取引言标题分析器，确保已初始化"""
        self._init_components()
        return self._add_intro_headings
    
    # --------- 状态管理器 ---------
    @property
    def current_state(self) -> AgentState:
        """获取当前状态"""
        return self.state_manager.get_state()
    
    def _try_restore_state(self):
        """尝试从缓存或数据库恢复状态"""
        from apps.projects.models import StructuringAgentState
        from django.core.cache import cache
        
        # 缓存键
        state_cache_key = self.state_manager._cache_key()
        
        try:
            # 首先尝试从缓存恢复状态
            cached_state = cache.get(state_cache_key)
            
            if cached_state:
                # 从缓存恢复基本状态
                self.state_manager.set_state(AgentState(cached_state['state']))
                self.state_manager.set_state_history(cached_state['state_history'])
                logger.info(f"已从缓存恢复项目 {self.project_id} 的状态")
            else:
                # 从数据库恢复状态
                try:
                    state_record = StructuringAgentState.objects.get(project_id=self.project_id)
                    
                    # 恢复状态
                    self.state_manager.set_state(AgentState(state_record.state))
                    self.state_manager.set_state_history(state_record.state_history)
                    
                    # 更新缓存
                    cache_data = {
                        'state': state_record.state,
                        'state_history': self.state_manager.get_state_history(),
                    }
                    cache.set(state_cache_key, cache_data, timeout=900)
                    
                    logger.info(f"已从数据库恢复项目 {self.project_id} 的状态并更新缓存")
                except StructuringAgentState.DoesNotExist:
                    logger.info(f"项目 {self.project_id} 没有保存的状态记录，使用默认状态")
                    # 这里不抛出异常，因为新项目本来就没有状态记录
                    return
                except Exception as e:
                    error_msg = f"从数据库恢复状态失败: {str(e)}"
                    logger.error(error_msg)
                    raise StateError(error_msg)
            
            # 恢复文档数据
            self._restore_documents()
            
            # 处理中断状态的恢复
            self._handle_interrupted_state()
            
        except Exception as e:
            if not isinstance(e, StateError):
                error_msg = f"恢复状态时出错: {str(e)}"
                logger.error(error_msg)
                raise StateError(error_msg)
            raise

    def _handle_interrupted_state(self):
        """
        处理中断状态的恢复，确保状态机处于有效状态
        
        根据状态流转图，处理所有可能的中断状态：
        1. 检查当前状态是否是中间状态（应该自动流转的状态）
        2. 如果是中间状态，且数据完整，则自动流转到下一个状态
        3. 如果数据不完整，保持当前状态不变
        """
        current = self.current_state
        logger.info(f"检查中断状态: 当前状态为 {current.value}")
        
        # 处理文档提取后的状态
        if current == AgentState.DOCUMENT_EXTRACTED:
            if self.document:  # 确保有文档数据
                self.update_state(
                    AgentState.ANALYZING_OUTLINE_H1,
                    "正在分析一级标题...",
                    {}
                )
                logger.info(f"项目 {self.project_id} 从中断状态 DOCUMENT_EXTRACTED 恢复到 ANALYZING_OUTLINE_H1")
        
        # 处理一级标题分析后的状态
        elif current == AgentState.OUTLINE_H1_ANALYZED:
            if self.H1_document:  # 确保有H1文档数据
                self.update_state(
                    AgentState.ANALYZING_OUTLINE_H2H3,
                    "正在分析二级/三级标题...",
                    {}
                )
                logger.info(f"项目 {self.project_id} 从中断状态 OUTLINE_H1_ANALYZED 恢复到 ANALYZING_OUTLINE_H2H3")
        
        # 处理二级/三级标题分析后的状态
        elif current == AgentState.OUTLINE_H2H3_ANALYZED:
            if self.H2H3_document:  # 确保有H2H3文档数据
                self.update_state(
                    AgentState.ADDING_INTRODUCTION,
                    "正在添加引言...",
                    {}
                )
                logger.info(f"项目 {self.project_id} 从中断状态 OUTLINE_H2H3_ANALYZED 恢复到 ADDING_INTRODUCTION")
        
        # 处理引言添加后的状态
        elif current == AgentState.INTRODUCTION_ADDED:
            if self.Intro_document:  # 确保有引言文档数据
                self.update_state(
                    AgentState.AWAITING_EDITING,
                    "请在编辑器中检查和调整大纲...",
                    {"document": self.Intro_document}
                )
                logger.info(f"项目 {self.project_id} 从中断状态 INTRODUCTION_ADDED 恢复到 AWAITING_EDITING")
        
        # 处理正在进行中的状态（这些状态应该重试）
        elif current in [
            AgentState.EXTRACTING_DOCUMENT,
            AgentState.ANALYZING_OUTLINE_H1,
            AgentState.ANALYZING_OUTLINE_H2H3,
            AgentState.ADDING_INTRODUCTION
        ]:
            logger.warning(f"项目 {self.project_id} 在进行中状态 {current.value} 被中断，需要用户重试")
            self.update_state(
                AgentState.FAILED,
                f"处理在 {current.value} 状态被中断，请重试",
                {"error_source": "interrupted"}
            )
        
        return self.current_state

    def _restore_documents(self):
        """恢复文档数据"""
        from apps.projects.models import StructuringAgentDocument
        from django.core.cache import cache
        
        # 文档类型到属性名的映射
        doc_type_mapping = {
            'document': 'document',
            'h1': 'H1_document',
            'h2h3': 'H2H3_document',
            'intro': 'Intro_document',
            'final': 'final_document'
        }
        
        # 遍历所有可能的文档类型
        for doc_type, attr_name in doc_type_mapping.items():
            # 先尝试从缓存获取
            cache_key = f"structuring_agent:doc:{self.project_id}:{doc_type}"
            cached_doc = cache.get(cache_key)
            
            if cached_doc:
                # 从缓存恢复文档
                setattr(self, attr_name, cached_doc)
                logger.debug(f"已从缓存恢复项目 {self.project_id} 的 {doc_type} 文档")
                continue
            
            # 如果缓存中没有，从数据库获取
            try:
                doc_record = StructuringAgentDocument.objects.get(
                    project_id=self.project_id,
                    document_type=doc_type
                )
                
                # 恢复文档
                setattr(self, attr_name, doc_record.content)
                
                # 更新缓存
                cache.set(cache_key, doc_record.content, timeout=900)
                
                logger.debug(f"已从数据库恢复项目 {self.project_id} 的 {doc_type} 文档并更新缓存")
            except StructuringAgentDocument.DoesNotExist:
                # 此文档类型可能不存在，这是正常的
                pass
            except Exception as e:
                logger.error(f"恢复文档 {doc_type} 时出错: {str(e)}")



    # --------- 状态更新函数，在 ---------
    # 在每一个_process_step 的开始和结束时, 错误时，_handle_retry, _handle_rollback里都被调用。 
    # 更新状态时，有两个动作： 1）更新状态和持久化  2）推送消息到前端 
    def update_state(self, state: AgentState, message: str = "", data: Dict[str, Any] = None):
        """
        更新任务状态并推送消息到前端
        
        Args:
            state: 新状态
            message: 状态消息，如果为空则使用默认消息
            data: 要发送的额外数据
        """
        try:
            # 尝试状态转换 （注意，在transition_to里，自带了数据持久化的处理， 
            # 持久化时，state是通过传参获得，而其他数据通过self.state_manager._agent_reference反向获得， 都在state_manager.py中执行）
            self.state_manager.transition_to(state)
            
            # 如果没有提供消息，使用状态的默认消息
            if not message:
                message = STATE_CONFIG[state].default_message
            
            # 判断当前状态是否需要用户输入
            requires_input = False
            try:
                requires_input = STATE_CONFIG[state].requires_input
            except (ValueError, KeyError):
                pass
                
            # 创建标准格式的消息
            agent_message = AgentMessage(
                message=message,
                state=state.value,
                notification_type=STATE_CONFIG[state].notification_type,
                data=data or {},
                requires_input=requires_input,
                timestamp=datetime.now().isoformat(),
                status="success",
                step=getattr(self, 'current_step', None),
                next_step=getattr(self, 'next_step', None)
            )
            
            # 转换为字典以便JSON序列化
            payload = {
                'type': "agent_message",  # 与 StructuringAgentConsumer 中的方法名对应
                **agent_message.__dict__
            }
            
            # 推送消息到WebSocket， 这时广播模式，发送给所有连接到同一项目的客户端 
            try:
                async_to_sync(self.channel_layer.group_send)(
                    self.group_name,
                    payload
                )
            except Exception as e:
                logger.error(f"WebSocket消息发送失败: {str(e)}")
            
            # 记录状态变更
            logger.info(f"项目 {self.project_id} 状态更新: {state.value}, 消息: {message}")
            
            return True
        except InvalidStateTransitionError as e:
            logger.error(f"状态转换错误: {str(e)}")
            
            # 发送错误通知
            error_payload = {
                'type': "agent_message",
                'message': f"状态转换错误: {str(e)}",
                'state': self.current_state.value,
                'notification_type': "error",
                'data': {},
                'requires_input': False,
                'timestamp': datetime.now().isoformat(),
                'status': "error"
            }
            
            try:
                async_to_sync(self.channel_layer.group_send)(
                    self.group_name,
                    error_payload
                )
            except Exception as e:
                logger.error(f"错误通知发送失败: {str(e)}")
                
            return False


    # --------- 处理用户输入 ---------
    # handle_user_input进行逻辑分流，根据action的类型，判定是调用process_step, 还是_handle_retry, _handle_rollback等
    def handle_user_input(self, action: str, data: dict = None) -> dict:
        """
        处理来自用户的输入，推进状态机
        
        Args:
            action: 用户操作
            data: 操作数据
            
        Returns:
            处理结果
        """

        logger.info(f"handle_user_input: 收到操作请求，action为：{action}， data为{data}")

        # 创建跟踪ID用于日志
        trace_id = f"{self.project_id}_{action}_{datetime.now().isoformat()}"
        logger.info(f"[{trace_id}] 处理用户操作: {action}, 当前状态: {self.current_state.value}")
        
        try:
            # 验证操作是否有效
            try:
                action_enum = UserAction(action)   #字符串转为对应的枚举对象。 
            except ValueError:
                error_msg = f"未知的用户操作: {action}"
                logger.warning(f"[{trace_id}] {error_msg}")
                return AgentResponse(
                    status="error", 
                    message=error_msg, 
                    trace_id=trace_id
                ).__dict__
            
            # 验证当前状态是否允许此操作
            action_config = ACTION_CONFIG[action_enum]
            if self.current_state not in action_config.valid_states:
                error_msg = f"当前状态 {self.current_state.value} 不允许执行操作 {action}"
                logger.warning(f"[{trace_id}] {error_msg}")
                return AgentResponse(
                    status="error", 
                    message=error_msg, 
                    trace_id=trace_id
                ).__dict__
            
            # 验证是否提供了必要的数据
            if action_config.requires_payload and not data:
                error_msg = f"操作 {action} 需要提供数据"
                logger.warning(f"[{trace_id}] {error_msg}")
                return AgentResponse(
                    status="error", 
                    message=error_msg, 
                    trace_id=trace_id
                ).__dict__
            
            logger.info(f"handle_user_input: 完成操作验证")

            # 处理不同类型的操作
            if action_enum in [UserAction.DOCUMENT_UPLOADED, UserAction.COMPLETE_EDITING]:
                # 将用户操作映射到处理步骤
                step = ACTION_TO_STEP[action_enum]
                return self.process_step(step, data)
                
            elif action_enum == UserAction.RETRY:
                return self._handle_retry(data, trace_id)
                
            elif action_enum == UserAction.ROLLBACK:
                return self._handle_rollback(data, trace_id)
                
            elif action_enum == UserAction.GET_STATUS:
                # 返回当前状态信息
                return AgentResponse(
                    status="success",
                    state=self.current_state.value,
                    requires_input=STATE_CONFIG[self.current_state].requires_input,
                    message=STATE_CONFIG[self.current_state].default_message,
                    trace_id=trace_id
                ).__dict__
                
        except Exception as e:
            error_msg = f"处理用户操作失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}\n{traceback.format_exc()}")
            return AgentResponse(
                status="error", 
                message=error_msg, 
                trace_id=trace_id
            ).__dict__


    # --------- 处理步骤 ---------
    def process_step(self, step: ProcessStep = None, user_input: dict = None):
        """
        执行指定的处理步骤，支持交互式处理流程
        
        Args:
            step: 要执行的步骤
            user_input: 用户输入数据
            
        Returns:
            处理结果字典
        """
        logger.info(f"process_step: 收到执行请求，step为{step}, user_input为{user_input}")

        # 如果没有指定步骤，根据当前状态确定步骤
        if step is None:
            # 根据当前状态确定步骤，事实上由于我们我们每次调用process_step(step参数)时，都输入了明确的step参数，STATE_TO_STEP反而没有用到。 
            # 但只要process_step()没有step的传参，就会用到STATE_TO_STEP的映射，让流程往下走。 
            step = STATE_TO_STEP.get(self.current_state)
        
        # 创建跟踪ID用于日志关联
        trace_id = f"{self.project_id}_{datetime.now().isoformat()}"
        logger.info(f"[{trace_id}] 开始处理步骤: {step}, 当前状态: {self.current_state.value}")
        
        try:
            # 提取文档
            if step == ProcessStep.EXTRACT:
                self._process_extract(user_input, trace_id)

            # 分析一级标题  
            elif step == ProcessStep.ANALYZE_OUTLINE_H1:
                self._process_analyze_l1_headings(trace_id)

            # 分析二级/三级标题
            elif step == ProcessStep.ANALYZE_OUTLINE_H2H3:
                self._process_analyze_l2_l3_headings(trace_id)

            # 添加引言标题
            elif step == ProcessStep.ADD_INTRODUCTION:
                self._process_add_intro_headings(trace_id)
                
            # 完成编辑
            elif step == ProcessStep.COMPLETE:
                self._process_complete(trace_id, user_input)
                
            return {"status": "success", "next_step": self.next_step}
                
        except DocumentProcessingError as e:
            error_msg = f"文档处理失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}")
            self.update_state(AgentState.FAILED, error_msg)
            return {
                "status": "error", 
                "message": error_msg, 
                "trace_id": trace_id,
                "error_type": "document_processing"
            }
            
        except OutlineAnalysisError as e:
            error_msg = f"大纲分析失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}")
            self.update_state(AgentState.FAILED, error_msg)
            return {
                "status": "error", 
                "message": error_msg, 
                "trace_id": trace_id,
                "error_type": "outline_analysis"
            }
            
        except Exception as e:
            error_msg = f"处理失败: {str(e)}"
            logger.error(f"[{trace_id}] {error_msg}\n{traceback.format_exc()}")
            self.update_state(AgentState.FAILED, error_msg)
            return {
                "status": "error", 
                "message": error_msg, 
                "trace_id": trace_id,
                "error_type": "unknown"
            }
    
    def _process_extract(self, user_input: dict, trace_id: str) -> dict:
        """处理文档提取步骤"""
        # 开始
        self.update_state(AgentState.EXTRACTING_DOCUMENT, "正在提取文档内容...")   
        
        try:
            # 提取文档内容 - 使用属性访问
            self.document = self.docx_extractor.extract_content()
            
            if not self.document:
                raise DocumentProcessingError("文档提取失败，内容为空")

            # 更新状态
            self.update_state(AgentState.DOCUMENT_EXTRACTED, "文档提取完成，准备分析大纲...")
            
            # 返回成功结果，而不是自动进入下一步
            logger.info(f"[{trace_id}] 文档提取成功，文档大小: {len(json.dumps(self.document))}")
            
            self.next_step = ProcessStep.ANALYZE_OUTLINE_H1
            
        except Exception as e:
            logger.error(f"[{trace_id}] 文档提取异常: {str(e)}\n{traceback.format_exc()}")
            raise DocumentProcessingError(f"文档提取失败: {str(e)}")
    
    def _process_analyze_l1_headings(self, trace_id: str) -> dict:
        """处理一级标题分析步骤"""
        if not self.document:
            raise OutlineAnalysisError("没有可用的文档内容")
            
        self.update_state(AgentState.ANALYZING_OUTLINE_H1, "正在分析文档H1大纲...")
        
        try:
            # 分析文档大纲 - 使用属性访问
            self.H1_document = async_to_sync(self.outline_l1_analyzer.analyze)(self.document)
            if not self.H1_document:
                raise OutlineAnalysisError("H1大纲分析失败，结果为空")
                
            # 更新状态 - 通知前端分析完成
            self.update_state(
                AgentState.OUTLINE_H1_ANALYZED, 
                "H1大纲分析完成...",
            )
            
            logger.info(f"[{trace_id}] 大纲分析成功")

            # 返回成功结果，而不是自动进入下一步
            
            self.next_step = ProcessStep.ANALYZE_OUTLINE_H2H3
            
        except Exception as e:
            logger.error(f"[{trace_id}] 大纲分析异常: {str(e)}\n{traceback.format_exc()}")
            raise OutlineAnalysisError(f"大纲分析失败: {str(e)}")

    def _process_analyze_l2_l3_headings(self, trace_id: str) -> dict:
        """处理二级/三级标题分析步骤"""
        if not self.H1_document:
            raise OutlineAnalysisError("没有可用的H1大纲内容")
            
        self.update_state(AgentState.ANALYZING_OUTLINE_H2H3, "正在分析文档H2/H3大纲...")
        
        try:
            # 分析文档大纲 - 使用属性访问
            self.H2H3_document = async_to_sync(self.outline_l2_l3_analyzer.analyze)(self.H1_document)
            if not self.H2H3_document:
                raise OutlineAnalysisError("H2/H3大纲分析失败，结果为空")
                
            # 更新状态 - 通知前端分析完成 （注意，这里我们并没有传递outline数据给前端）
            self.update_state(
                AgentState.OUTLINE_H2H3_ANALYZED, 
                "H2/H3大纲分析完成...",
                # {"document": self.H1_document}
            )
            
            logger.info(f"[{trace_id}] 大纲分析成功")

            # 自动进入添加引言标题步骤，不等待用户确认
            # return self.process_step(ProcessStep.ADD_INTRODUCTION)

            self.next_step = ProcessStep.ADD_INTRODUCTION
            
        except Exception as e:
            logger.error(f"[{trace_id}] 大纲分析异常: {str(e)}\n{traceback.format_exc()}")
            raise OutlineAnalysisError(f"大纲分析失败: {str(e)}")

    def _process_add_intro_headings(self, trace_id: str) -> dict:
        """处理引言标题分析步骤"""
        if not self.H2H3_document:
            raise OutlineAnalysisError("没有可用的H2/H3大纲内容")
            
        self.update_state(AgentState.ADDING_INTRODUCTION, "正在添加引言标题...")

        try:
            # 分析文档大纲 - 使用属性访问
            self.Intro_document = self.add_intro_headings.add(self.H2H3_document)
            if not self.Intro_document:
                raise OutlineAnalysisError("引言标题分析失败，结果为空")
                
            # 更新状态 - 通知前端分析完成 （注意，这里我们并没有传递outline数据给前端）
            self.update_state(
                AgentState.INTRODUCTION_ADDED, 
                "引言标题分析完成, 完整大纲结果请在编辑器中检查和调整...",
                {"document": self.Intro_document}
            )

            # 自动进入等待编辑状态
            self.update_state(
                AgentState.AWAITING_EDITING,
                "请在编辑器中检查和调整大纲..."
    )
            
            logger.info(f"[{trace_id}] 大纲分析成功")

            # 返回成功结果，而不是自动进入下一步
            self.next_step = ProcessStep.COMPLETE
            
            
        except Exception as e:
            logger.error(f"[{trace_id}] 大纲分析异常: {str(e)}\n{traceback.format_exc()}")
            raise OutlineAnalysisError(f"大纲分析失败: {str(e)}")
        pass

    def _process_complete(self, trace_id: str, user_input: dict = None) -> dict:
        """处理完成编辑步骤"""
        # 如果用户提供了编辑后的文档，更新 final_document
        if user_input and 'document' in user_input:
            self.final_document = user_input['document']
            logger.info(f"[{trace_id}] 已更新为用户编辑后的文档")
        
        # 标记为完成
        self.update_state(AgentState.COMPLETED, "文档结构化完成！")
        
        logger.info(f"[{trace_id}] 文档结构化流程完成")
        return {
            "status": "success",
            "step": "complete",
            "document": self.final_document,
            "trace_id": trace_id
        }

    # --------- 特殊处理 ---------
    def _handle_retry(self, data: dict, trace_id: str) -> dict:
        """处理重试操作"""
        if self.current_state == AgentState.FAILED:
            # 获取出错前的状态
            error_source = data.get('error_source') if data else None
            
            if error_source == "document_processing":
                # 文档处理错误，回到上传状态
                self.update_state(AgentState.AWAITING_UPLOAD, "请重新上传文档")
            elif error_source == "outline_analysis":
                # 大纲分析错误，回到文档提取完成状态
                self.update_state(AgentState.DOCUMENT_EXTRACTED, "文档已提取，请重新分析大纲")
            else:
                # 其他错误，使用状态回退
                previous_state = self.state_manager.rollback()
                if previous_state:
                    self.update_state(previous_state, f"已回退到 {previous_state.name} 状态")
                else:
                    # 无法回退，回到初始状态
                    self.update_state(AgentState.AWAITING_UPLOAD, "请重新上传文档")
            
            logger.info(f"[{trace_id}] 重试成功，当前状态: {self.current_state.value}")
            return {"status": "success", "message": "已重置，请继续操作", "trace_id": trace_id}
        
        return {"status": "error", "message": "当前状态不支持重试", "trace_id": trace_id} 

    def _handle_rollback(self, data: dict, trace_id: str) -> dict:
        """处理回退操作"""
        previous_state = self.state_manager.rollback()
        
        if previous_state:
            self.update_state(previous_state, f"已回退到 {previous_state.name} 状态")
            logger.info(f"[{trace_id}] 回退成功，当前状态: {self.current_state.value}")
            return {"status": "success", "message": "已回退到上一状态", "trace_id": trace_id}
        
        return {"status": "error", "message": "无法回退，没有更多历史状态", "trace_id": trace_id}
