# simplified_state.py - SSE驱动的状态管理系统
# 简化设计：后端维护消息历史，前端直接渲染

import uuid
from enum import Enum
from datetime import datetime
from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field

# =========================== 枚举定义 ===========================


class StageEnum(str, Enum):
    """阶段 - 3个阶段"""
    UPLOADING = "uploading"
    STRUCTURING = "structuring"
    PLANNING = "planning"
    WRITING = "writing"
    # 待补充

class StageStatus(str, Enum):
    """系统状态 - 6个完成态"""
    NOT_STARTED = "not_started"   # 每个Stage默认Not_Started
    IN_PROGRESS = "in_progress"   # 初始化以后，状态进行In_progress
    COMPLETED = "completed"       # 完成输出结果后，改为Completed
    FAILED = "failed"             # 中间出错改为failed
    # 待补充

# 添加stage的config，用于，比如：验证stage的顺序， 提供全局stage的进度 
stage_config = {
    StageEnum.UPLOADING: {
        "name": "上传文档",
        "description": "上传文档",
        "overall_progress": 5,
        "next_stage": StageEnum.STRUCTURING, 
        "stage_type": "START_STAGE"
    },
    StageEnum.STRUCTURING: {
        "name": "结构化",
        "description": "结构化",
        "overall_progress": 20,
        "next_stage": StageEnum.PLANNING,
        "stage_type": "MIDDLE_STAGE"
    },
    StageEnum.PLANNING: {
        "name": "规划",
        "description": "规划",
        "overall_progress": 50,
        "next_stage": StageEnum.WRITING,
        "stage_type": "MIDDLE_STAGE"
    },
    StageEnum.WRITING: {
        "name": "写作",
        "description": "写作",
        "overall_progress": 100,
        "next_stage": None,
        "stage_type": "END_STAGE"
    },
}




# =========================== 数据结构定义 ===========================
# 不存储
class AgentState(BaseModel):
    agent_id: str = Field(description="agent_id")  # 与项目project_id绑定
    overall_progress: int = Field(description="整体进度")
    active_stage: StageEnum = Field(description="阶段")
    stage_status: StageStatus = Field(description="阶段状态")
    stage_task_id: Optional[str] = Field(description="阶段任务id")
    # stage_details 待细化？？
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }

# 进行存储
class AgentStateHistory(BaseModel):
    key_name: str = Field(description="文档类型")
    content: List[AgentState] = Field(description="阶段历史")



# 进行存储
class Document(BaseModel):
    key_name: str = Field(description="文档类型")
    content: Dict[str, Any] = Field(description="文档内容")













