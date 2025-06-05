from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
import logging
from datetime import datetime
from app.services.structuring.schema import AgentStateData, SSEMessageRecord

from app.services.structuring.state_manager import create_state_manager
from app.services.structuring.state import UserAction, SystemInternalState, UserVisibleState
from app.core.redis_helper import RedisClient

logger = logging.getLogger(__name__)

router = APIRouter()


class StateStatusResponse(BaseModel):
    """状态查询响应"""
    project_id: str
    agent_state: AgentStateData

class SSEHistoryResponse(BaseModel):
    """SSE历史记录响应"""
    project_id: str
    sse_history: List[SSEMessageRecord]

# 路由函数指定了response_model,会自动序列化，对于pydantic的自定义模型，不需要model_dump()转字典
@router.get("/agent-state/{project_id}", response_model=StateStatusResponse)
async def get_agent_state(project_id: str):
    """
    额外端点: 查询当前状态
    用于前端主动查询当前处理状态
    """
    try:
        from app.services.structuring.cache import Cache
        cache = Cache(project_id)
        agent_state = await cache.get_agent_state()
        
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


@router.get("/sse-history/{project_id}", response_model=SSEHistoryResponse)
async def get_sse_history(project_id: str):
    """
    额外端点: 查询当前状态
    用于前端主动查询当前处理状态
    """
    try:
        from app.services.structuring.cache import Cache
        cache = Cache(project_id)
        sse_history = await cache.get_agent_sse_message_history()
        
        if not sse_history:
            raise HTTPException(status_code=404, detail="项目状态未找到")
        
        return SSEHistoryResponse(
            project_id=project_id,
            sse_history=sse_history.messages,
            # user_state=agent_state.current_user_state.value,
            # internal_state=agent_state.current_internal_state.value,
            # progress=agent_state.overall_progress,
            # message=agent_state.error_message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting status for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取状态失败: {str(e)}")
    
