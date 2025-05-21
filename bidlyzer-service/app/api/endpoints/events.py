from fastapi import APIRouter, Request, Depends
from sse_starlette.sse import EventSourceResponse
import asyncio
from datetime import datetime
from typing import Dict, Any

from app.auth.dependencies import get_current_user_from_request

router = APIRouter()


@router.get("/events")
async def sse_endpoint(request: Request):
    """
    Server-Sent Events (SSE) 端点
    
    用于建立实时数据流
    认证通过中间件完成，在此获取用户信息
    """
    # 获取通过中间件验证的用户信息
    user = await get_current_user_from_request(request)
    
    async def event_generator():
        try:
            # 示例: 发送10个事件
            for i in range(10):
                # 检查客户端连接状态
                if await request.is_disconnected():
                    break
                
                # 生成事件数据
                yield {
                    "event": "message",
                    "id": str(i),
                    "data": f"事件 {i} 用于用户 {user.get('user_id')}: {user.get('username', '')}"
                }
                
                # 暂停一秒
                await asyncio.sleep(1)
                
        except Exception as e:
            print(f"SSE事件生成错误: {str(e)}")
    
    return EventSourceResponse(event_generator())


@router.get("/analysis")
async def analysis_endpoint(request: Request):
    """
    分析任务示例
    
    启动长时间运行的分析任务并返回SSE流以报告进度
    """
    # 获取通过中间件验证的用户信息
    user = await get_current_user_from_request(request)
    user_id = user.get('user_id')
    
    async def analysis_generator():
        try:
            # 模拟分析过程
            steps = ["数据加载", "预处理", "特征提取", "模型推理", "结果生成"]
            
            for i, step in enumerate(steps):
                if await request.is_disconnected():
                    break
                
                # 向客户端发送进度
                yield {
                    "event": "progress",
                    "id": str(i),
                    "data": {
                        "step": step,
                        "percent": (i + 1) * 20,  # 0-100%
                        "status": "processing"
                    }
                }
                
                # 模拟处理时间
                await asyncio.sleep(2)
            
            # 分析完成，发送结果
            yield {
                "event": "complete",
                "data": {
                    "message": "分析完成",
                    "result": f"用户 {user_id} 的分析结果",
                    "timestamp": datetime.now().isoformat()
                }
            }
                
        except Exception as e:
            # 发送错误事件
            yield {
                "event": "error",
                "data": {
                    "message": f"分析过程中出错: {str(e)}"
                }
            }
    
    return EventSourceResponse(analysis_generator())