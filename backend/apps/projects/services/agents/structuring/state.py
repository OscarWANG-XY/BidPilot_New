# 类型	                                   描述	                                        示例    
# 等待用户输入（User Input Needed）	        系统暂停，等待用户操作才能继续	               上传文档、确认编辑
# 向用户沟通（User Notification Needed）	系统继续自动跑，但应该告诉用户正在做什么	    正在提取、正在分析、正在注入
# 无需沟通（Silent Background）	            很快且无感知，不需要打断用户	               极少，且可合并到上面的沟通里



# | 状态                    | 需要用户响应？ | 需要通知用户？ | 说明 |
# |:--|:--|:--|:--|
# | `AWAITING_UPLOAD`       | ✅ 是 | ✅ 是 | 告知用户需要上传文档 |
# | `EXTRACTING_DOCUMENT`   | ❌ 否 | ✅ 是 | 告知正在提取文档 |
# | `ANALYZING_OUTLINE`     | ❌ 否 | ✅ 是 | 告知正在分析大纲 |
# | `INJECTING_OUTLINE`     | ❌ 否 | ✅ 是 | 告知正在注入大纲到文档 |
# | `AWAITING_EDITING`      | ✅ 是 | ✅ 是 | 告知用户开始自由编辑文档 |
# | `COMPLETED`             | ❌ 否 | ✅ 是 | 告知结构化阶段完成 |
# | `FAILED`                | ❌ 否 | ✅ 是 | 通知任务失败，允许重试或查看错误日志 |

# 优雅版 StructuringAgent 通知策略
# | 状态 | 通知内容（示例） | 通知类型 |
# |:--|:--|:--|
# | `AWAITING_UPLOAD`       | "请上传招标文件，开始文档结构化流程。"    | Info |
# | `EXTRACTING_DOCUMENT`   | "正在提取文档内容，请稍候…"               | Loading |
# | `ANALYZING_OUTLINE`     | "正在分析文档大纲…"                       | Loading |
# | `INJECTING_OUTLINE`     | "正在将大纲注入文档…"                     | Loading |
# | `AWAITING_EDITING`      | "初步大纲已注入，请在编辑器中检查并调整。" | Success |
# | `COMPLETED`             | "文档结构化完成！可以进入下一阶段了。"    | Success |
# | `FAILED`                | "处理失败，请检查文档内容或联系管理员。" | Error |





from enum import Enum, auto
from dataclasses import dataclass
from typing import Optional, Dict, Any, List, Union

class AgentState(str, Enum):
    """投标文档结构化处理的状态枚举"""
    AWAITING_UPLOAD = "awaiting_upload"
    EXTRACTING_DOCUMENT = "extracting_document"
    DOCUMENT_EXTRACTED = "document_extracted"
    ANALYZING_OUTLINE = "analyzing_outline"
    OUTLINE_ANALYZED = "outline_analyzed"  # 分析完成后直接进入注入步骤，不需要用户确认
    # INJECTING_OUTLINE = "injecting_outline"
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
            cls.ANALYZING_OUTLINE,
            cls.OUTLINE_ANALYZED,
            # cls.INJECTING_OUTLINE,
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

@dataclass
class StateConfig:
    """状态配置，描述每个状态的属性"""
    requires_input: bool  # 是否需要用户输入
    notification_type: str  # 通知类型: 'info', 'loading', 'success', 'error'
    default_message: str  # 默认提示消息
    can_retry: bool = False  # 是否可以从此状态重试
    persist: bool = True  # 是否需要持久化此状态

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
    AgentState.ANALYZING_OUTLINE: StateConfig(
        requires_input=False,
        notification_type="loading",
        default_message="正在分析文档大纲...",
        persist=True
    ),
    AgentState.OUTLINE_ANALYZED: StateConfig(
        requires_input=False,  # 修改：不需要用户输入
        notification_type="success",
        default_message="大纲分析完成，正在准备注入...",
        can_retry=True,
        persist=True
    ),
    # AgentState.INJECTING_OUTLINE: StateConfig(
    #     requires_input=False,
    #     notification_type="loading",
    #     default_message="正在将大纲注入文档...",
    #     persist=True
    # ),
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

@dataclass
class ActionConfig:
    """操作配置，描述每个操作的属性"""
    description: str  # 操作描述
    valid_states: list[AgentState]  # 在哪些状态下可执行此操作
    requires_payload: bool = False  # 是否需要额外数据
    payload_schema: Optional[Dict[str, Any]] = None  # 数据格式要求

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
    ANALYZE = "analyze"
    # INJECT = "inject"
    COMPLETE = "complete"

@dataclass
class StepConfig:
    """步骤配置，描述每个处理步骤的属性"""
    description: str  # 步骤描述
    requires_user_action: bool  # 是否需要用户触发
    next_automatic_step: Optional['ProcessStep'] = None  # 自动执行的下一步
    valid_from_states: list[AgentState] = None  # 哪些状态可以执行此步骤

# 步骤配置表
STEP_CONFIG: Dict[ProcessStep, StepConfig] = {
    ProcessStep.EXTRACT: StepConfig(
        description="提取文档内容",
        requires_user_action=True,
        next_automatic_step=ProcessStep.ANALYZE,
        valid_from_states=[AgentState.AWAITING_UPLOAD]
    ),
    ProcessStep.ANALYZE: StepConfig(
        description="分析文档大纲",
        requires_user_action=False,
        # next_automatic_step=ProcessStep.INJECT,
        next_automatic_step=None,
        valid_from_states=[AgentState.DOCUMENT_EXTRACTED]
    ),
    # ProcessStep.INJECT: StepConfig(
    #     description="注入大纲到文档",
    #     requires_user_action=False,
    #     next_automatic_step=None,
    #     valid_from_states=[AgentState.OUTLINE_ANALYZED]
    # ),
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
    AgentState.DOCUMENT_EXTRACTED: ProcessStep.ANALYZE,
    # AgentState.OUTLINE_ANALYZED: ProcessStep.INJECT,
    AgentState.AWAITING_EDITING: ProcessStep.COMPLETE
}



