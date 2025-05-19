# state.py 文件用于定义状态枚举、状态配置、状态处理逻辑等
# 从django迁移过来后，@dataclass 被替换为 BaseModel， 而BaseModel会执行每次调用实例的字段验证。 


from enum import Enum, auto
from dataclasses import dataclass
from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel, Field

class AgentState(str, Enum):
    """投标文档结构化处理的状态枚举"""
    AWAITING_UPLOAD = "awaiting_upload"
    EXTRACTING_DOCUMENT = "extracting_document"
    DOCUMENT_EXTRACTED = "document_extracted"
    ANALYZING_OUTLINE_H1 = "analyzing_outline_h1"
    OUTLINE_H1_ANALYZED = "outline_h1_analyzed"
    ANALYZING_OUTLINE_H2H3 = "analyzing_outline_h2h3"
    OUTLINE_H2H3_ANALYZED = "outline_h2h3_analyzed"
    ADDING_INTRODUCTION = "adding_introduction"
    INTRODUCTION_ADDED = "introduction_added"
    AWAITING_EDITING = "awaiting_editing"
    COMPLETED = "completed"
    FAILED = "failed"
    
    @classmethod
    def get_previous_state(cls, current_state):
        """获取当前状态的上一个状态，用于错误恢复"""
        states_flow = [
            cls.AWAITING_UPLOAD,
            cls.EXTRACTING_DOCUMENT,
            cls.DOCUMENT_EXTRACTED,
            cls.ANALYZING_OUTLINE_H1,
            cls.OUTLINE_H1_ANALYZED,
            cls.ANALYZING_OUTLINE_H2H3,
            cls.OUTLINE_H2H3_ANALYZED,
            cls.ADDING_INTRODUCTION,
            cls.INTRODUCTION_ADDED,
            cls.AWAITING_EDITING,
            cls.COMPLETED
        ]
        
        if current_state == cls.FAILED:
            return None  # 失败状态需要特殊处理
            
        try:
            current_index = states_flow.index(current_state)
            if current_index > 0:
                return states_flow[current_index - 1]
        except ValueError:
            pass
            
        return cls.AWAITING_UPLOAD  # 默认回到初始状态

class StateConfig(BaseModel):
    """状态配置，描述每个状态的属性"""
    requires_input: bool = Field(description="是否需要用户输入")
    notification_type: str = Field(description="通知类型: 'info', 'loading', 'success', 'error'")
    default_message: str = Field(description="默认提示消息")
    can_retry: bool = Field(description="是否可以从此状态重试")
    persist: bool = Field(description="是否需要持久化此状态")

# 状态配置表，用于控制状态行为和UI展示
STATE_CONFIG: Dict[AgentState, StateConfig] = {
    AgentState.AWAITING_UPLOAD: StateConfig(
        requires_input=True,
        notification_type="info",
        default_message="请上传招标文件，开始文档结构化流程。",
        can_retry=True,
        persist=True
    ),
    AgentState.EXTRACTING_DOCUMENT: StateConfig(
        requires_input=False,
        notification_type="loading",
        default_message="正在提取文档内容，请稍候...",
        persist=True
    ),
    AgentState.DOCUMENT_EXTRACTED: StateConfig(
        requires_input=False,
        notification_type="success",
        default_message="文档提取完成，准备分析大纲...",
        can_retry=True,
        persist=True
    ),
    AgentState.ANALYZING_OUTLINE_H1: StateConfig(
        requires_input=False,
        notification_type="loading",
        default_message="正在分析一级标题...",
        persist=True
    ),
    AgentState.OUTLINE_H1_ANALYZED: StateConfig(
        requires_input=False,
        notification_type="success",
        default_message="一级标题分析完成，准备分析二级标题...",
        persist=True
    ),
    AgentState.ANALYZING_OUTLINE_H2H3: StateConfig(
        requires_input=False,
        notification_type="loading",
        default_message="正在分析二级标题...",
        persist=True
    ),
    AgentState.OUTLINE_H2H3_ANALYZED: StateConfig(
        requires_input=False,
        notification_type="success",
        default_message="二级标题分析完成，准备添加引言...",
        persist=True
    ),
    AgentState.ADDING_INTRODUCTION: StateConfig(
        requires_input=False,
        notification_type="loading",
        default_message="正在添加引言...",
        persist=True
    ),
    AgentState.INTRODUCTION_ADDED: StateConfig(
        requires_input=False,
        notification_type="success",
        default_message="引言添加完成，准备完成编辑...",
        persist=True
    ),
    
    AgentState.AWAITING_EDITING: StateConfig(
        requires_input=True,
        notification_type="success",
        default_message="大纲已注入，请在编辑器中查看和调整。",
        can_retry=True,
        persist=True
    ),
    AgentState.COMPLETED: StateConfig(
        requires_input=False,
        notification_type="success",
        default_message="文档结构化完成！可以进入下一阶段了。",
        persist=True
    ),
    AgentState.FAILED: StateConfig(
        requires_input=False,
        notification_type="error",
        default_message="处理失败，请检查文档内容或联系管理员。",
        can_retry=True,
        persist=True
    )
}

