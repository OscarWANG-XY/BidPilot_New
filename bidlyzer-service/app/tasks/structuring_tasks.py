# app/tasks/structuring_tasks.py
import logging
import asyncio
from typing import Optional, Dict, Any
from celery import current_task

from app.core.celery_app import celery_app
from app.services.structuring.agent import create_or_get_agent, remove_agent
from app.services.structuring.state import ProcessingStep

logger = logging.getLogger(__name__)


# 定义项目特定的异常类
class StructuringAnalysisError(Exception):
    """文档结构化分析异常"""
    pass


class StructuringRetryError(Exception):
    """重试分析异常"""
    pass


class StructuringStepError(Exception):
    """步骤处理异常"""
    pass


# @celery_app.task(bind=True, name="structuring.run_analysis")
# def run_structuring_analysis(self, project_id: str) -> Dict[str, Any]:
#     """
#     Celery任务：运行文档结构化分析
    
#     Args:
#         project_id: 项目ID
        
#     Returns:
#         任务执行结果
#     """

#     # 获取任务id
#     task_id = self.request.id
#     logger.info(f"[Celery-{task_id}] 开始文档结构化分析: project_id={project_id}")
    

#     # 启动异步任务和异常处理
#     try:
#         result = asyncio.run(_run_structuring_agent_async(project_id, task_id))
#         logger.info(f"[Celery-{task_id}] 分析完成: project_id={project_id}")
#         return result
        
#     except Exception as e:
#         error_msg = f"文档结构化分析失败: {str(e)}"
#         logger.error(f"[Celery-{task_id}] {error_msg}", exc_info=True)
        
#         # 清理agent实例
#         try:
#             asyncio.run(remove_agent(project_id))
#         except Exception as cleanup_error:
#             logger.warning(f"[Celery-{task_id}] 清理agent实例失败: {cleanup_error}")
        
#         # 重新抛出异常让Celery处理重试，保留异常链
#         raise StructuringAnalysisError(error_msg) from e


# async def _run_structuring_agent_async(project_id: str, task_id: str) -> Dict[str, Any]:
#     """
#     异步执行分析流程
#     """
#     agent = None
#     try:
#         # 获取agent实例
#         agent = await create_or_get_agent(project_id)
        
#         # 获取当前状态并转换为字典
#         current_state = await agent.current_state
#         agent_state_dict = current_state.model_dump() if current_state else None
        
#         return {
#             "status": "success",
#             "project_id": project_id,
#             "task_id": task_id,
#             "message": "文档结构化分析完成",
#             "agent_state": agent_state_dict,
#         }
        
#     except Exception as e:
#         logger.error(f"[Task-{task_id}] 异步分析流程失败: {str(e)}", exc_info=True)
#         raise  # 直接重新抛出，保留完整栈信息
        
#     finally:
#         # 修复：移除对不存在的cleanup方法的调用
#         # 改为使用remove_agent函数进行清理
#         if agent:
#             try:
#                 await remove_agent(project_id)
#                 logger.info(f"[Task-{task_id}] 已清理agent实例")
#             except Exception as cleanup_error:
#                 logger.warning(f"[Task-{task_id}] 清理agent实例时出错: {cleanup_error}")


# @celery_app.task(bind=True, name="structuring.retry_analysis")
# def retry_structuring_analysis(self, project_id: str) -> Dict[str, Any]:
#     """
#     Celery任务：重试文档结构化分析
#     """
#     task_id = self.request.id
#     logger.info(f"[Celery-{task_id}] 重试文档结构化分析: project_id={project_id}")
    
#     try:
#         # 先清理之前的agent实例
#         asyncio.run(remove_agent(project_id))
        
#         # 重新运行分析
#         result = asyncio.run(_run_structuring_agent_async(project_id, task_id))
        
#         logger.info(f"[Celery-{task_id}] 重试分析完成: project_id={project_id}")
#         return result
        
#     except Exception as e:
#         error_msg = f"重试分析失败: {str(e)}"
#         logger.error(f"[Celery-{task_id}] {error_msg}", exc_info=True)
#         raise StructuringRetryError(error_msg) from e

