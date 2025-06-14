from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import asyncio
import json
import logging
from datetime import datetime
from app.services.cache import Cache

from app.services.structuring.state_manager import create_state_manager
from app.services.structuring.state import UserAction, StateEnum
from app.core.redis_helper import RedisClient

logger = logging.getLogger(__name__)

router = APIRouter()


# ========================= 端点实现 =========================

@router.get("/{project_id}/sse")
async def sse_stream(project_id: str, request: Request):
    """
    端点4: SSE流 (使用中间件认证)
    Agent向前端实时推送状态更新和进度信息
    
    认证方式: 
    - HTTP请求: Authorization: Bearer <token>
    - SSE连接: URL参数 ?token=<token>
    - 认证由JWTAuthMiddleware统一处理
    """
    async def event_generator():
        """SSE事件生成器"""
        try:
            # 从中间件获取用户信息
            user_info = request.state.user
            user_id = user_info.get('user_id', 'unknown')
            
            logger.info(f"SSE连接已建立 - 项目: {project_id}, 用户: {user_id}")
            
            # Redis订阅通道

            cache = Cache(project_id)
            channel = cache.get_channel_keys()['sse_channel']
            
            # 发送初始连接确认（包含用户信息）
            yield f"event: connected\n"
            yield f"data: {json.dumps({
                'projectId': project_id,
                'userId': user_id,
                'message': '连接已建立'
            })}\n\n"
            
            # 发送当前状态（如果存在）
            agent_state = await cache.get_agent_state()
           
            if agent_state:
                from app.services.structuring.state import StateRegistry
                state_config = StateRegistry.get_state_config(agent_state.state)
                yield f"event: state_update\n"
                yield f"data: {json.dumps({
                    'projectId': project_id,
                    'fromState': state_config.previous_state.value if state_config.previous_state is not None else None,
                    'toState': agent_state.state,
                    'updatedProgress': agent_state.overall_progress,
                    'message': state_config.description if state_config else ""
                })}\n\n"
            
            # 发送一个测试消息（可选，用于调试）
            yield f"event: test\n"
            yield f"data: {json.dumps({
                'projectId': project_id,
                'message': '这是一个测试消息',
                'timestamp': '2024-01-01T00:00:00Z'
            })}\n\n"
            
            # 监听Redis消息
            pubsub = await RedisClient.subscribe(channel)
            
            try:
                # 监听消息
                while True:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message is not None:
                        try:
                            # 解析消息
                            message_data = json.loads(message['data']) if isinstance(message['data'], str) else message['data']
                            
                            # 格式化为SSE格式
                            # .get(key, default)的语法，如果key不存在，则返回default, 所以，以下如果没有event，则返回update作为默认。
                            event_type = message_data.get("event", "update")
                            event_data = message_data.get("data", message_data)
                            
                            yield f"event: {event_type}\n"
                            yield f"data: {json.dumps(event_data)}\n\n"
                            
                        except json.JSONDecodeError as e:
                            logger.error(f"Error parsing SSE message: {e}")
                            continue
                    
                    # 检查客户端是否断开连接
                    if await request.is_disconnected():
                        break
                        
            finally:
                # 确保清理pubsub连接
                await RedisClient.unsubscribe(pubsub, channel)
                await pubsub.close()
            
        except Exception as e:
            logger.error(f"Error in SSE stream for project {project_id}: {str(e)}")
            # 发送错误消息
            yield f"event: error\n"
            yield f"data: {json.dumps({
                'projectId': project_id,
                'error': str(e)
            })}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )