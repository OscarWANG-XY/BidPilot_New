# app/tasks/structuring_tasks.py
import logging
import asyncio
from typing import Optional, Dict, Any
from celery import current_task

from app.core.celery_app import celery_app
from app.services.structuring.agent import get_agent, remove_agent
from app.services.structuring.state import ProcessingStep

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="structuring.run_analysis")
def run_structuring_analysis(self, project_id: str) -> Dict[str, Any]:
    """
    Celery任务：运行文档结构化分析
    
    Args:
        project_id: 项目ID
        
    Returns:
        任务执行结果
    """
    task_id = self.request.id
    logger.info(f"[Celery-{task_id}] 开始文档结构化分析: project_id={project_id}")
    
    try:
        # 在Celery任务中运行异步代码
        result = asyncio.run(_run_analysis_async(project_id, task_id))
        
        logger.info(f"[Celery-{task_id}] 文档结构化分析完成: project_id={project_id}")
        return result
        
    except Exception as e:
        error_msg = f"文档结构化分析失败: {str(e)}"
        logger.error(f"[Celery-{task_id}] {error_msg}")
        
        # 清理agent实例
        asyncio.run(remove_agent(project_id))
        
        # 重新抛出异常让Celery处理重试
        raise Exception(error_msg)


async def _run_analysis_async(project_id: str, task_id: str) -> Dict[str, Any]:
    """
    异步执行分析流程
    """
    agent = None
    try:
        # 获取agent实例
        agent = await get_agent(project_id)
        
        # 开始分析流程
        result = await agent.start_analysis()
        
        return {
            "status": "success",
            "project_id": project_id,
            "task_id": task_id,
            "message": "文档结构化分析完成",
            "result": result
        }
        
    except Exception as e:
        logger.error(f"异步分析流程失败: {str(e)}")
        raise
        
    finally:
        # 清理资源
        if agent:
            try:
                await agent.cleanup()
            except Exception as cleanup_error:
                logger.warning(f"清理agent资源时出错: {cleanup_error}")


@celery_app.task(bind=True, name="structuring.retry_analysis")
def retry_structuring_analysis(self, project_id: str) -> Dict[str, Any]:
    """
    Celery任务：重试文档结构化分析
    """
    task_id = self.request.id
    logger.info(f"[Celery-{task_id}] 重试文档结构化分析: project_id={project_id}")
    
    try:
        # 先清理之前的agent实例
        asyncio.run(remove_agent(project_id))
        
        # 重新运行分析
        result = asyncio.run(_run_analysis_async(project_id, task_id))
        
        logger.info(f"[Celery-{task_id}] 重试分析完成: project_id={project_id}")
        return result
        
    except Exception as e:
        error_msg = f"重试分析失败: {str(e)}"
        logger.error(f"[Celery-{task_id}] {error_msg}")
        raise Exception(error_msg)


@celery_app.task(bind=True, name="structuring.process_step")
def process_single_step(self, project_id: str, step: str, user_input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Celery任务：处理单个步骤（用于手动控制流程）
    """
    task_id = self.request.id
    logger.info(f"[Celery-{task_id}] 处理单个步骤: project_id={project_id}, step={step}")
    
    try:
        result = asyncio.run(_process_step_async(project_id, step, user_input, task_id))
        
        logger.info(f"[Celery-{task_id}] 步骤处理完成: project_id={project_id}, step={step}")
        return result
        
    except Exception as e:
        error_msg = f"步骤处理失败: {str(e)}"
        logger.error(f"[Celery-{task_id}] {error_msg}")
        raise Exception(error_msg)


async def _process_step_async(project_id: str, step: str, user_input: Optional[Dict[str, Any]], task_id: str) -> Dict[str, Any]:
    """
    异步处理单个步骤
    """
    agent = None
    try:
        agent = await get_agent(project_id)
        
        # 转换步骤字符串为枚举
        processing_step = ProcessingStep(step)
        
        # 执行步骤
        result = await agent.process_step(processing_step, user_input)
        
        return {
            "status": "success",
            "project_id": project_id,
            "task_id": task_id,
            "step": step,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"异步步骤处理失败: {str(e)}")
        raise 