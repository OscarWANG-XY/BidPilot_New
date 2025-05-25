# state_v2.py - 优化版状态管理系统
# 解决复杂度、一致性维护、框架适配等问题

from enum import Enum
from typing import Optional, Dict, Any, List, Union, Callable, Type
from pydantic import BaseModel, Field
from datetime import datetime
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# ========================= 双层状态设计 =========================

class UserVisibleState(str, Enum):
    """用户可见的简化状态 - 4个主要阶段"""
    PROCESSING = "processing"      # 智能分析处理阶段（从文档提取开始）
    EDITING = "editing"           # 用户编辑阶段
    COMPLETED = "completed"       # 完成状态
    FAILED = "failed"            # 失败状态

class SystemInternalState(str, Enum):
    """系统内部的细粒度状态 - 用于精确控制处理流程"""
    # 微服务从文档提取开始，文件上传由Django处理
    EXTRACTING_DOCUMENT = "extracting_document"
    DOCUMENT_EXTRACTED = "document_extracted"
    ANALYZING_OUTLINE_H1 = "analyzing_outline_h1"
    OUTLINE_H1_ANALYZED = "outline_h1_analyzed"
    ANALYZING_OUTLINE_H2H3 = "analyzing_outline_h2h3"
    OUTLINE_H2H3_ANALYZED = "outline_h2h3_analyzed"
    ADDING_INTRODUCTION = "adding_introduction"
    INTRODUCTION_ADDED = "introduction_added"
    AWAITING_EDITING = "awaiting_editing"
    EDITING_IN_PROGRESS = "editing_in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

# 内部状态到用户可见状态的映射
INTERNAL_TO_USER_STATE_MAP = {
    SystemInternalState.EXTRACTING_DOCUMENT: UserVisibleState.PROCESSING,
    SystemInternalState.DOCUMENT_EXTRACTED: UserVisibleState.PROCESSING,
    SystemInternalState.ANALYZING_OUTLINE_H1: UserVisibleState.PROCESSING,
    SystemInternalState.OUTLINE_H1_ANALYZED: UserVisibleState.PROCESSING,
    SystemInternalState.ANALYZING_OUTLINE_H2H3: UserVisibleState.PROCESSING,
    SystemInternalState.OUTLINE_H2H3_ANALYZED: UserVisibleState.PROCESSING,
    SystemInternalState.ADDING_INTRODUCTION: UserVisibleState.PROCESSING,
    SystemInternalState.INTRODUCTION_ADDED: UserVisibleState.PROCESSING,
    SystemInternalState.AWAITING_EDITING: UserVisibleState.EDITING,
    SystemInternalState.EDITING_IN_PROGRESS: UserVisibleState.EDITING,
    SystemInternalState.COMPLETED: UserVisibleState.COMPLETED,
    SystemInternalState.FAILED: UserVisibleState.FAILED,
}

# ========================= 统一配置系统 =========================

class StateMetadata(BaseModel):
    """状态元数据 - 统一配置"""
    # 用户体验相关
    display_name: str = Field(description="显示名称")
    description: str = Field(description="状态描述")
    notification_type: str = Field(description="通知类型: info/loading/success/error")
    
    # 业务逻辑相关
    requires_user_input: bool = Field(default=False, description="是否需要用户输入")
    can_retry: bool = Field(default=False, description="是否可重试")
    is_terminal: bool = Field(default=False, description="是否为终止状态")
    
    # 处理相关
    auto_transition: bool = Field(default=False, description="是否自动转换")
    next_state: Optional[SystemInternalState] = Field(default=None, description="下一个状态")
    estimated_duration: Optional[int] = Field(default=None, description="预估耗时(秒)")

class ProcessingStep(str, Enum):
    """处理步骤枚举"""
    EXTRACT = "extract"
    ANALYZE_H1 = "analyze_h1"
    ANALYZE_H2H3 = "analyze_h2h3"
    ADD_INTRODUCTION = "add_introduction"
    COMPLETE_EDITING = "complete_editing"

class UserAction(str, Enum):
    """用户操作枚举 - 移除upload_document，因为上传在Django完成"""
    COMPLETE_EDITING = "complete_editing"
    RETRY = "retry"
    CANCEL = "cancel"

# ========================= 自动化配置注册 =========================

