# app/core/dependencies.py
from fastapi import Depends
from redis.asyncio import Redis
from typing import AsyncGenerator

from app.core.redis_helper import RedisClient

async def get_redis() -> AsyncGenerator[Redis, None]:
    """
    FastAPI依赖项：获取Redis客户端
    
    用法示例:
    ```
    @router.get("/items/{item_id}")
    async def read_item(item_id: str, redis: Redis = Depends(get_redis)):
        # 使用redis客户端
        item = await redis.get(f"item:{item_id}")
        ...
    ```
    """
    client = await RedisClient.get_client()
    try:
        yield client
    finally:
        # 这里不需要关闭连接，因为我们使用的是单例模式
        pass

