# simplified_state.py - SSE驱动的状态管理系统
# 简化设计：后端维护消息历史，前端直接渲染

import uuid
from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, Field

# =========================== 枚举定义 ===========================

# 不存储
class AgentMessage(BaseModel):
    agent_id: str = Field(description="agent_id")
    message_id: str = Field(description="消息id")
    message: str = Field(description="消息")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }

# 进行存储
class AgentMessageHistory(BaseModel):
    key_name: str = Field(description="文档类型")
    content: List[AgentMessage] = Field(description="sse消息历史")














