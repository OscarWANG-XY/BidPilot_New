import json
import logging
import time
import uuid
from typing import Dict, List, Optional, Union, Generator

import redis
from django.conf import settings

logger = logging.getLogger(__name__)


class RedisStreamStatus:
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class RedisManager:
    """Redis 管理器，用于处理大模型流式输出的存储和检索"""
    
    def __init__(self):
        """初始化 Redis 连接"""
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD,
                decode_responses=True  # 自动将字节解码为字符串
            )
            self.default_expiry = 3600  # 默认过期时间：1小时
            
            # 测试连接(测试用)
            ping_result = self.redis_client.ping()
            logger.info(f"Redis 连接测试: {ping_result}")
        except Exception as e:
            logger.error(f"Redis 连接失败: {str(e)}")
            raise
    
    def create_stream_key(self, stream_id: str) -> str:
        """创建用于存储流式输出的键名"""
        return f"model_stream:{stream_id}"
    
    def create_status_key(self, stream_id: str) -> str:
        """创建用于存储任务状态的键名"""
        return f"model_status:{stream_id}"
    
    def add_stream_chunk(self, stream_id: str, chunk: str, index: int = None) -> bool:
        """
        添加一个输出块到流
        
        Args:
            stream_id: 流ID
            chunk: 输出内容块
            index: 块的序号，如果为None则自动递增
            
        Returns:
            bool: 操作是否成功
        """
        try:
            stream_key = self.create_stream_key(stream_id)
            
            # 如果没有提供索引，获取当前长度作为索引
            if index is None:
                index = self.redis_client.llen(stream_key)
            
            # 存储数据
            data = json.dumps({
                "index": index,
                "content": chunk,
                "timestamp": time.time()
            })
            
            # 添加到列表
            self.redis_client.rpush(stream_key, data)
            
            # 设置过期时间
            self.redis_client.expire(stream_key, self.default_expiry)
            
            return True
        except Exception as e:
            logger.error(f"添加流块失败: {str(e)}, stream_id={stream_id}")
            return False
    
    def mark_stream_complete(self, stream_id: str) -> bool:
        """
        标记流式输出已完成
        
        Args:
            stream_id: 流ID
            
        Returns:
            bool: 操作是否成功
        """
        try:
            # 添加完成标记
            self.add_stream_chunk(stream_id, "DONE", -1)
            
            # 更新任务状态
            status_key = self.create_status_key(stream_id)
            self.redis_client.hset(status_key, "status", RedisStreamStatus.COMPLETED)
            self.redis_client.expire(status_key, self.default_expiry)
            
            return True
        except Exception as e:
            logger.error(f"标记流完成失败: {str(e)}, stream_id={stream_id}")
            return False
    
    def mark_stream_failed(self, stream_id: str, error_message: str) -> bool:
        """
        标记流式输出失败
        
        Args:
            stream_id: 流ID
            error_message: 错误信息
            
        Returns:
            bool: 操作是否成功
        """
        try:
            # 添加错误标记
            self.add_stream_chunk(stream_id, f"ERROR: {error_message}", -2)
            
            # 更新任务状态
            status_key = self.create_status_key(stream_id)
            self.redis_client.hset(status_key, "status", RedisStreamStatus.FAILED)
            self.redis_client.hset(status_key, "error", error_message)
            self.redis_client.expire(status_key, self.default_expiry)
            
            return True
        except Exception as e:
            logger.error(f"标记流失败失败: {str(e)}, stream_id={stream_id}")
            return False
    
    def get_stream_chunks(self, stream_id: str, start: int = 0, end: int = -1) -> List[Dict]:
        """
        获取流式输出的块
        
        Args:
            stream_id: 流ID
            start: 起始索引
            end: 结束索引，-1表示到末尾
            
        Returns:
            List[Dict]: 输出块列表
        """
        try:
            stream_key = self.create_stream_key(stream_id)
            chunks = self.redis_client.lrange(stream_key, start, end)
            
            result = []
            for chunk in chunks:
                try:
                    data = json.loads(chunk)
                    result.append(data)
                except json.JSONDecodeError:
                    # 如果解析失败，以原始形式添加
                    result.append({"index": -999, "content": chunk, "timestamp": 0})
            
            return result
        except Exception as e:
            logger.error(f"获取流块失败: {str(e)}, stream_id={stream_id}")
            return []
    
    def stream_chunks_generator(self, stream_id: str, poll_interval: float = 0.1) -> Generator[str, None, None]:
        """
        生成器函数，用于流式获取输出块
        """

        stream_key = self.create_stream_key(stream_id)
        last_index = -1
        done = False

        # 添加初始消息
        yield "data: 正在等待分析结果...\n\n"

        while not done:
            try:
                # 获取新块
                current_length = self.redis_client.llen(stream_key)
                
                if current_length > last_index + 1:
                    # 有新块可用
                    chunks = self.redis_client.lrange(stream_key, last_index + 1, current_length - 1)
                    
                    for chunk in chunks:
                        try:
                            data = json.loads(chunk)
                            content = data.get("content", "")
                            
                            # 检查是否是完成或错误标记
                            if content == "DONE" or content.startswith("ERROR:"):
                                done = True
                                if content.startswith("ERROR:"):
                                    yield f"event: error\ndata: {content[6:]}\n\n"
                                else:
                                    yield "event: done\ndata: \n\n"
                                break
                            
                            yield f"data: {content}\n\n"
                            
                        except json.JSONDecodeError:
                            # 如果解析失败，以原始形式发送
                            yield f"data: {chunk}\n\n"
                    
                    last_index = current_length - 1
                else:
                    # 检查任务是否已完成或失败
                    status_key = self.create_status_key(stream_id)
                    status = self.redis_client.hget(status_key, "status")
                    
                    if status in ["COMPLETED", "FAILED"]:
                        if status == "FAILED":
                            error = self.redis_client.hget(status_key, "error") or "Unknown error"
                            yield f"event: error\ndata: {error}\n\n"
                        done = True
                    else:
                        # 等待新数据
                        time.sleep(poll_interval)
            
            except Exception as e:
                logger.error(f"流式生成器错误: {str(e)}, stream_id={stream_id}")
                yield f"event: error\ndata: Internal server error\n\n"
                done = True
    
    def initialize_stream(self, stream_id: str, metadata: Dict = None) -> bool:
        """
        初始化任务状态
        
        Args:
            stream_id: 流ID
            metadata: 任务元数据
            
        Returns:
            bool: 操作是否成功
        """
        try:
            status_key = self.create_status_key(stream_id)
            
            # 设置基本状态
            self.redis_client.hset(status_key, "status", RedisStreamStatus.PENDING)
            self.redis_client.hset(status_key, "start_time", time.time())
            
            # 添加元数据
            if metadata:
                for key, value in metadata.items():
                    if isinstance(value, (dict, list)):
                        value = json.dumps(value)
                    self.redis_client.hset(status_key, key, value)
            
            # 设置过期时间
            self.redis_client.expire(status_key, self.default_expiry)
            
            return True
        except Exception as e:
            logger.error(f"初始化任务失败: {str(e)}, stream_id={stream_id}")
            return False
    
    def update_stream_status(self, stream_id: str, status: str, metadata: Dict = None) -> bool:
        """
        更新任务状态
        
        Args:
            stream_id: 流ID
            status: 新状态
            metadata: 更新的元数据
            
        Returns:
            bool: 操作是否成功
        """
        try:
            status_key = self.create_status_key(stream_id)
            logger.info(f"更新流状态: stream_id={stream_id}, status={status}, key={status_key}")
            
            # 更新状态
            self.redis_client.hset(status_key, "status", status)
            self.redis_client.hset(status_key, "update_time", time.time())
            
            # 更新元数据
            if metadata:
                for key, value in metadata.items():
                    if isinstance(value, (dict, list)):
                        value = json.dumps(value)
                    self.redis_client.hset(status_key, key, value)
            
            # 刷新过期时间
            self.redis_client.expire(status_key, self.default_expiry)

            # 验证数据是否写入(测试用)
            verification = self.redis_client.hgetall(status_key)
            logger.info(f"验证流状态: key={status_key}, data={verification}")
                        
            return True
        except Exception as e:
            logger.error(f"更新任务状态失败: {str(e)}, stream_id={stream_id}")
            return False
    
    def get_stream_status(self, stream_id: str) -> Dict:
        """
        获取任务状态
        
        Args:
            stream_id: 流ID
            
        Returns:
            Dict: 任务状态信息
        """
        try:
            status_key = self.create_status_key(stream_id)
            data = self.redis_client.hgetall(status_key)
            
            # 尝试解析JSON字段
            for key, value in data.items():
                try:
                    if key not in ["status", "error", "start_time", "update_time"]:
                        data[key] = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    pass
            
            return data
        except Exception as e:
            logger.error(f"获取任务状态失败: {str(e)}, stream_id={stream_id}")
            return {"status": "UNKNOWN", "error": str(e)}
    
    def generate_stream_id(self) -> str:
        """生成唯一的流ID"""
        return str(uuid.uuid4()) 