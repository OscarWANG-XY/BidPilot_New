from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from pydantic import BaseModel
from app.services.cache import Cache
from app.services.bp_state import AgentState
from app.services.bp_msg import AgentMessage


import logging
logger = logging.getLogger(__name__)

router = APIRouter()


class StateStatusResponse(BaseModel):
    """状态查询响应"""
    project_id: str
    agent_state: AgentState

class SSEHistoryResponse(BaseModel):
    """SSE历史记录响应"""
    project_id: str
    total_messages: int
    last_updated: datetime
    messages: List[AgentMessage]


# 路由函数指定了response_model,会自动序列化，对于pydantic的自定义模型，不需要model_dump()转字典
@router.get("/{project_id}/agent-state", response_model=StateStatusResponse)
async def get_agent_state(project_id: str):
    """
    额外端点: 查询当前状态
    用于前端主动查询当前处理状态
    """
    try:
        cache = Cache(project_id)
        agent_state,_ = await cache.get_agent_state()
        
        if not agent_state:
            raise HTTPException(status_code=404, detail="项目状态未找到")
        
        return StateStatusResponse(
            project_id=project_id,
            agent_state=agent_state,    
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting status for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取状态失败: {str(e)}")


@router.get("/{project_id}/agent-message-history", response_model=SSEHistoryResponse)
async def get_sse_history(project_id: str):
    """
    额外端点: 查询SSE消息历史
    用于前端主动查询SSE消息历史
    """
    try:
        cache = Cache(project_id)
        _, message_history = await cache.get_agent_message()
        
        if not message_history:
            raise HTTPException(status_code=404, detail="项目消息历史未找到")
        
        # 从 message_history.content 获取消息列表
        messages = message_history.content if message_history.content else []
        last_updated = messages[-1].updated_at if messages else datetime.now()
        
        return SSEHistoryResponse(
            project_id=project_id,
            messages=messages,
            total_messages=len(messages),
            last_updated=last_updated
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting SSE history for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取SSE历史失败: {str(e)}")
    
