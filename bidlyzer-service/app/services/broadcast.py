from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from app.core.redis_helper import RedisClient
from app.services.cache import Cache
from app.services.structuring.schema import AgentStateData, SSEData, SSEMessage
from app.services.structuring.state import StateRegistry



import logging
logger = logging.getLogger(__name__)


# SSE发布与订阅
async def publish_state_update(project_id: str, agent_state: AgentStateData, message: Optional[str] = None):
    """发布状态更新事件到Redis SSE通道"""
    try:

        cache = Cache(project_id)
        # 获取状态配置
        state_config = StateRegistry.get_state_config(agent_state.state)
        
        # 创建状态更新事件， event是一种消息结构体，在这里用于封装一个状态变化的通知。 
        # event是服务端事件（Server-Sent Event, SSE）协议下的数据结构
        event_data = SSEData(
            project_stage="STRUCTURING",
            agent_in_use="STRUCTURING AGENT",
            agent_state=agent_state.state,
            state_message=message or (state_config.description if state_config else ""),
            created_at=datetime.now(),

            # results to show
            show_documents=False,
            doc_names=[],
            allow_edit=False,
            show_suggestions=False,
            suggestions_names= ["review_suggestions"],

            # user guide
            user_action_required=False,
            action_completed=False,
            action_type="edit_document",
            action_guide="请编辑文档"
        )

        event_payload = SSEMessage(
            event="state_update",
            data=event_data,
            id=str(uuid.uuid4()),
            retry=0
        )
        
        # 发布到Redis通道
        channel = cache.get_channel_keys()['sse_channel']
        await RedisClient.publish(channel, event_payload.model_dump_json())
        
        # 存储消息到历史记录
        await cache.add_agent_sse_message_to_history(
            sse_message=event_payload
        )
        
        logger.debug(f"Published state update for project {agent_state.project_id}")
        
    except Exception as e:
        logger.error(f"Error publishing state update: {str(e)}")


async def publish_error_event(project_id: str, agent_state: AgentStateData, error_message: str):
            

    try:
        cache = Cache(project_id)        
        state_config = StateRegistry.get_state_config(agent_state.state)

        # 发布错误事件
        event_data = SSEData(
            project_stage="STRUCTURING",
            agent_in_use="STRUCTURING AGENT",
            agent_state=agent_state.state,
            state_message=error_message or (state_config.description if state_config else ""),
            created_at=datetime.now(),

            # results to show
            show_documents=False,
            doc_names=[],
            allow_edit=False,
            show_suggestions=False,
            suggestions_names= ["review_suggestions"],

            # user guide
            user_action_required=False,
            action_completed=False,
            action_type="edit_document",
            action_guide="请编辑文档"
        )

        event_payload = SSEMessage(
            event="error",
            data=event_data,
            id=str(uuid.uuid4()),
            retry=0
        )

        
        channel = cache.get_channel_keys()['sse_channel']
        await RedisClient.publish(channel, event_payload.model_dump_json())
        
        # 存储错误消息到历史记录
        await cache.add_agent_sse_message_to_history(
            sse_message=event_payload
        )
    except Exception as e:
        logger.error(f"Error publishing error event: {str(e)}")