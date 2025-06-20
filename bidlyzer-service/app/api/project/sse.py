from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import asyncio
import json
import logging
from datetime import datetime
from app.services.cache import Cache
from app.core.redis_helper import RedisClient
from app.services.bp_msg import AgentMessage
from app.services.broadcast import publish_state_update

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
            
            
            # 添加心跳计时器
            last_heartbeat = datetime.now()
            HEARTBEAT_INTERVAL = 15  # 心跳间隔(秒)


            # 监听Redis消息
            pubsub = await RedisClient.subscribe(channel)
            
            try:
                # 监听消息
                while True:

                    # 发送心跳（如果超过间隔时间）
                    if (datetime.now() - last_heartbeat).total_seconds() > HEARTBEAT_INTERVAL:
                        yield ":heartbeat\n\n"  # 发送空注释作为心跳
                        last_heartbeat = datetime.now()

                    message = await pubsub.get_message(ignore_subscribe_messages=True) #拿掉timeout=1.0， 否则会阻塞

                    print('监听到消息', message)
                    if message is not None:
                        try:
                            # 解析AgentMessage
                            if isinstance(message['data'], str):
                                agent_msg = json.loads(message['data'])
                            else:
                                agent_msg = message['data']
                            
                            # 构建完整的SSE响应，使用AgentMessage的所有4个字段
                            yield f"id: {agent_msg.get('id', '')}\n"
                            yield f"event: {agent_msg.get('event', 'message')}\n"  
                            yield f"data: {json.dumps(agent_msg.get('data', {}))}\n"
                            yield f"retry: {agent_msg.get('retry', 3000)}\n\n"  # retry通常以毫秒为单位
                            
                        except json.JSONDecodeError as e:
                            logger.error(f"Error parsing SSE message: {e}")
                            continue
                        
                        await asyncio.sleep(0.1) # 添加短暂休眠避免CPU空转
                    
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