class StateRegistry:
    """状态注册器 - 自动化配置管理"""
    
    _state_configs: Dict[SystemInternalState, StateMetadata] = {}
    _step_configs: Dict[ProcessingStep, Dict[str, Any]] = {}
    _action_configs: Dict[UserAction, Dict[str, Any]] = {}
    
    @classmethod
    def register_state(cls, state: SystemInternalState):
        """状态注册装饰器"""
        # docorator 以 config_func为参数
        # config_func 无输入，而输出StateMetadata， 这个函数的作用是获取配置元信息
        # decorator里，将config_func 的输出， 赋值给 cls._state_configs[state]进行存储
        # 最后返回config_func， 允许被装饰的函数保持原样。 
        def decorator(config_func: Callable[[], StateMetadata]):
            cls._state_configs[state] = config_func()
            return config_func
        return decorator
    
    @classmethod
    def register_step(cls, step: ProcessingStep):
        """步骤注册装饰器"""
        def decorator(config_func: Callable[[], Dict[str, Any]]):
            cls._step_configs[step] = config_func()
            return config_func
        return decorator
    
    @classmethod
    def register_action(cls, action: UserAction):
        """操作注册装饰器"""
        def decorator(config_func: Callable[[], Dict[str, Any]]):
            cls._action_configs[action] = config_func()
            return config_func
        return decorator
    
    @classmethod
    def get_state_config(cls, state: SystemInternalState) -> StateMetadata:
        """获取状态配置"""
        return cls._state_configs.get(state)
    
    @classmethod
    def get_step_config(cls, step: ProcessingStep) -> Dict[str, Any]:
        """获取步骤配置"""
        return cls._step_configs.get(step, {})
    
    @classmethod
    def get_action_config(cls, action: UserAction) -> Dict[str, Any]:
        """获取操作配置"""
        return cls._action_configs.get(action, {})

# ========================= 配置定义（使用装饰器自动注册）=========================

# 状态配置 - 从文档提取开始
@StateRegistry.register_state(SystemInternalState.EXTRACTING_DOCUMENT)
def _extracting_document_config():
    return StateMetadata(
        display_name="提取文档",
        description="正在提取文档内容...",
        notification_type="loading",
        auto_transition=True,
        next_state=SystemInternalState.DOCUMENT_EXTRACTED,
        estimated_duration=30
    )

@StateRegistry.register_state(SystemInternalState.DOCUMENT_EXTRACTED)
def _document_extracted_config():
    return StateMetadata(
        display_name="文档提取完成",
        description="文档提取完成，开始智能分析",
        notification_type="success",
        auto_transition=True,
        next_state=SystemInternalState.ANALYZING_OUTLINE_H1,
        estimated_duration=5
    )

@StateRegistry.register_state(SystemInternalState.ANALYZING_OUTLINE_H1)
def _analyzing_h1_config():
    return StateMetadata(
        display_name="分析主要章节",
        description="正在分析文档主要章节结构...",
        notification_type="loading",
        auto_transition=True,
        next_state=SystemInternalState.OUTLINE_H1_ANALYZED,
        estimated_duration=45
    )

@StateRegistry.register_state(SystemInternalState.OUTLINE_H1_ANALYZED)
def _h1_analyzed_config():
    return StateMetadata(
        display_name="主要章节分析完成",
        description="主要章节分析完成，开始细化子章节",
        notification_type="success",
        auto_transition=True,
        next_state=SystemInternalState.ANALYZING_OUTLINE_H2H3,
        estimated_duration=5
    )

@StateRegistry.register_state(SystemInternalState.ANALYZING_OUTLINE_H2H3)
def _analyzing_h2h3_config():
    return StateMetadata(
        display_name="分析子章节",
        description="正在分析文档子章节结构...",
        notification_type="loading",
        auto_transition=True,
        next_state=SystemInternalState.OUTLINE_H2H3_ANALYZED,
        estimated_duration=60
    )

@StateRegistry.register_state(SystemInternalState.OUTLINE_H2H3_ANALYZED)
def _h2h3_analyzed_config():
    return StateMetadata(
        display_name="子章节分析完成",
        description="子章节分析完成，开始添加引言",
        notification_type="success",
        auto_transition=True,
        next_state=SystemInternalState.ADDING_INTRODUCTION,
        estimated_duration=5
    )

@StateRegistry.register_state(SystemInternalState.ADDING_INTRODUCTION)
def _adding_introduction_config():
    return StateMetadata(
        display_name="添加引言",
        description="正在为文档添加引言部分...",
        notification_type="loading",
        auto_transition=True,
        next_state=SystemInternalState.INTRODUCTION_ADDED,
        estimated_duration=30
    )

@StateRegistry.register_state(SystemInternalState.INTRODUCTION_ADDED)
def _introduction_added_config():
    return StateMetadata(
        display_name="引言添加完成",
        description="文档结构化完成，请进行编辑",
        notification_type="success",
        auto_transition=True,
        next_state=SystemInternalState.AWAITING_EDITING,
        estimated_duration=5
    )

@StateRegistry.register_state(SystemInternalState.AWAITING_EDITING)
def _awaiting_editing_config():
    return StateMetadata(
        display_name="等待编辑",
        description="文档已准备就绪，请在编辑器中查看和调整",
        notification_type="success",
        requires_user_input=True,
        can_retry=True
    )

@StateRegistry.register_state(SystemInternalState.EDITING_IN_PROGRESS)
def _editing_in_progress_config():
    return StateMetadata(
        display_name="编辑中",
        description="用户正在编辑文档",
        notification_type="info"
    )

@StateRegistry.register_state(SystemInternalState.COMPLETED)
def _completed_config():
    return StateMetadata(
        display_name="处理完成",
        description="文档结构化和编辑已完成",
        notification_type="success",
        is_terminal=True
    )

@StateRegistry.register_state(SystemInternalState.FAILED)
def _failed_config():
    return StateMetadata(
        display_name="处理失败",
        description="处理过程中出现错误",
        notification_type="error",
        can_retry=True,
        is_terminal=True
    )

# 步骤配置 - 调整为从文档提取开始
@StateRegistry.register_step(ProcessingStep.EXTRACT)
def _extract_step_config():
    return {
        "description": "提取文档内容",
        "required_states": [],  # 初始状态，无前置要求
        "target_state": SystemInternalState.EXTRACTING_DOCUMENT,
        "user_triggered": False  # 由start_analysis自动触发
    }

@StateRegistry.register_step(ProcessingStep.ANALYZE_H1)
def _analyze_h1_step_config():
    return {
        "description": "分析一级标题",
        "required_states": [SystemInternalState.DOCUMENT_EXTRACTED],
        "target_state": SystemInternalState.ANALYZING_OUTLINE_H1,
        "user_triggered": False
    }

@StateRegistry.register_step(ProcessingStep.ANALYZE_H2H3)
def _analyze_h2h3_step_config():
    return {
        "description": "分析二三级标题",
        "required_states": [SystemInternalState.OUTLINE_H1_ANALYZED],
        "target_state": SystemInternalState.ANALYZING_OUTLINE_H2H3,
        "user_triggered": False
    }

@StateRegistry.register_step(ProcessingStep.ADD_INTRODUCTION)
def _add_introduction_step_config():
    return {
        "description": "添加引言",
        "required_states": [SystemInternalState.OUTLINE_H2H3_ANALYZED],
        "target_state": SystemInternalState.ADDING_INTRODUCTION,
        "user_triggered": False
    }

@StateRegistry.register_step(ProcessingStep.COMPLETE_EDITING)
def _complete_editing_step_config():
    return {
        "description": "完成编辑",
        "required_states": [SystemInternalState.AWAITING_EDITING, SystemInternalState.EDITING_IN_PROGRESS],
        "target_state": SystemInternalState.COMPLETED,
        "user_triggered": True
    }

# 操作配置 - 移除upload_document
@StateRegistry.register_action(UserAction.COMPLETE_EDITING)
def _complete_editing_action_config():
    return {
        "description": "完成编辑",
        "valid_states": [SystemInternalState.AWAITING_EDITING, SystemInternalState.EDITING_IN_PROGRESS],
        "target_step": ProcessingStep.COMPLETE_EDITING,
        "requires_payload": True
    }

@StateRegistry.register_action(UserAction.RETRY)
def _retry_action_config():
    return {
        "description": "重试操作",
        "valid_states": [SystemInternalState.FAILED],
        "requires_payload": False
    }

@StateRegistry.register_action(UserAction.CANCEL)
def _cancel_action_config():
    return {
        "description": "取消操作",
        "valid_states": [state for state in SystemInternalState if state not in [SystemInternalState.COMPLETED, SystemInternalState.FAILED]],
        "requires_payload": False
    }

# ========================= FastAPI适配的数据模型 =========================

# 定义了SSEMessage的结构 
class SSEMessage(BaseModel):
    """SSE消息格式 - 适配Redis推送"""
    event: str = Field(description="事件类型")
    data: Dict[str, Any] = Field(description="消息数据")
    timestamp: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# 状态更新事件， 继承了SSEMessage，内部会格式化为SSE协议需要的格式。 
class StateUpdateEvent(SSEMessage):
    """状态更新事件"""
    event: str = "state_update"  # SSE 协议要求指定事件名。 
    
    def __init__(self, 
                 project_id: str,
                 internal_state: SystemInternalState,
                 user_state: UserVisibleState,
                 progress: int = 0,
                 message: str = "",
                 **kwargs):
        super().__init__(
            data={
                "project_id": project_id,
                "internal_state": internal_state.value,
                "user_state": user_state.value,
                "progress": progress,
                "message": message,
                "config": StateRegistry.get_state_config(internal_state).model_dump() if StateRegistry.get_state_config(internal_state) else {},
                **kwargs
            }
        )

class ProcessingProgressEvent(SSEMessage):
    """处理进度事件"""
    event: str = "processing_progress"
    
    def __init__(self, 
                 project_id: str,
                 step: ProcessingStep,
                 progress: int,
                 estimated_remaining: Optional[int] = None,
                 **kwargs):
        super().__init__(
            data={
                "project_id": project_id,
                "step": step.value,
                "progress": progress,
                "estimated_remaining": estimated_remaining,
                **kwargs
            }
        )

class ErrorEvent(SSEMessage):
    """错误事件"""
    event: str = "error"
    
    def __init__(self, 
                 project_id: str,
                 error_type: str,
                 error_message: str,
                 can_retry: bool = False,
                 **kwargs):
        super().__init__(
            data={
                "project_id": project_id,
                "error_type": error_type,
                "error_message": error_message,
                "can_retry": can_retry,
                **kwargs
            }
        )

# ========================= 异常定义 =========================

class StateTransitionError(Exception):
    """状态转换异常"""
    pass

class InvalidActionError(Exception):
    """无效操作异常"""
    pass

class ProcessingError(Exception):
    """处理异常"""
    pass 