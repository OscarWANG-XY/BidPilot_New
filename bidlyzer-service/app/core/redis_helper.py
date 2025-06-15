# app/core/redis_helper.py
import redis.asyncio as redis
from typing import Optional, Any, Union
import json
import uuid
import time
import asyncio
from app.core.config import settings
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 添加异常类
class LockAcquireError(Exception):
    """获取锁失败异常"""
    pass

class LockTimeoutError(LockAcquireError):
    """获取锁超时异常"""
    pass


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

    

    @classmethod
    async def acquire_lock(cls, lock_key: str, expire: int = 30) -> Optional[str]:
        """
        获取分布式锁
        
        Args:
            lock_key: 锁的键名
            expire: 锁的过期时间（秒），防止死锁
            
        Returns:
            成功时返回锁的唯一标识符，失败时返回 None
        """
        try:
            client = await cls.get_client()
            
            # 生成唯一标识符
            lock_id = str(uuid.uuid4())
            
            # 使用 SET key value NX EX seconds 命令, nx=True 只有key不存在时才设置Not eXists, ex=expire 设置过期时间防止锁死
            success = await client.set(lock_key, lock_id, nx=True, ex=expire)

            
            if success:
                logger.debug(f"成功获取锁: {lock_key}, ID: {lock_id}")
                return lock_id
            else:
                logger.debug(f"获取锁失败: {lock_key}")
                return None
                
        except Exception as e:
            logger.error(f"获取锁异常: {lock_key}, error: {str(e)}")
            return None
        

    @classmethod
    async def release_lock(cls, lock_key: str, lock_id: str) -> bool:
        """
        使用Lua脚本安全释放锁
        原子化， 防止竞态， 就是在做判断的时候是一个状态，执行的时候处在另一个状态，中间有其他进程获取锁了， 所以需要使用Lua脚本。 
        Lua脚本会进行阻塞，来避免上面说的竞态问题。 
        """
        try:
            client = await cls.get_client()
            
            # Lua脚本：检查身份并删除
            lua_script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """
            
            # 执行Lua脚本
            result = await client.eval(lua_script, 1, lock_key, lock_id)
            
            if result == 1:
                logger.debug(f"成功释放锁: {lock_key}, ID: {lock_id}")
                return True
            else:
                logger.warning(f"释放锁失败，锁不存在或身份不匹配: {lock_key}")
                return False
                
        except Exception as e:
            logger.error(f"释放锁异常: {lock_key}, error: {str(e)}")
            return False
        

    @classmethod
    async def extend_lock(cls, lock_key: str, lock_id: str, expire: int) -> bool:
        """
        延长分布式锁的过期时间
        续锁，因为不知道任务什么时候完成。可能受网络影响，也可能别的原因。
        
        Args:
            lock_key: 锁的键名
            lock_id: 获取锁时返回的唯一标识符
            expire: 新的过期时间（秒）
            
        Returns:
            True: 续期成功, False: 续期失败（锁不存在或不属于当前进程）
        """
        try:
            client = await cls.get_client()
            
            # Lua脚本：检查身份并续期
            lua_script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("expire", KEYS[1], ARGV[2])
            else
                return 0
            end
            """
            
            # 执行Lua脚本
            result = await client.eval(lua_script, 1, lock_key, lock_id, expire)
            
            if result == 1:
                logger.debug(f"成功续期锁: {lock_key}, ID: {lock_id}, 新过期时间: {expire}秒")
                return True
            else:
                logger.warning(f"续期锁失败，锁不存在或身份不匹配: {lock_key}")
                return False
                
        except Exception as e:
            logger.error(f"续期锁异常: {lock_key}, error: {str(e)}")
            return False



    @classmethod
    def distributed_lock(
        cls, 
        lock_key: str, 
        expire: int = 30,
        retry_times: int = 3,
        retry_interval: Union[float, str] = 0.1,
        timeout: Optional[float] = None
    ):
        """
        创建分布式锁上下文管理器
        
        Args:
            lock_key: 锁的键名
            expire: 锁的过期时间（秒）
            retry_times: 重试次数
            retry_interval: 重试间隔（秒）或 "exponential" 表示指数退避
            timeout: 总超时时间（秒），None表示不限制
            
        Returns:
            内部锁上下文管理器
            
        Example:
            async with RedisClient.distributed_lock("lock:user:123", expire=60):
                # 执行需要互斥的操作
                pass
        """
        
        class _DistributedLock:
            def __init__(self):
                self.redis_client_cls = cls
                self.lock_key = lock_key
                self.expire = expire
                self.retry_times = retry_times
                self.retry_interval = retry_interval
                self.timeout = timeout
                self.lock_id: Optional[str] = None
            
            def _calculate_wait_time(self, attempt: int) -> float:
                """计算等待时间"""
                if self.retry_interval == "exponential":
                    # 指数退避：0.1, 0.2, 0.4, 0.8...
                    return 0.1 * (2 ** attempt)
                else:
                    # 固定间隔
                    return float(self.retry_interval)
            
            async def __aenter__(self):
                """进入上下文时获取锁，支持重试"""
                start_time = time.time()
                
                for attempt in range(self.retry_times + 1):
                    try:
                        # 检查超时
                        if self.timeout and (time.time() - start_time) > self.timeout:
                            raise LockTimeoutError(
                                f"获取锁超时: {self.lock_key}, 超时时间: {self.timeout}秒"
                            )
                        
                        # 尝试获取锁
                        self.lock_id = await self.redis_client_cls.acquire_lock(
                            self.lock_key, 
                            self.expire
                        )
                        
                        if self.lock_id:
                            logger.debug(f"成功获取锁: {self.lock_key}, 尝试次数: {attempt + 1}")
                            return self
                        
                        # 获取锁失败，准备重试
                        if attempt < self.retry_times:
                            wait_time = self._calculate_wait_time(attempt)
                            logger.debug(
                                f"获取锁失败，{wait_time:.2f}秒后重试: {self.lock_key}, "
                                f"尝试次数: {attempt + 1}/{self.retry_times + 1}"
                            )
                            await asyncio.sleep(wait_time)
                    
                    except Exception as e:
                        logger.error(f"获取锁异常: {self.lock_key}, 尝试次数: {attempt + 1}, 错误: {e}")
                        
                        # 如果是最后一次尝试，抛出异常
                        if attempt >= self.retry_times:
                            raise LockAcquireError(f"获取锁失败: {self.lock_key}, 原因: {e}")
                        
                        # 异常情况下也要等待重试
                        wait_time = self._calculate_wait_time(attempt)
                        await asyncio.sleep(wait_time)
                
                # 所有重试都失败
                raise LockAcquireError(f"获取锁失败: {self.lock_key}, 已重试 {self.retry_times} 次")
            
            async def __aexit__(self, exc_type, exc_val, exc_tb):
                """退出上下文时释放锁"""
                if self.lock_id:
                    try:
                        success = await self.redis_client_cls.release_lock(
                            self.lock_key, 
                            self.lock_id
                        )
                        if success:
                            logger.debug(f"成功释放锁: {self.lock_key}")
                        else:
                            logger.warning(f"释放锁失败: {self.lock_key}")
                    except Exception as e:
                        logger.error(f"释放锁异常: {self.lock_key}, 错误: {e}")
        
        return _DistributedLock()
    



    @classmethod
    def acquire_lock_sync(cls, lock_key: str, expire: int = 30) -> Optional[str]:
        """
        获取分布式锁（同步版本，用于Celery）
        
        Args:
            lock_key: 锁的键名
            expire: 锁的过期时间（秒），防止死锁
            
        Returns:
            成功时返回锁的唯一标识符，失败时返回 None
        """
        try:
            import redis
            logger.info(f"[LOCK_DEBUG] 开始获取锁: {lock_key}, 过期时间: {expire}秒")
            logger.info(f"[LOCK_DEBUG] Redis URL: {settings.REDIS_URL}")
            
            sync_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            
            # 生成唯一标识符
            lock_id = str(uuid.uuid4())
            logger.info(f"[LOCK_DEBUG] 生成锁ID: {lock_id}")
            
            # 使用 SET key value NX EX seconds 命令
            success = sync_client.set(lock_key, lock_id, nx=True, ex=expire)
            logger.info(f"[LOCK_DEBUG] SET命令执行结果: {success}")
            
            if success:
                logger.info(f"成功获取锁: {lock_key}, ID: {lock_id}")
                return lock_id
            else:
                # 检查现有锁的信息
                existing_value = sync_client.get(lock_key)
                ttl = sync_client.ttl(lock_key)
                logger.info(f"获取锁失败: {lock_key}, 现有锁值: {existing_value}, TTL: {ttl}秒")
                return None
                
        except Exception as e:
            logger.error(f"获取锁异常: {lock_key}, error: {str(e)}")
            return None

    @classmethod
    def release_lock_sync(cls, lock_key: str, lock_id: str) -> bool:
        """
        使用Lua脚本安全释放锁（同步版本）
        """
        try:
            import redis
            sync_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            
            # Lua脚本：检查身份并删除
            lua_script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """
            
            # 执行Lua脚本
            result = sync_client.eval(lua_script, 1, lock_key, lock_id)
            
            if result == 1:
                logger.debug(f"成功释放锁: {lock_key}, ID: {lock_id}")
                return True
            else:
                logger.warning(f"释放锁失败，锁不存在或身份不匹配: {lock_key}")
                return False
                
        except Exception as e:
            logger.error(f"释放锁异常: {lock_key}, error: {str(e)}")
            return False


    @classmethod
    def extend_lock_sync(cls, lock_key: str, lock_id: str, expire: int) -> bool:
        """
        延长分布式锁的过期时间（同步版本）
        
        Args:
            lock_key: 锁的键名
            lock_id: 获取锁时返回的唯一标识符
            expire: 新的过期时间（秒）
            
        Returns:
            True: 续期成功, False: 续期失败（锁不存在或不属于当前进程）
        """
        try:
            import redis
            sync_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            
            # Lua脚本：检查身份并续期
            lua_script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("expire", KEYS[1], ARGV[2])
            else
                return 0
            end
            """
            
            # 执行Lua脚本
            result = sync_client.eval(lua_script, 1, lock_key, lock_id, expire)
            
            if result == 1:
                logger.debug(f"成功续期锁: {lock_key}, ID: {lock_id}, 新过期时间: {expire}秒")
                return True
            else:
                logger.warning(f"续期锁失败，锁不存在或身份不匹配: {lock_key}")
                return False
                
        except Exception as e:
            logger.error(f"续期锁异常: {lock_key}, error: {str(e)}")
            return False

    @classmethod
    def distributed_lock_sync(
        cls, 
        lock_key: str, 
        expire: int = 30,
        retry_times: int = 3,
        retry_interval: Union[float, str] = 0.1,
        timeout: Optional[float] = None
    ):
        """
        创建分布式锁上下文管理器（同步版本，用于Celery）
        
        Args:
            lock_key: 锁的键名
            expire: 锁的过期时间（秒）
            retry_times: 重试次数
            retry_interval: 重试间隔（秒）或 "exponential" 表示指数退避
            timeout: 总超时时间（秒），None表示不限制
            
        Returns:
            内部锁上下文管理器
            
        Example:
            with RedisClient.distributed_lock_sync("lock:user:123", expire=60):
                # 执行需要互斥的操作
                pass
        """
        
        class _DistributedLockSync:
            def __init__(self):
                self.redis_client_cls = cls
                self.lock_key = lock_key
                self.expire = expire
                self.retry_times = retry_times
                self.retry_interval = retry_interval
                self.timeout = timeout
                self.lock_id: Optional[str] = None
            
            def _calculate_wait_time(self, attempt: int) -> float:
                """计算等待时间"""
                if self.retry_interval == "exponential":
                    # 指数退避：0.1, 0.2, 0.4, 0.8...
                    return 0.1 * (2 ** attempt)
                else:
                    # 固定间隔
                    return float(self.retry_interval)
            
            def __enter__(self):
                """进入上下文时获取锁，支持重试"""
                start_time = time.time()
                
                for attempt in range(self.retry_times + 1):
                    try:
                        # 检查超时
                        if self.timeout and (time.time() - start_time) > self.timeout:
                            raise LockTimeoutError(
                                f"获取锁超时: {self.lock_key}, 超时时间: {self.timeout}秒"
                            )
                        
                        # 尝试获取锁
                        self.lock_id = self.redis_client_cls.acquire_lock_sync(
                            self.lock_key, 
                            self.expire
                        )
                        
                        if self.lock_id:
                            logger.debug(f"成功获取锁: {self.lock_key}, 尝试次数: {attempt + 1}")
                            return self
                        
                        # 获取锁失败，准备重试
                        if attempt < self.retry_times:
                            wait_time = self._calculate_wait_time(attempt)
                            logger.debug(
                                f"获取锁失败，{wait_time:.2f}秒后重试: {self.lock_key}, "
                                f"尝试次数: {attempt + 1}/{self.retry_times + 1}"
                            )
                            time.sleep(wait_time)
                    
                    except Exception as e:
                        logger.error(f"获取锁异常: {self.lock_key}, 尝试次数: {attempt + 1}, 错误: {e}")
                        
                        # 如果是最后一次尝试，抛出异常
                        if attempt >= self.retry_times:
                            raise LockAcquireError(f"获取锁失败: {self.lock_key}, 原因: {e}")
                        
                        # 异常情况下也要等待重试
                        wait_time = self._calculate_wait_time(attempt)
                        time.sleep(wait_time)
                
                # 所有重试都失败
                raise LockAcquireError(f"获取锁失败: {self.lock_key}, 已重试 {self.retry_times} 次")
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                """退出上下文时释放锁"""
                if self.lock_id:
                    try:
                        success = self.redis_client_cls.release_lock_sync(
                            self.lock_key, 
                            self.lock_id
                        )
                        if success:
                            logger.debug(f"成功释放锁: {self.lock_key}")
                        else:
                            logger.warning(f"释放锁失败: {self.lock_key}")
                    except Exception as e:
                        logger.error(f"释放锁异常: {self.lock_key}, 错误: {e}")
        
        return _DistributedLockSync()