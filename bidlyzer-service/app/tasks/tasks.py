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


@celery_app.task
def test_task(message: str):
    """一个简单的测试任务"""
    import time
    time.sleep(5)  # 模拟耗时操作
    return f"任务完成: {message}"


@celery_app.task
def send_email_task(email: str, subject: str):
    """发送邮件任务示例"""
    import time
    time.sleep(2)  # 模拟发送邮件
    return f"邮件已发送到 {email}，主题: {subject}"



# @celery_app.task(bind=True, name="structuring.analysis")
# def run_structuring(self, project_id: str) -> Dict[str, Any]:
#     """
#     Celery任务：重试文档结构化分析
#     """
#     task_id = self.request.id
#     logger.info(f"[Celery-{task_id}] 重试文档结构化分析: project_id={project_id}")
    
#     try:
#         structuring = Structuring(project_id)
#         # 重新运行分析
#         result = asyncio.run(structuring.process(ProcessingStep.EXTRACT))
        
#         logger.info(f"[Celery-{task_id}] 重试分析完成: project_id={project_id}")
#         return result
        
#     except Exception as e:
#         error_msg = f"重试分析失败: {str(e)}"
#         logger.error(f"[Celery-{task_id}] {error_msg}", exc_info=True)
#         raise StructuringError(error_msg) from e



# @celery_app.task(bind=True, name="structuring.analysis_with_lock")
# def run_structuring(self, project_id: str) -> Dict[str, Any]:
#     """
#     Celery任务：重试文档结构化分析（带分布式锁保护）
#     """
#     task_id = self.request.id
#     logger.info(f"[Celery-{task_id}] 开始文档结构化分析: project_id={project_id}")
    
#     async def _async_structuring_task():
#         # 使用项目ID作为锁的唯一标识
#         lock_key = f"lock:structuring:{project_id}"
        
#         try:
#             async with RedisClient.distributed_lock(
#                 lock_key=lock_key,
#                 expire=1800,  # 30分钟过期，文档分析可能比较耗时
#                 auto_extend=True,  # 启用自动续期，防止长时间任务被误杀
#                 extend_interval=300,  # 每5分钟续期一次
#                 retry_times=2,  # 只重试2次，避免长时间等待
#                 timeout=30  # 30秒内获取不到锁就放弃
#             ):
#                 logger.info(f"[Celery-{task_id}] 成功获取锁，开始处理: project_id={project_id}")
                
#                 # 在锁保护下执行文档结构化分析
#                 structuring = Structuring(project_id)
#                 result = await structuring.process(ProcessingStep.EXTRACT)
                
#                 logger.info(f"[Celery-{task_id}] 文档结构化分析完成: project_id={project_id}")
#                 return {
#                     "status": "success",
#                     "project_id": project_id,
#                     "task_id": task_id,
#                     "result": result
#                 }
                
#         except LockTimeoutError:
#             # 获取锁超时 - 说明有其他任务正在处理
#             logger.warning(f"[Celery-{task_id}] 获取锁超时，项目可能正在被其他任务处理: project_id={project_id}")
#             return {
#                 "status": "skipped",
#                 "reason": "already_processing",
#                 "project_id": project_id,
#                 "task_id": task_id,
#                 "message": "项目正在被其他任务处理，跳过本次执行"
#             }
            
#         except LockAcquireError as e:
#             # 获取锁失败
#             logger.error(f"[Celery-{task_id}] 获取锁失败: project_id={project_id}, error={e}")
#             return {
#                 "status": "failed",
#                 "reason": "lock_acquire_failed", 
#                 "project_id": project_id,
#                 "task_id": task_id,
#                 "error": str(e)
#             }
            
#         except Exception as e:
#             # 业务逻辑异常
#             error_msg = f"文档结构化分析失败: {str(e)}"
#             logger.error(f"[Celery-{task_id}] {error_msg}", exc_info=True)
#             raise StructuringError(error_msg) from e
    
#     # 运行异步任务
#     return asyncio.run(_async_structuring_task())



# # ============= 增强版本：支持状态检查 =============
# @celery_app.task(bind=True, name="structuring.smart_analysis_with_lock")
# def smart_run_structuring(self, project_id: str, force: bool = False) -> Dict[str, Any]:
#     """
#     智能文档结构化分析任务
    
#     Args:
#         project_id: 项目ID
#         force: 是否强制执行（忽略正在处理的状态）
#     """
#     task_id = self.request.id
#     logger.info(f"[Celery-{task_id}] 智能文档结构化分析: project_id={project_id}, force={force}")
    
#     async def _smart_async_task():
#         lock_key = f"lock:structuring:{project_id}"
        
