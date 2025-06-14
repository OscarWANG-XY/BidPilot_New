# app/tasks/structuring_tasks.py
import logging
import asyncio
from typing import Optional, Dict, Any
from celery import current_task
from app.core.celery_app import celery_app
from app.services.structuring.structuring import Structuring
from app.services.structuring.state import ProcessingStep

logger = logging.getLogger(__name__)


# 定义项目特定的异常类
class StructuringError(Exception):
    """文档结构化分析异常"""
    pass



@celery_app.task(bind=True, name="structuring.retry_analysis")
def run_structuring(self, project_id: str) -> Dict[str, Any]:
    """
    Celery任务：重试文档结构化分析
    """
    task_id = self.request.id
    logger.info(f"[Celery-{task_id}] 重试文档结构化分析: project_id={project_id}")
    
    try:
        structuring = Structuring(project_id)
        # 重新运行分析
        result = asyncio.run(structuring.process(ProcessingStep.EXTRACT))
        
        logger.info(f"[Celery-{task_id}] 重试分析完成: project_id={project_id}")
        return result
        
    except Exception as e:
        error_msg = f"重试分析失败: {str(e)}"
        logger.error(f"[Celery-{task_id}] {error_msg}", exc_info=True)
        raise StructuringError(error_msg) from e