class StateError(Exception):
    """状态处理过程中的异常基类"""
    pass

class InvalidStateTransitionError(StateError):
    """无效的状态转换异常"""
    pass

class DocumentProcessingError(StateError):
    """文档处理异常"""
    pass

class OutlineAnalysisError(StateError):
    """大纲分析异常"""
    pass

class UserAction(str, Enum):
    """用户可以执行的操作枚举"""
    DOCUMENT_UPLOADED = "document_uploaded"
    COMPLETE_EDITING = "complete_editing"
    RETRY = "retry"
    ROLLBACK = "rollback"
    GET_STATUS = "get_status"


class ActionConfig(BaseModel):
    """操作配置，描述每个操作的属性"""
    description: str = Field(description="操作描述")
    valid_states: list[AgentState] = Field(description="在哪些状态下可执行此操作")
    requires_payload: bool = Field(description="是否需要额外数据")
    payload_schema: Optional[Dict[str, Any]] = Field(description="数据格式要求")

# 操作配置表，用于控制操作行为和验证
ACTION_CONFIG: Dict[UserAction, ActionConfig] = {
    UserAction.DOCUMENT_UPLOADED: ActionConfig(
        description="上传文档并开始处理",
        valid_states=[AgentState.AWAITING_UPLOAD, AgentState.FAILED],
        requires_payload=False # 不需要payload
    ),
    UserAction.COMPLETE_EDITING: ActionConfig(
        description="完成编辑并标记为完成",
        valid_states=[AgentState.AWAITING_EDITING],
        requires_payload=True
    ),
    UserAction.RETRY: ActionConfig(
        description="重试失败的操作",
        valid_states=[AgentState.FAILED],
        requires_payload=False
    ),
    UserAction.ROLLBACK: ActionConfig(
        description="回退到上一个状态",
        valid_states=[s for s in AgentState],  # 所有状态都可以回退
        requires_payload=False
    ),
    UserAction.GET_STATUS: ActionConfig(
        description="获取当前状态",
        valid_states=[s for s in AgentState],  # 所有状态都可以获取
        requires_payload=False
    )
}

class ProcessStep(str, Enum):
    """系统内部处理步骤枚举"""
    EXTRACT = "extract"
    ANALYZE_OUTLINE_H1 = "analyze_outline_h1"
    ANALYZE_OUTLINE_H2H3 = "analyze_outline_h2h3"
    ADD_INTRODUCTION = "add_introduction"
    COMPLETE = "complete"

class StepConfig(BaseModel):
    """步骤配置，描述每个处理步骤的属性"""
    description: str = Field(description="步骤描述")
    requires_user_action: bool = Field(description="是否需要用户触发")
    next_automatic_step: Optional["ProcessStep"] = Field(description="自动执行的下一步")
    valid_from_states: list[AgentState] = Field(description="哪些状态可以执行此步骤")

# 步骤配置表
STEP_CONFIG: Dict[ProcessStep, StepConfig] = {
    ProcessStep.EXTRACT: StepConfig(
        description="提取文档内容",
        requires_user_action=True,
        next_automatic_step=ProcessStep.ANALYZE_OUTLINE_H1,
        valid_from_states=[AgentState.AWAITING_UPLOAD]
    ),
    ProcessStep.ANALYZE_OUTLINE_H1: StepConfig(
        description="分析一级标题",
        requires_user_action=False,
        next_automatic_step=ProcessStep.ANALYZE_OUTLINE_H2H3,
        valid_from_states=[AgentState.DOCUMENT_EXTRACTED]
    ),
    ProcessStep.ANALYZE_OUTLINE_H2H3: StepConfig(
        description="分析二级标题",
        requires_user_action=False,
        next_automatic_step=ProcessStep.ADD_INTRODUCTION,
        valid_from_states=[AgentState.OUTLINE_H1_ANALYZED]
    ),
    ProcessStep.ADD_INTRODUCTION: StepConfig(
        description="添加引言",
        requires_user_action=False,
        next_automatic_step=ProcessStep.COMPLETE,
        valid_from_states=[AgentState.OUTLINE_H2H3_ANALYZED]
    ),

    ProcessStep.COMPLETE: StepConfig(
        description="完成编辑",
        requires_user_action=True,
        next_automatic_step=None,
        valid_from_states=[AgentState.AWAITING_EDITING]
    )
}

# 用户操作到处理步骤的映射
ACTION_TO_STEP: Dict[UserAction, ProcessStep] = {
    UserAction.DOCUMENT_UPLOADED: ProcessStep.EXTRACT,
    UserAction.COMPLETE_EDITING: ProcessStep.COMPLETE
}

