from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from app.services.cache import Cache
from app.services.structuring.state_manager import create_state_manager
from app.services.structuring.state import UserAction, StateEnum
from app.services.bidpilot import BidPilot
import logging
logger = logging.getLogger(__name__)

router = APIRouter()

# ========================= 请求/响应模型 =========================


class RunAgentResponse(BaseModel):
    """启动agent响应"""
    success: bool
    message: str


class StartAnalysisResponse(BaseModel):
    """开始分析响应"""
    success: bool
    message: str
    project_id: str
    initial_state: str



# ========================= 端点实现 =========================


# 构建一个通用的路由端点，启动agent (执行起点由状态管理器决定)
@router.post("/{project_id}/run-agent", response_model=RunAgentResponse)
async def run_agent(
    project_id: str,
    background_tasks: BackgroundTasks
):
    """
    启动agent
    """
    try:
        logger.info(f"启动agent for project {project_id}")
                
        bidpliot = BidPilot(project_id)
        await bidpliot.run_agent()  # 理论上，这里要能直接跳入Structuring阶段

        return RunAgentResponse(
            success=True,
            message=f"agent开始执行！"
        )
    
    except Exception as e:
        logger.error(f"项目 {project_id} agent启动失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"启动agent失败: {str(e)}")




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

