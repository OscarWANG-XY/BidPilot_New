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
    
    @classmethod
    async def publish(cls, channel: str, message: Union[str, dict]) -> int:
        """
        发布消息到Redis通道（用于SSE推送）
        
        Args:
            channel: Redis通道名称
            message: 要发布的消息，可以是字符串或字典
            
        Returns:
            订阅该通道的客户端数量
        """
        try:
            client = await cls.get_client()
            
            # 如果是字典，序列化为JSON字符串
            if isinstance(message, dict):
                message = json.dumps(message, ensure_ascii=False)
            
            subscriber_count = await client.publish(channel, message)
            logger.debug(f"Published message to channel {channel}, subscribers: {subscriber_count}")
            
            return subscriber_count
            
        except Exception as e:
            logger.error(f"Redis发布消息失败 - channel: {channel}, error: {str(e)}")
            raise
    
    @classmethod
    async def subscribe(cls, *channels: str):
        """
        订阅Redis通道（用于SSE接收）
        
        Args:
            *channels: 要订阅的通道名称列表
            
        Returns:
            Pubsub对象，可用于接收消息
        """
        try:
            client = await cls.get_client()
            pubsub = client.pubsub()
            
            # 订阅通道
            await pubsub.subscribe(*channels)
            logger.debug(f"Subscribed to channels: {channels}")
            
            return pubsub
            
        except Exception as e:
            logger.error(f"Redis订阅通道失败 - channels: {channels}, error: {str(e)}")
            raise
    
    @classmethod
    async def unsubscribe(cls, pubsub, *channels: str) -> None:
        """
        取消订阅Redis通道
        
        Args:
            pubsub: Pubsub对象
            *channels: 要取消订阅的通道名称列表
        """
        try:
            if channels:
                await pubsub.unsubscribe(*channels)
                logger.debug(f"Unsubscribed from channels: {channels}")
            else:
                await pubsub.unsubscribe()
                logger.debug("Unsubscribed from all channels")
                
        except Exception as e:
            logger.error(f"Redis取消订阅失败: {str(e)}")
            raise