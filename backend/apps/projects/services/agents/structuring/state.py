

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
from typing import Optional, Dict, Any

class StructuringState(str, Enum):
    """投标文档结构化处理的状态枚举"""
    AWAITING_UPLOAD = "awaiting_upload"
    EXTRACTING_DOCUMENT = "extracting_document"
    DOCUMENT_EXTRACTED = "document_extracted"
    ANALYZING_OUTLINE = "analyzing_outline"
    OUTLINE_ANALYZED = "outline_analyzed"  # 分析完成后直接进入注入步骤，不需要用户确认
    INJECTING_OUTLINE = "injecting_outline"
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
            cls.INJECTING_OUTLINE,
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
STATE_CONFIG: Dict[StructuringState, StateConfig] = {
    StructuringState.AWAITING_UPLOAD: StateConfig(
        requires_input=True,
        notification_type="info",
        default_message="请上传招标文件，开始文档结构化流程。",
        can_retry=True,
        persist=True
    ),
    StructuringState.EXTRACTING_DOCUMENT: StateConfig(
        requires_input=False,
        notification_type="loading",
        default_message="正在提取文档内容，请稍候...",
        persist=True
    ),
    StructuringState.DOCUMENT_EXTRACTED: StateConfig(
        requires_input=False,
        notification_type="success",
        default_message="文档提取完成，准备分析大纲...",
        can_retry=True,
        persist=True
    ),
    StructuringState.ANALYZING_OUTLINE: StateConfig(
        requires_input=False,
        notification_type="loading",
        default_message="正在分析文档大纲...",
        persist=True
    ),
    StructuringState.OUTLINE_ANALYZED: StateConfig(
        requires_input=False,  # 修改：不需要用户输入
        notification_type="success",
        default_message="大纲分析完成，正在准备注入...",
        can_retry=True,
        persist=True
    ),
    StructuringState.INJECTING_OUTLINE: StateConfig(
        requires_input=False,
        notification_type="loading",
        default_message="正在将大纲注入文档...",
        persist=True
    ),
    StructuringState.AWAITING_EDITING: StateConfig(
        requires_input=True,
        notification_type="success",
        default_message="大纲已注入，请在编辑器中查看和调整。",
        can_retry=True,
        persist=True
    ),
    StructuringState.COMPLETED: StateConfig(
        requires_input=False,
        notification_type="success",
        default_message="文档结构化完成！可以进入下一阶段了。",
        persist=True
    ),
    StructuringState.FAILED: StateConfig(
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