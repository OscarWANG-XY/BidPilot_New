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
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    # 待补充

# 添加stage的config，用于，比如：验证stage的顺序， 提供全局stage的进度 
stage_config = {
    StageEnum.UPLOADING: {
        "name": "上传文档",
        "description": "上传文档",
        "progress": 5,
        "next_stage": StageEnum.STRUCTURING, 
    },
    StageEnum.STRUCTURING: {
        "name": "结构化",
        "description": "结构化",
        "progress": 20,
        "next_stage": StageEnum.PLANNING,
    },
    StageEnum.PLANNING: {
        "name": "规划",
        "description": "规划",
        "progress": 50,
        "next_stage": StageEnum.WRITING,
    },
    StageEnum.WRITING: {
        "name": "写作",
        "description": "写作",
        "progress": 100,
        "next_stage": None,
    },
}



# =========================== 工具函数 ===========================

# 写一个工具函数，根据stage_config验证stage转化是否合理，
def validate_stage_transition(current_stage: StageEnum, next_stage: StageEnum) -> bool:
    """验证stage转化是否合理"""
    if next_stage is None:
        return True
    return next_stage in stage_config[current_stage]["next_stage"]



# =========================== 数据结构定义 ===========================

class AgentState(BaseModel):
    agent_id: str = Field(description="agent_id")  # 与项目project_id绑定
    overall_progress: int = Field(description="整体进度")
    active_stage: StageEnum = Field(description="阶段")
    stage_status: StageStatus = Field(description="阶段状态")
    stage_progress: int = Field(description="阶段进度")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class AgentStateHistory(BaseModel):
    key_name: str = Field(description="文档类型")
    content: List[AgentState] = Field(description="阶段历史")


class AgentSSEMessage(BaseModel):
    agent_id: str = Field(description="agent_id")
    message: str = Field(description="消息")
    created_at: datetime = Field(description="创建时间")
    updated_at: datetime = Field(description="更新时间")

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }


class AgentSSEMessageHistory(BaseModel):
    key_name: str = Field(description="文档类型")
    content: List[AgentSSEMessage] = Field(description="sse消息历史")


class Document(BaseModel):
    key_name: str = Field(description="文档类型")
    content: Dict[str, Any] = Field(description="文档内容")



# 设计基于AgentState的state_manager
class AgentStateManager:
    """AgentState管理器"""
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.agent_state = None

    def init_agent(self, project_id: str) -> None:
        """初始化agent"""
        self.agent_state = AgentState(
            agent_id=project_id,
            overall_progress=0,
            active_stage=StageEnum.UPLOADING,
            stage_status=StageStatus.NOT_STARTED,
            stage_progress=0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

    def transition_to_stage(self, stage: StageEnum) -> None:
        """转换到指定阶段"""
        if self.agent_state is None:
            raise ValueError("Agent not initialized. Call init_agent first.")
            
        if not validate_stage_transition(self.agent_state.active_stage, stage):
            raise ValueError(f"Invalid stage transition from {self.agent_state.active_stage} to {stage}")
        
        self.agent_state.active_stage = stage
        self.agent_state.stage_status = StageStatus.IN_PROGRESS
        self.agent_state.updated_at = datetime.now()

        #保存当前状态到数据库 TODO
        # await self.save_agent_state()

    # 设计状态恢复功能
    def restore_state(self, agent_state: AgentState) -> None:
        """恢复到指定状态"""
        self.agent_state = agent_state
        self.agent_state.stage_status = StageStatus.IN_PROGRESS
        self.agent_state.updated_at = datetime.now()