# 状态到处理步骤的映射
STATE_TO_STEP: Dict[AgentState, ProcessStep] = {
    AgentState.AWAITING_UPLOAD: ProcessStep.EXTRACT,
    AgentState.DOCUMENT_EXTRACTED: ProcessStep.ANALYZE_OUTLINE_H1,
    AgentState.OUTLINE_H1_ANALYZED: ProcessStep.ANALYZE_OUTLINE_H2H3,
    AgentState.OUTLINE_H2H3_ANALYZED: ProcessStep.ADD_INTRODUCTION,
    AgentState.AWAITING_EDITING: ProcessStep.COMPLETE
}



# --------- 数据模型定义 ---------

class AgentMessage(BaseModel):
    """Agent发送给前端的消息格式"""
    message: str = Field(description="显示给用户的消息")
    state: str = Field(description="当前状态")
    notification_type: str = Field(description="通知类型: 'info', 'loading', 'success', 'error'")
    data: Dict[str, Any] = Field(description="附加数据")
    requires_input: bool = Field(description="是否需要用户输入")
    timestamp: str = Field(description="ISO格式的时间戳")
    status: str = Field(default="success", description="处理状态")
    step: Optional[str] = Field(description="当前步骤")
    next_step: Optional[str] = Field(description="下一步")

class DocumentData(BaseModel):
    """文档相关数据结构"""
    content: Dict[str, Any] = Field(description="Tiptap JSON格式的文档内容")
    metadata: Dict[str, Any] = Field(default=None, description="文档元数据")


class UserActionPayload(BaseModel):
    """用户操作的数据载荷基类"""
    pass

class UploadDocumentPayload(UserActionPayload):
    """上传文档操作的数据载荷"""
    # # 不需要任何字段，因为文件已经通过其他方式上传并关联到项目
    # file_id: str  # 文件ID
    # file_name: str = None  # 文件名称
    pass

class CompleteEditingPayload(UserActionPayload):
    """完成编辑操作的数据载荷"""
    document: DocumentData = Field(description="文档数据")

class RetryPayload(UserActionPayload):
    """重试操作的数据载荷"""
    error_source: str = None  # 错误来源，用于确定重试点

class UserActionRequest(BaseModel):
    """用户发送给Agent的请求格式"""
    action: str = Field(description="操作类型")
    payload: Optional[Dict[str, Any]] = Field(default=None, description="操作数据")

class AgentResponse(BaseModel):
    """Agent处理用户请求后的响应格式"""
    status: str = Field(description="'success' 或 'error'")
    message: str = Field(description="响应消息")
    state: Optional[str] = Field(default=None, description="当前状态")
    data: Optional[Dict[str, Any]] = Field(default=None, description="响应数据")
    requires_input: bool = Field(default=False, description="是否需要用户输入")
    trace_id: Optional[str] = Field(default=None, description="用于日志追踪的ID")

# --------- WebSocket消息格式 ---------

class WebSocketMessage(BaseModel):
    """WebSocket消息基类"""
    pass

class InitialStateMessage(WebSocketMessage):
    """初始状态消息"""
    message: str = Field(description="已连接到服务器")
    state: str = Field(description="当前状态")
    data: Dict[str, Any] = Field(description="状态相关数据")
    requires_input: bool = Field(description="是否需要用户输入")

class ErrorMessage(WebSocketMessage):
    """错误消息"""
    status: str = Field(description="'error'")
    message: str = Field(description="错误描述")

# --------- 状态转换和数据流 ---------

# 定义每个状态可能包含的数据类型
STATE_DATA_TYPES = {
    AgentState.AWAITING_UPLOAD: None or UploadDocumentPayload,  # 无需特定数据, 这里UploadDocumentPayload为空
    AgentState.EXTRACTING_DOCUMENT: None,  # 无需特定数据
    AgentState.DOCUMENT_EXTRACTED: None,  # 可以包含文档元数据
    AgentState.ANALYZING_OUTLINE_H1: None,  # 无需特定数据
    AgentState.OUTLINE_H1_ANALYZED: None,  # 无需特定数据
    AgentState.ANALYZING_OUTLINE_H2H3: None,  # 无需特定数据
    AgentState.OUTLINE_H2H3_ANALYZED: None,  # 无需特定数据
    AgentState.ADDING_INTRODUCTION: None,  # 无需特定数据
    AgentState.INTRODUCTION_ADDED: None,  # 无需特定数据
    AgentState.AWAITING_EDITING: DocumentData,  # 包含注入大纲后的文档
    AgentState.COMPLETED: DocumentData,  # 包含最终文档
    AgentState.FAILED: Dict[str, Any]  # 包含错误信息
}

# 定义每个用户操作需要的数据类型
ACTION_PAYLOAD_TYPES = {
    UserAction.DOCUMENT_UPLOADED: None, # 不需要payload
    UserAction.COMPLETE_EDITING: CompleteEditingPayload,
    UserAction.RETRY: RetryPayload,
    UserAction.ROLLBACK: None,  # 无需特定数据
    UserAction.GET_STATUS: None  # 无需特定数据
}




