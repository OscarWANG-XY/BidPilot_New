# app/core/redis_helper.py
import redis.asyncio as redis
from typing import Optional, Any, Union
import json
from app.core.config import settings
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class RedisClient:
    """Redis客户端封装类，提供异步操作接口"""
    
    # 申明一个类变量，后面所有的连接都使用这个变量，意味着共享同一个连接
    _client: Optional[redis.Redis] = None
    
    @classmethod
    async def get_client(cls) -> redis.Redis:
        """获取Redis客户端连接（单例模式）"""
        if cls._client is None:
            try:
                logger.debug(f"尝试连接Redis: {settings.REDIS_URL}")
                cls._client = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_timeout=5,  # 设置超时时间
                    socket_connect_timeout=5  # 设置连接超时时间
                )
                logger.info("Redis连接成功")
            except redis.ConnectionError as e:
                logger.error(f"Redis连接失败: {str(e)}")
                raise
            except Exception as e:
                logger.error(f"Redis连接失败: {str(e)}")
                raise
        return cls._client
    
    @classmethod
    async def close(cls) -> None:
        """关闭Redis连接"""
        if cls._client is not None:
            try:
                await cls._client.close()
                logger.info("Redis连接关闭成功")
            except Exception as e:
                logger.error(f"Redis连接关闭失败: {str(e)}")
            finally:
                cls._client = None
    
    @classmethod
    async def set(cls, key: str, value: Any, expire: int = None) -> bool:
        """
        设置键值对存储， 使用时有两种存储模式：
        1. 过期时间存储： 设置过期时间， 过期后自动删除
        2. 永久存储： 未设置过期时间， 需要手动删除
        """
        try:
            client = await cls.get_client()
            
            # 如果value不是基本类型，则序列化为JSON
            if not isinstance(value, (str, int, float, bool)):
                value = json.dumps(value, ensure_ascii=False)
                
            if expire:
                return await client.setex(key, expire, value)
            else:
                return await client.set(key, value)
        except Exception as e:
            logger.error(f"Error setting Redis key {key}: {str(e)}")
            raise
    
    @classmethod
    async def get(cls, key: str, default: Any = None) -> Any:
        """
        获取键值（从存储中取值， 可能是缓存的值，也可能是持久化的值，取决于之前的存储是否配置了expire）
        """
        try:
            client = await cls.get_client()
            value = await client.get(key)
            
            if value is None:
                return default
                
            # 尝试解析JSON
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            logger.error(f"Redis获取键值失败: {str(e)}")
            raise
    
    @classmethod
    async def delete(cls, key: str) -> int:
        """
        删除键(删除存储)， 返回删除的键数量(int)
        """
        try:
            client = await cls.get_client()
            return await client.delete(key)
        except Exception as e:
            logger.error(f"Redis删除键失败: {str(e)}")
            raise
    
    @classmethod
    async def exists(cls, key: str) -> bool:
        """
        检查键是否存在， 返回是否存在(bool)
        """
        try:
            client = await cls.get_client()
            return await client.exists(key) > 0
        except Exception as e:
            logger.error(f"Redis检查键是否存在失败: {str(e)}")
            raise
        
    @classmethod
    async def expire(cls, key: str, seconds: int) -> bool:
        """
        设置键的过期时间
        """
        try:
            client = await cls.get_client()
            return await client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis设置过期时间失败: {str(e)}")
            raise