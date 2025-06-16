# app/tasks/structuring_tasks.py
import logging
import asyncio
from typing import Optional, Dict, Any
from celery import current_task
from app.core.celery_app import celery_app
from app.core.redis_helper import RedisClient, LockAcquireError, LockTimeoutError
from app.services.structuring.structuring import Structuring
from app.services.structuring.state import ProcessingStep

logger = logging.getLogger(__name__)


# 定义项目特定的异常类
class StructuringError(Exception):
    """文档结构化分析异常"""
    pass

def _test_task():
    """一个简单的测试任务"""
    import time
    time.sleep(10)  # 模拟耗时操作
    return f"任务完成"

@celery_app.task
def test_task(message: str):
    """一个简单的测试任务"""

    _test_task()

    return f"任务完成: {message}"

@celery_app.task
def test_task_with_lock(message: str):
    """带锁的测试任务"""
    lock_key = f"task_lock:test_task:{message}"
    
    # 添加调试日志
    logger.info(f"[DEBUG] 尝试获取锁: {lock_key}")
    
    try:
        with RedisClient.distributed_lock_sync(
            lock_key, 
            expire=300,  # 5分钟锁定
            retry_times=0  # 不重试，直接返回
        ):
            logger.info(f"[DEBUG] 成功获取锁，开始执行任务: {lock_key}")
            _test_task()
            logger.info(f"[DEBUG] 任务执行完成: {lock_key}")
            return f"任务完成: {message}"
    except LockTimeoutError as e:
        logger.warning(f"[DEBUG] 锁超时: {lock_key}, 错误: {e}")
        return f"任务被跳过: {message}"
    except LockAcquireError as e:
        logger.error(f"[DEBUG] 获取锁失败: {lock_key}, 错误: {e}")
        return f"任务失败: {message}"

@celery_app.task
def send_email_task(email: str, subject: str):
    """发送邮件任务示例"""
    _test_task
    return f"邮件已发送到 {email}，主题: {subject}"

@celery_app.task
def send_email_task_with_lock(email: str, subject: str):
    """发送邮件任务示例"""
    lock_key = f"task_lock:send_email_task:{email}"

    try:
        with RedisClient.distributed_lock_sync(
            lock_key, 
            expire=300,  # 5分钟锁定
            retry_times=0  # 不重试，直接返回
        ):
            _test_task()
            return f"邮件已发送到 {email}，主题: {subject}"
    except LockTimeoutError:
        return f"邮件发送被跳过: {email}"
    except LockAcquireError:
        return f"邮件发送失败: {email}"

@celery_app.task
def image_process_task(image_name: str, operation: str):
    """图片处理任务 - 高优先级队列"""
    import time
    time.sleep(3)  # 模拟图片处理
    return f"图片 {image_name} 的 {operation} 操作已完成"

@celery_app.task
def test_redis_connection():
    """测试Redis连接是否正常"""
    try:
        import redis
        from app.core.config import settings
        
        # 直接测试Redis连接
        sync_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        
        # 测试基本操作
        test_key = "celery_test_key"
        test_value = "celery_test_value"
        
        # 设置值
        sync_client.set(test_key, test_value, ex=10)  # 10秒过期
        
        # 获取值
        retrieved_value = sync_client.get(test_key)
        
        # 删除值
        sync_client.delete(test_key)
        
        if retrieved_value == test_value:
            return f"Redis连接正常，设置和获取值成功"
        else:
            return f"Redis连接异常，获取值不匹配: expected={test_value}, got={retrieved_value}"
            
    except Exception as e:
        logger.error(f"Redis连接测试失败: {str(e)}")
        return f"Redis连接测试失败: {str(e)}"


@celery_app.task
def test_lock_mechanism():
    """测试锁机制本身"""
    try:
        import redis
        from app.core.config import settings
        import uuid
        
        sync_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        
        test_lock_key = "test_lock_mechanism"
        lock_id = str(uuid.uuid4())
        
        # 尝试获取锁
        success = sync_client.set(test_lock_key, lock_id, nx=True, ex=30)
        
        if success:
            # 立即释放锁
            sync_client.delete(test_lock_key)
            return f"锁机制测试成功，能够正常获取和释放锁"
        else:
            # 检查是否存在锁
            existing_value = sync_client.get(test_lock_key)
            return f"锁机制测试失败，无法获取锁。现有锁值: {existing_value}"
            
    except Exception as e:
        logger.error(f"锁机制测试失败: {str(e)}")
        return f"锁机制测试失败: {str(e)}"


@celery_app.task
def clear_test_locks():
    """清理测试锁，用于调试"""
    try:
        import redis
        from app.core.config import settings
        
        sync_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        
        # 清理所有测试相关的锁
        keys_to_clear = [
            "task_lock:test_task:TEST_DUPLICATE",
            "test_lock_mechanism"
        ]
        
        result = {}
        for key in keys_to_clear:
            existing_value = sync_client.get(key)
            ttl = sync_client.ttl(key)
            if existing_value:
                deleted = sync_client.delete(key)
                result[key] = f"已删除 (值: {existing_value}, TTL: {ttl}秒, 删除结果: {deleted})"
            else:
                result[key] = "不存在"
        
        return f"锁清理结果: {result}"
        
    except Exception as e:
        logger.error(f"清理锁失败: {str(e)}")
        return f"清理锁失败: {str(e)}"


@celery_app.task
def check_lock_status(lock_key: str):
    """检查指定锁的状态"""
    try:
        import redis
        from app.core.config import settings
        
        sync_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        
        existing_value = sync_client.get(lock_key)
        ttl = sync_client.ttl(lock_key)
        exists = sync_client.exists(lock_key)
        
        return {
            "lock_key": lock_key,
            "exists": bool(exists),
            "value": existing_value,
            "ttl": ttl,
            "ttl_meaning": "永不过期" if ttl == -1 else f"{ttl}秒后过期" if ttl > 0 else "已过期或不存在"
        }
        
    except Exception as e:
        logger.error(f"检查锁状态失败: {str(e)}")
        return f"检查锁状态失败: {str(e)}"


