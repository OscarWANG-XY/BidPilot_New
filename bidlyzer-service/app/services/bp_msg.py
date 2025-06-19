# simplified_state.py - SSE驱动的状态管理系统
# 简化设计：后端维护消息历史，前端直接渲染

import uuid
from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum

# =========================== 枚举定义 ===========================


class ActionStatus(str, Enum):
    """用户操作状态"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    FAILED = "failed"

class ActionType(str, Enum):
    """用户操作类型"""
    UPLOAD = "upload"
    EDIT = "edit"



class SSEData(BaseModel):
    """SSE数据: message, result, action"""
    # 背景信息
    stage: str = Field(description="项目阶段")
    step: str = Field(description="项目阶段步骤")
    message: str = Field(description="agent消息")

    # results
    show_results: bool = Field(description="是否展示结果")
    result_key_names: Optional[List[str]] = Field(description="文档key名称")

    # actions
    required_action: bool = Field(description="是否要用户跟进操作？")
    action_status: Optional[ActionStatus] = Field(description="用户操作状态")
    action_type: Optional[ActionType] = Field(description="用户操作类型")

    created_at: datetime = Field(default_factory=datetime.now)


# 不存储
class AgentMessage(BaseModel):
    #定义了序列化时，对于datetime类型的处理方式， 这个是pydantic v2的语法
    model_config = ConfigDict(
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    )
    
    id: str = Field(description="消息唯一标识")
    event: str = Field(description="事件类型: state_update, error")
    data: SSEData = Field(description="事件数据，支持多种事件类型")
    retry: int = Field(description="重试次数")



# 进行存储
class AgentMessageHistory(BaseModel):
    key_name: str = Field(description="文档类型")
    content: List[AgentMessage] = Field(description="sse消息历史")














