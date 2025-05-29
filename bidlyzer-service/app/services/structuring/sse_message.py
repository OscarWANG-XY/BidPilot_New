from enum import Enum
from typing import Optional, Dict, Any, List, Union, Callable, Type
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from functools import wraps
import logging
from .state import SystemInternalState, UserVisibleState, ProcessingStep, StateRegistry

logger = logging.getLogger(__name__)


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


class SSEMessageRecord(BaseModel):
    """SSE消息记录模型"""
    #定义了序列化时，对于datetime类型的处理方式， 这个是pydantic v2的语法
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    message_id: str = Field(description="消息唯一标识")
    project_id: str = Field(description="项目ID")
    event_type: str = Field(description="事件类型: state_update, processing_progress, error")
    event_data: Dict[str, Any] = Field(description="事件数据内容")

    timestamp: datetime = Field(default_factory=datetime.now, description="消息时间戳")


class SSEMessageHistory(BaseModel):
    """SSE消息历史记录"""
    #定义了序列化时，对于datetime类型的处理方式， 这个是pydantic v2的语法
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    project_id: str
    messages: List[SSEMessageRecord] = Field(default_factory=list)
    total_messages: int = Field(default=0)
    last_updated: datetime = Field(default_factory=datetime.now)


