# state_manager_v2.py - FastAPI集成的状态管理器
# 提供状态转换、事件发布和Redis集成功能

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from .state import SystemInternalState, UserVisibleState, ProcessingStep, StateRegistry

import logging
logger = logging.getLogger(__name__)

# ========================= 状态数据模型 =========================

class AgentStateData(BaseModel):
    """Agent状态数据模型"""
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    project_id: str
    current_internal_state: SystemInternalState   # 每个state 都有对应的state_config在state.py中定义了。 
    current_user_state: UserVisibleState          
    
    # 进度相关
    overall_progress: int = Field(default=0, ge=0, le=100)
    step_progress: Dict[ProcessingStep, int] = Field(default_factory=dict)
    
    # 时间戳
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 处理相关
    current_step: Optional[ProcessingStep] = None       
    error_message: Optional[str] = None
    retry_count: int = 0
    

class AgentStateHistory(BaseModel):
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    project_id:str
    agent_states: List[AgentStateData] = Field(default_factory=list)
    total_states: int = Field(default=0)
    last_updated: datetime = Field(default_factory=datetime.now)
    
    def __str__(self) -> str:
        """简单的打印方法"""
        return (f"AgentStateHistory(project_id={self.project_id}, "
                f"total_states={self.total_states}, "
                f"last_updated={self.last_updated.strftime('%Y-%m-%d %H:%M:%S')})")
    
class TenderFile(BaseModel):
    """单个招标文件信息"""
    id: str  # 或者 UUID，取决于您的ID格式
    name: str
    type: str
    url: str
    size: int
    mime_type: str




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
                # "config": StateRegistry.get_state_config(internal_state).model_dump() if StateRegistry.get_state_config(internal_state) else {},
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
                "message":"正在执行步骤："+step.value,
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
                "message":"执行过程中遇到错误，将重试",
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
    data: Dict[str, Any] = Field(description="事件数据，支持多种事件类型")

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