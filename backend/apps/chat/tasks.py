from typing import Dict, List
from django.utils import timezone
from datetime import timedelta
from .pipelines import ChatPipeline
from .models import ChatMessage
from .context_providers import ContextManager
from celery import shared_task

import logging
logger = logging.getLogger(__name__)

# 错误处理装饰器
def handle_task_failure(task_func):
    """
    任务错误处理的装饰器
    """
    def wrapper(*args, **kwargs):
        try:
            return task_func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Task failed: {str(e)}")
            # 可以添加告警通知等
            raise
    return wrapper


@shared_task(name="chat.test_task")
@handle_task_failure
def test_task():
    return "Hello from Celery!"



@shared_task(
    name="chat.process_chat_message_task",
    bind=True,
    max_retries=3,
    default_retry_delay=5
)
@handle_task_failure
def process_chat_message_task(self, session_id: str, content: str, user_phone=None) -> Dict:
    """
    处理单条聊天消息的异步任务
    Args:
        session_id: 会话ID
        content: 消息内容
        user_phone: 用户手机号（可选）
    """
    try:
        logger.info(f"开始处理聊天消息 - 会话ID: {session_id}, 用户手机: {user_phone}")
        
        user = None
        if user_phone:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(phone=user_phone)
            logger.info(f"已获取用户信息 - 手机号: {user_phone}")
        
        # 创建pipeline实例
        pipeline = ChatPipeline()
        logger.info("已创建ChatPipeline实例")
        
        # 使用asyncio运行异步pipeline
        import asyncio
        response = asyncio.run(pipeline.process_message(
            session_id=session_id,
            content=content,
            user=user  # 现在传入的是User对象或None
        ))
        
        logger.info(f"消息处理完成 - 会话ID: {session_id}")
        return response
        
    except Exception as e:
        logger.error(f"消息处理失败: {str(e)}")
        self.retry(exc=e)


@shared_task(
    name="chat.batch_process_messages_task",
    bind=True,
    max_retries=3
)
@handle_task_failure
def batch_process_messages_task(self, messages: List[Dict], user_phone: str = None) -> List[Dict]:
    """
    批量处理消息的异步任务
    Args:
        self: 任务实例
        messages: 消息列表
        user_phone: 用户手机号（可选）
    """
    try:
        logger.info(f"开始批量处理消息 - 消息数量: {len(messages)}, 用户手机: {user_phone}")
        
        user = None
        if user_phone:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(phone=user_phone)
            logger.info(f"已获取用户信息 - 手机号: {user_phone}")
            
        pipeline = ChatPipeline()
        logger.info("已创建ChatPipeline实例，准备批量处理")
        
        # 使用asyncio运行异步pipeline
        import asyncio
        responses = asyncio.run(pipeline.process_batch(messages, user=user))
        
        logger.info(f"批量处理完成 - 成功处理消息数: {len(responses)}")
        return responses
        
    except Exception as e:
        logger.error(f"批量处理失败: {str(e)}")
        self.retry(exc=e)


@shared_task(
    name="chat.cleanup_old_sessions_task",
    bind=True
)
@handle_task_failure
def cleanup_old_sessions_task(self, days: int = 30) -> Dict:
    """
    清理旧的会话数据
    """
    try:
        logger.info(f"开始清理旧会话数据 - 清理{days}天前的数据")
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # 获取要删除的会话数量
        to_delete = ChatMessage.objects.filter(
            timestamp__lt=cutoff_date
        ).count()
        
        logger.info(f"准备删除的记录数: {to_delete}")
        
        # 执行删除
        deleted, _ = ChatMessage.objects.filter(
            timestamp__lt=cutoff_date
        ).delete()
        
        logger.info(f"清理完成 - 已删除记录数: {deleted}")
        return {
            "status": "success",
            "deleted_count": deleted,
            "cutoff_date": cutoff_date.isoformat()
        }
        
    except Exception as e:
        logger.error(f"清理会话数据失败: {str(e)}")
        raise


@shared_task(
    name="chat.update_context_cache_task",
    bind=True
)
@handle_task_failure
def update_context_cache_task(self) -> Dict:

    """
    更新上下文缓存的定期任务
    """
    try:
        logger.info("开始更新上下文缓存")
        
        context_manager = ContextManager()
        
        # 获取活跃会话列表
        active_sessions = ChatMessage.objects.values('session_id').distinct()
        
        logger.info(f"发现活跃会话数: {len(active_sessions)}")
        
        # 更新每个活跃会话的上下文缓存
        for session in active_sessions:
            session_id = session['session_id']
            logger.info(f"正在更新会话上下文 - 会话ID: {session_id}")
            # 使用asyncio运行异步上下文更新
            import asyncio
            asyncio.run(context_manager.get_combined_context(session_id))
        
        logger.info("上下文缓存更新完成")
        return {
            "status": "success",
            "sessions_updated": len(active_sessions),
            "timestamp": timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"更新上下文缓存失败: {str(e)}")
        raise

# Celery Beat 配置
CELERYBEAT_SCHEDULE = {
    'cleanup-old-sessions': {
        'task': 'cleanup_old_sessions',
        'schedule': timedelta(days=1),  # 每天运行一次
        'args': (30,)  # 清理30天前的数据
    },
    'update-context-cache': {
        'task': 'update_context_cache',
        'schedule': timedelta(minutes=30),  # 每30分钟运行一次
    }
}