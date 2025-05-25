from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import asyncio
import json
import logging

from app.services.structuring.state_manager import structuring_state_manager
from app.services.structuring.state import UserAction, SystemInternalState, UserVisibleState
from app.core.redis_helper import RedisClient

logger = logging.getLogger(__name__)

router = APIRouter()

# ========================= 请求/响应模型 =========================

class StartAnalysisRequest(BaseModel):
    """开始分析请求"""
    project_id: str = Field(description="项目ID")

class StartAnalysisResponse(BaseModel):
    """开始分析响应"""
    success: bool
    message: str
    project_id: str
    initial_state: str

class EditDocumentRequest(BaseModel):
    """编辑文档请求"""
    project_id: str = Field(description="项目ID")
    document: Dict[str, Any] = Field(description="编辑后的文档数据")
    user_notes: Optional[str] = Field(default=None, description="用户备注")

class EditDocumentResponse(BaseModel):
    """编辑文档响应"""
    success: bool
    message: str
    project_id: str

class RetryAnalysisRequest(BaseModel):
    """重试分析请求"""
    project_id: str = Field(description="项目ID")

class RetryAnalysisResponse(BaseModel):
    """重试分析响应"""
    success: bool
    message: str
    project_id: str
    current_state: str

class StateStatusResponse(BaseModel):
    """状态查询响应"""
    project_id: str
    user_state: str
    internal_state: str
    progress: int
    message: Optional[str] = None

# ========================= 端点实现 =========================

