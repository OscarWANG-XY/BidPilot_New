# state_manager_v2.py - FastAPI集成的状态管理器
# 提供状态转换、事件发布和Redis集成功能

from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from .state import StateEnum

import logging
logger = logging.getLogger(__name__)

# ========================= 状态数据模型 =========================

class StructuringState(BaseModel):
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
    
    

class StructuringStateHistory(BaseModel):
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    project_id:str
    agent_states: List[StructuringState] = Field(default_factory=list)
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



class StructuringSSEData(BaseModel):
    """SSE数据"""
    # 背景信息
    project_stage: str = Field(description="项目阶段")
    agent_in_use: str = Field(description="agent名称")
    agent_state: str = Field(description="agent状态")
    state_message: str = Field(description="agent消息")
    created_at: datetime = Field(default_factory=datetime.now)

    # results to show
    show_documents: bool = Field(description="是否展示原始文档")
    doc_names: List[str] = Field(description="文档名称")
    allow_edit: bool = Field(description="是否允许编辑")
    show_suggestions: bool = Field(description="是否展示suggestions")
    suggestions_names: List[str] = Field(description="suggestions名称")

    # user guide
    user_action_required: bool = Field(description="是否要用户跟进操作？")
    action_completed: bool = Field(description="用户操作是否完成？")
    action_type: str = Field(description="用户操作类型") # "edit_document", "upload_document"
    action_guide: str = Field(description="用户引导信息")


class StructuringMessage(BaseModel):
    """SSE消息记录模型"""
    #定义了序列化时，对于datetime类型的处理方式， 这个是pydantic v2的语法
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    id: str = Field(description="消息唯一标识")
    event: str = Field(description="事件类型: state_update, error")
    data: StructuringSSEData = Field(description="事件数据，支持多种事件类型")
    retry: int = Field(description="重试次数")


class StructuringMessageHistory(BaseModel):
    """SSE消息历史记录"""
    #定义了序列化时，对于datetime类型的处理方式， 这个是pydantic v2的语法
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    project_id: str
    messages: List[StructuringMessage] = Field(default_factory=list)
    total_messages: int = Field(default=0)
    last_updated: datetime = Field(default_factory=datetime.now)