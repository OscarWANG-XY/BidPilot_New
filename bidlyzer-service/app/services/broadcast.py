from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from app.core.redis_helper import RedisClient
from app.services.cache import Cache
from app.services.bp_msg import AgentMessage


import logging
logger = logging.getLogger(__name__)


# SSE发布与订阅
async def publish_state_update(project_id: str, agent_message: AgentMessage):
    """发布状态更新事件到Redis SSE通道"""
    try:

        cache = Cache(project_id)
        
        
        # 发布到Redis通道
        channel = cache.get_channel_keys()['sse_channel']
        print('发布agent_message到Redis通道', channel)
        await RedisClient.publish(channel, agent_message.model_dump_json())
        
        # 存储消息到历史记录
        await cache.save_agent_message(agent_message)
        
        logger.debug(f"发布了agent_message")
        
    except Exception as e:
        logger.error(f"Error publishing state update: {str(e)}")


# async def publish_error_event(project_id: str, agent_state: AgentStateData, error_message: str):
            

#     try:
#         cache = Cache(project_id)        
#         state_config = StateRegistry.get_state_config(agent_state.state)

#         # 发布错误事件
#         event_data = SSEData(
#             project_stage="STRUCTURING",
#             agent_in_use="STRUCTURING AGENT",
#             agent_state=agent_state.state,
#             state_message=error_message or (state_config.description if state_config else ""),
#             created_at=datetime.now(),

#             # results to show
#             show_documents=False,
#             doc_names=[],
#             allow_edit=False,
#             show_suggestions=False,
#             suggestions_names= ["review_suggestions"],

#             # user guide
#             user_action_required=False,
#             action_completed=False,
#             action_type="edit_document",
#             action_guide="请编辑文档"
#         )

#         event_payload = SSEMessage(
#             event="error",
#             data=event_data,
#             id=str(uuid.uuid4()),
#             retry=0
#         )

        
#         channel = cache.get_channel_keys()['sse_channel']
#         await RedisClient.publish(channel, event_payload.model_dump_json())
        
#         # 存储错误消息到历史记录
#         await cache.add_agent_sse_message_to_history(
#             sse_message=event_payload
#         )
#     except Exception as e:
#         logger.error(f"Error publishing error event: {str(e)}")