# state_manager_v2.py - FastAPI集成的状态管理器
# 提供状态转换、事件发布和Redis集成功能

from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from .state import StateEnum

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
    state: StateEnum   # 每个state 都有对应的state_config在state.py中定义了。        
    overall_progress: int = Field(default=0, ge=0, le=100)
    
    # 时间戳
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    

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
                 from_state: Optional[StateEnum],
                 to_state: StateEnum,
                 updated_progress: int = 0,
                 message: str = "",
                 **kwargs):
        super().__init__(
            data={
                "project_id": project_id,
                "from_state": from_state.value if from_state is not None else None,
                "to_state": to_state.value,
                "updated_progress": updated_progress,
                "message": message,
                **kwargs
            }
        )

class ErrorEvent(SSEMessage):
    """错误事件"""
    event: str = "error"
    
    def __init__(self, 
                 project_id: str,
                 error_at_state: StateEnum,
                 error_at_progress: int,
                 error_type: str,
                 error_message: str,
                 **kwargs):
        super().__init__(
            data={
                "project_id": project_id,
                "error_at_state": error_at_state.value,
                "error_at_progress": error_at_progress,
                "error_type": error_type,
                "error_message": error_message,
                "message":"执行过程中遇到错误，将重试",
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
    event: str = Field(description="事件类型: state_update, error")
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