#         # 如果不是强制执行，先检查是否有任务正在处理
#         if not force:
#             is_processing = await RedisClient.exists(lock_key)
#             if is_processing:
#                 logger.info(f"[Celery-{task_id}] 检测到项目正在处理中，跳过: project_id={project_id}")
#                 return {
#                     "status": "skipped",
#                     "reason": "already_processing",
#                     "project_id": project_id,
#                     "task_id": task_id
#                 }
        
#         try:
#             # 根据是否强制执行调整锁的策略
#             retry_times = 0 if force else 2
#             timeout = 5 if force else 30
            
#             async with RedisClient.distributed_lock(
#                 lock_key=lock_key,
#                 expire=1800,
#                 auto_extend=True,
#                 extend_interval=300,
#                 retry_times=retry_times,
#                 timeout=timeout
#             ):
#                 logger.info(f"[Celery-{task_id}] 开始智能处理: project_id={project_id}")
                
#                 # 检查项目当前状态（可选：从数据库获取状态）
#                 structuring = Structuring(project_id)
                
#                 # 根据当前状态决定处理步骤
#                 result = await structuring.process(ProcessingStep.EXTRACT)
                
#                 logger.info(f"[Celery-{task_id}] 智能处理完成: project_id={project_id}")
#                 return {
#                     "status": "success",
#                     "project_id": project_id,
#                     "task_id": task_id,
#                     "result": result,
#                     "force_executed": force
#                 }
                
#         except LockAcquireError as e:
#             if force:
#                 # 强制执行时，如果还是获取不到锁，说明确实有问题
#                 logger.error(f"[Celery-{task_id}] 强制执行仍无法获取锁: project_id={project_id}")
#                 raise StructuringError(f"无法获取项目锁，可能存在死锁: {e}")
#             else:
#                 # 正常情况下获取不到锁，返回跳过状态
#                 return {
#                     "status": "skipped",
#                     "reason": "lock_unavailable",
#                     "project_id": project_id,
#                     "task_id": task_id
#                 }
                
#         except Exception as e:
#             error_msg = f"智能文档结构化分析失败: {str(e)}"
#             logger.error(f"[Celery-{task_id}] {error_msg}", exc_info=True)
#             raise StructuringError(error_msg) from e
    
#     return asyncio.run(_smart_async_task())


# # ============= 批量处理版本 =============
# @celery_app.task(bind=True, name="structuring.batch_analysis")
# def batch_run_structuring(self, project_ids: list[str]) -> Dict[str, Any]:
#     """
#     批量文档结构化分析任务
#     """
#     task_id = self.request.id
#     logger.info(f"[Celery-{task_id}] 批量文档结构化分析: {len(project_ids)} 个项目")
    
#     async def _batch_async_task():
#         results = {
#             "success": [],
#             "skipped": [],
#             "failed": []
#         }
        
#         # 为整个批次加锁，防止重复的批量任务
#         batch_lock_key = f"lock:batch_structuring:{hash(tuple(sorted(project_ids)))}"
        
#         async with RedisClient.distributed_lock(
#             lock_key=batch_lock_key,
#             expire=3600,  # 批量任务1小时过期
#             auto_extend=True,
#             retry_times=1,
#             timeout=10
#         ):
#             for project_id in project_ids:
#                 try:
#                     # 为每个项目单独加锁
#                     project_lock_key = f"lock:structuring:{project_id}"
                    
#                     async with RedisClient.distributed_lock(
#                         lock_key=project_lock_key,
#                         expire=1800,
#                         auto_extend=True,
#                         retry_times=0,  # 批量处理时不重试，直接跳过
#                         timeout=1  # 快速失败
#                     ):
#                         structuring = Structuring(project_id)
#                         result = await structuring.process(ProcessingStep.EXTRACT)
                        
#                         results["success"].append({
#                             "project_id": project_id,
#                             "result": result
#                         })
                        
#                         logger.info(f"[Celery-{task_id}] 批量处理成功: project_id={project_id}")
                        
#                 except LockAcquireError:
#                     # 无法获取锁，跳过该项目
#                     results["skipped"].append({
#                         "project_id": project_id,
#                         "reason": "already_processing"
#                     })
#                     logger.warning(f"[Celery-{task_id}] 批量处理跳过: project_id={project_id}")
                    
#                 except Exception as e:
#                     # 处理失败
#                     results["failed"].append({
#                         "project_id": project_id,
#                         "error": str(e)
#                     })
#                     logger.error(f"[Celery-{task_id}] 批量处理失败: project_id={project_id}, error={e}")
        
#         logger.info(f"[Celery-{task_id}] 批量处理完成: 成功={len(results['success'])}, 跳过={len(results['skipped'])}, 失败={len(results['failed'])}")
#         return results
    
#     return asyncio.run(_batch_async_task())