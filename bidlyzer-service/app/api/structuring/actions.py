from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from app.services.cache import Cache
from app.services.structuring.state_manager import create_state_manager
from app.services.structuring.state import UserAction, StateEnum

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

# ========================= 请求/响应模型 =========================

class StartAnalysisResponse(BaseModel):
    """开始分析响应"""
    success: bool
    message: str
    project_id: str
    initial_state: str


class RetryAnalysisRequest(BaseModel):
    """重试分析请求"""
    project_id: str = Field(description="项目ID")

class RetryAnalysisResponse(BaseModel):
    """重试分析响应"""
    success: bool
    message: str
    project_id: str
    current_state: str



# ========================= 端点实现 =========================

@router.post("/start-analysis/{project_id}", response_model=StartAnalysisResponse)
async def start_analysis(
    project_id: str,
    background_tasks: BackgroundTasks
):
    """
    端点1: 开始分析
    用户上传文件后点击分析按钮触发此端点
    """
    try:
        logger.info(f"开始分析项目 {project_id}")
        
        # 创建状态管理器实例
        cache = Cache(project_id)
        
        # 检查项目是否已经在处理中
        current_state = await cache.get_agent_state()
        # 如果已经有状态了
        if current_state:
            if current_state.state in [StateEnum.STRUCTURE_REVIEWED]:
                return StartAnalysisResponse(
                    success=True,
                    message="项目已结构化分析已完成，请人工审核结果",
                    project_id=project_id,
                    initial_state=current_state.state.value
                )
            else:

                # # 使用Celery任务在后台继续之前分析
                # from app.tasks.structuring_tasks import run_structuring_analysis
                # run_structuring_analysis.delay(project_id)

                return StartAnalysisResponse(
                    success=False,
                    message="恢复项目分析进程，请等待完成",
                    project_id=project_id,
                    initial_state=current_state.state.value
                )
            

        # 如果没有状态，则开始分析
        else:
        
            # 使用Celery任务在后台启动全新的分析流程
            # from app.tasks.structuring_tasks import run_structuring_analysis
            # run_structuring_analysis.delay(project_id)
            
            logger.info(f"Celery任务已启动, project_id={project_id}")
            
            return StartAnalysisResponse(
                success=True,
                message=f"Structuring Agent已添加到任务队列中，请通过Agent状态机查看进度更新",
                project_id=project_id,
                initial_state=""
            )
        
    except Exception as e:
        logger.error(f"Error starting analysis for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"启动分析失败: {str(e)}")


@router.post("/retry-analysis", response_model=RetryAnalysisResponse)
async def retry_analysis(
    request: RetryAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    端点3: 重试分析
    当流程出现错误时，用户可以点击重新开始
    """
    try:
        logger.info(f"Retrying analysis for project {request.project_id}")
        
        # 创建状态管理器实例
        state_manager = create_state_manager(request.project_id)
        
        # 检查当前状态是否允许重试
        current_state = await state_manager.get_internal_state()
        if current_state != StateEnum.FAILED:
            return RetryAnalysisResponse(
                success=False,
                message="当前状态不需要重试",
                project_id=request.project_id,
                current_state=current_state.value if current_state else "unknown"
            )
        
        # 处理重试操作
        success = await state_manager.handle_user_action(
            action=UserAction.RETRY
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="重试操作失败")
        
        # 使用Celery任务重新启动分析
        from app.tasks.structuring_tasks import retry_structuring_analysis
        celery_task = retry_structuring_analysis.delay(request.project_id)
        
        logger.info(f"重试Celery任务已启动: task_id={celery_task.id}, project_id={request.project_id}")
        
        return RetryAnalysisResponse(
            success=True,
            message=f"重试已开始，请通过SSE监听进度更新。Celery任务ID: {celery_task.id}",
            project_id=request.project_id,
            current_state="EXTRACTING_DOCUMENT"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying analysis for project {request.project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"重试失败: {str(e)}")