@router.post("/start-analysis", response_model=StartAnalysisResponse)
async def start_analysis(
    request: StartAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    端点1: 开始分析
    用户上传文件后点击分析按钮触发此端点
    """
    try:
        logger.info(f"Starting analysis for project {request.project_id}")
        
        # 检查项目是否已经在处理中
        current_state = await structuring_state_manager.get_internal_state(request.project_id)
        if current_state and current_state not in [SystemInternalState.COMPLETED, SystemInternalState.FAILED]:
            return StartAnalysisResponse(
                success=False,
                message="项目正在处理中，请等待完成或重试",
                project_id=request.project_id,
                initial_state=current_state.value
            )
        
        # 初始化Agent状态（从文档提取开始）
        agent_state = await structuring_state_manager.initialize_agent(request.project_id)
        
        # 在后台启动分析流程
        # background_tasks.add_task(_run_structuring_analysis, request.project_id, request.file_path)
        
        return StartAnalysisResponse(
            success=True,
            message="分析已开始，请通过SSE监听进度更新",
            project_id=request.project_id,
            initial_state=agent_state.current_internal_state.value
        )
        
    except Exception as e:
        logger.error(f"Error starting analysis for project {request.project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"启动分析失败: {str(e)}")

@router.post("/edit-document", response_model=EditDocumentResponse)
async def edit_document(request: EditDocumentRequest):
    """
    端点2: 用户编辑文档
    用户在编辑器中完成编辑后提交
    """
    try:
        logger.info(f"Processing document edit for project {request.project_id}")
        
        # 检查当前状态是否允许编辑
        current_state = await structuring_state_manager.get_internal_state(request.project_id)
        if current_state not in [SystemInternalState.AWAITING_EDITING, SystemInternalState.EDITING_IN_PROGRESS]:
            raise HTTPException(
                status_code=400, 
                detail=f"当前状态不允许编辑: {current_state.value if current_state else 'unknown'}"
            )
        
        # 处理用户编辑完成操作
        success = await structuring_state_manager.handle_user_action(
            project_id=request.project_id,
            action=UserAction.COMPLETE_EDITING,
            payload={
                "document": request.document,
                "user_notes": request.user_notes
            }
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="处理编辑操作失败")
        
        return EditDocumentResponse(
            success=True,
            message="文档编辑完成",
            project_id=request.project_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing document edit for project {request.project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"处理编辑失败: {str(e)}")

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
        
        # 检查当前状态是否允许重试
        current_state = await structuring_state_manager.get_internal_state(request.project_id)
        if current_state != SystemInternalState.FAILED:
            return RetryAnalysisResponse(
                success=False,
                message=f"当前状态不需要重试: {current_state.value if current_state else 'unknown'}",
                project_id=request.project_id,
                current_state=current_state.value if current_state else "unknown"
            )
        
        # 处理重试操作
        success = await structuring_state_manager.handle_user_action(
            project_id=request.project_id,
            action=UserAction.RETRY
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="重试操作失败")
        
        # 在后台重新启动分析流程
        background_tasks.add_task(_run_structuring_analysis, request.project_id, None)
        
        return RetryAnalysisResponse(
            success=True,
            message="重试已开始，请通过SSE监听进度更新",
            project_id=request.project_id,
            current_state=SystemInternalState.EXTRACTING_DOCUMENT.value
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying analysis for project {request.project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"重试失败: {str(e)}")

@router.get("/sse/{project_id}")
async def sse_stream(project_id: str):
    """
    端点4: SSE流
    Agent向前端实时推送状态更新和进度信息
    """
    async def event_generator():
        """SSE事件生成器"""
        try:
            # Redis订阅通道
            channel = f"sse:structuring:{project_id}"
            
            # 发送初始连接确认
            yield f"data: {json.dumps({'event': 'connected', 'project_id': project_id})}\n\n"
            
            # 发送当前状态（如果存在）
            current_state = await structuring_state_manager.get_agent_state(project_id)
            if current_state:
                initial_data = {
                    "event": "state_update",
                    "data": {
                        "project_id": project_id,
                        "internal_state": current_state.current_internal_state.value,
                        "user_state": current_state.current_user_state.value,
                        "progress": current_state.overall_progress,
                        "message": "当前状态"
                    }
                }
                yield f"data: {json.dumps(initial_data)}\n\n"
            
            # 监听Redis消息
            async for message in RedisClient.subscribe(channel):
                if message:
                    try:
                        # 解析消息
                        message_data = json.loads(message) if isinstance(message, str) else message
                        
                        # 格式化为SSE格式
                        sse_data = {
                            "event": message_data.get("event", "update"),
                            "data": message_data.get("data", message_data)
                        }
                        
                        yield f"data: {json.dumps(sse_data)}\n\n"
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Error parsing SSE message: {e}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error in SSE stream for project {project_id}: {str(e)}")
            # 发送错误消息
            error_data = {
                "event": "error",
                "data": {
                    "project_id": project_id,
                    "error": str(e)
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.get("/status/{project_id}", response_model=StateStatusResponse)
async def get_status(project_id: str):
    """
    额外端点: 查询当前状态
    用于前端主动查询当前处理状态
    """
    try:
        agent_state = await structuring_state_manager.get_agent_state(project_id)
        
        if not agent_state:
            raise HTTPException(status_code=404, detail="项目状态未找到")
        
        return StateStatusResponse(
            project_id=project_id,
            user_state=agent_state.current_user_state.value,
            internal_state=agent_state.current_internal_state.value,
            progress=agent_state.overall_progress,
            message=agent_state.error_message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting status for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取状态失败: {str(e)}")

# ========================= 后台任务 =========================

async def _run_structuring_analysis(project_id: str, file_path: Optional[str]):
    """
    后台运行结构化分析流程
    这里使用占位符实现，实际的agent逻辑将在后续实现
    """
    try:
        logger.info(f"Starting background structuring analysis for project {project_id}")
        
        # TODO: 这里将调用实际的structuring agent
        # 目前使用占位符模拟流程
        
        # 占位符: 模拟文档提取
        await structuring_state_manager.transition_to_state(
            project_id, 
            SystemInternalState.DOCUMENT_EXTRACTED,
            progress=20,
            message="文档提取完成"
        )
        
        # 占位符: 模拟H1分析
        await asyncio.sleep(2)
        await structuring_state_manager.transition_to_state(
            project_id,
            SystemInternalState.OUTLINE_H1_ANALYZED,
            progress=50,
            message="主要章节分析完成"
        )
        
        # 占位符: 模拟H2H3分析
        await asyncio.sleep(2)
        await structuring_state_manager.transition_to_state(
            project_id,
            SystemInternalState.OUTLINE_H2H3_ANALYZED,
            progress=80,
            message="子章节分析完成"
        )
        
        # 占位符: 模拟添加引言
        await asyncio.sleep(1)
        await structuring_state_manager.transition_to_state(
            project_id,
            SystemInternalState.AWAITING_EDITING,
            progress=90,
            message="文档结构化完成，等待用户编辑"
        )
        
        logger.info(f"Structuring analysis completed for project {project_id}")
        
    except Exception as e:
        logger.error(f"Error in background structuring analysis for project {project_id}: {str(e)}")
        # 更新状态为失败
        await structuring_state_manager.transition_to_state(
            project_id,
            SystemInternalState.FAILED,
            message=f"分析失败: {str(e)}"
        )