# --------- 数据模型定义 ---------

@dataclass
class AgentMessage:
    """Agent发送给前端的消息格式"""
    message: str  # 显示给用户的消息
    state: str  # 当前状态
    notification_type: str  # 通知类型: 'info', 'loading', 'success', 'error'
    data: Dict[str, Any]  # 附加数据
    requires_input: bool  # 是否需要用户输入
    timestamp: str  # ISO格式的时间戳

@dataclass
class DocumentData:
    """文档相关数据结构"""
    content: Dict[str, Any]  # Tiptap JSON格式的文档内容
    metadata: Dict[str, Any] = None  # 文档元数据


@dataclass
class UserActionPayload:
    """用户操作的数据载荷基类"""
    pass

@dataclass
class UploadDocumentPayload(UserActionPayload):
    """上传文档操作的数据载荷"""
    # # 不需要任何字段，因为文件已经通过其他方式上传并关联到项目
    # file_id: str  # 文件ID
    # file_name: str = None  # 文件名称
    pass

@dataclass
class CompleteEditingPayload(UserActionPayload):
    """完成编辑操作的数据载荷"""
    document: Dict[str, Any]  # 编辑后的文档内容

@dataclass
class RetryPayload(UserActionPayload):
    """重试操作的数据载荷"""
    error_source: str = None  # 错误来源，用于确定重试点

@dataclass
class UserActionRequest:
    """用户发送给Agent的请求格式"""
    action: str  # 操作类型
    payload: Optional[Dict[str, Any]] = None  # 操作数据

@dataclass
class AgentResponse:
    """Agent处理用户请求后的响应格式"""
    status: str  # 'success' 或 'error'
    message: str  # 响应消息
    state: Optional[str] = None  # 当前状态
    data: Optional[Dict[str, Any]] = None  # 响应数据
    requires_input: bool = False  # 是否需要用户输入
    trace_id: Optional[str] = None  # 用于日志追踪的ID

# --------- WebSocket消息格式 ---------

@dataclass
class WebSocketMessage:
    """WebSocket消息基类"""
    pass

@dataclass
class InitialStateMessage(WebSocketMessage):
    """初始状态消息"""
    message: str  # "已连接到服务器"
    state: str  # 当前状态
    data: Dict[str, Any]  # 状态相关数据
    requires_input: bool  # 是否需要用户输入

@dataclass
class ErrorMessage(WebSocketMessage):
    """错误消息"""
    status: str  # 'error'
    message: str  # 错误描述

# --------- 状态转换和数据流 ---------

# 定义每个状态可能包含的数据类型
STATE_DATA_TYPES = {
    AgentState.AWAITING_UPLOAD: None or UploadDocumentPayload,  # 无需特定数据, 这里UploadDocumentPayload为空
    AgentState.EXTRACTING_DOCUMENT: None,  # 无需特定数据
    AgentState.DOCUMENT_EXTRACTED: None,  # 可以包含文档元数据
    AgentState.ANALYZING_OUTLINE: None,  # 无需特定数据
    AgentState.OUTLINE_ANALYZED: None,  # 无需特定数据
    # AgentState.INJECTING_OUTLINE: None,  # 无需特定数据
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






# 作用：
    # ACTION_TO_STEP：将用户操作转换为系统内部步骤
    # STATE_TO_STEP：根据当前状态确定下一个应该执行的步骤

# 系统流程示例

# 让我们通过一个具体的流程来说明这些组件如何协同工作：
# 1. 初始状态：系统处于 AWAITING_UPLOAD 状态
    # 根据 STATE_CONFIG，这个状态需要用户输入 (requires_input=True)
    # 前端显示上传按钮，等待用户操作
# 2. 用户操作：用户点击"上传文档"按钮，执行 UPLOAD_DOCUMENT 操作
    # 系统检查 ACTION_CONFIG 确认此操作在当前状态下是合法的
    # 使用 ACTION_TO_STEP 将此操作映射到 EXTRACT 步骤
# 3. 执行步骤：系统执行 EXTRACT 步骤
    # 状态变更为 EXTRACTING_DOCUMENT
    # 执行文档提取逻辑
    # 提取完成后，状态变更为 DOCUMENT_EXTRACTED
# 4. 自动流转：系统检查 STATE_TO_STEP 映射
    # 发现 DOCUMENT_EXTRACTED 状态对应 ANALYZE 步骤
    # 自动执行 ANALYZE 步骤，无需用户干预
    # 状态变更为 ANALYZING_OUTLINE，然后是 OUTLINE_ANALYZED
# 5. 继续自动流转：系统再次检查 STATE_TO_STEP 映射
    # 发现 OUTLINE_ANALYZED 状态对应 INJECT 步骤
    # 自动执行 INJECT 步骤
    # 状态变更为 INJECTING_OUTLINE，然后是 AWAITING_EDITING
# 6. 等待用户操作：系统处于 AWAITING_EDITING 状态
    # 根据 STATE_CONFIG，这个状态需要用户输入
    # 前端显示编辑界面，等待用户完成编辑
# 7. 用户操作：用户点击"完成编辑"按钮，执行 COMPLETE_EDITING 操作
    # 系统使用 ACTION_TO_STEP 将此操作映射到 COMPLETE 步骤
    # 执行 COMPLETE 步骤，状态变更为 COMPLETED