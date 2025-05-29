from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import asyncio
import json
import logging
from datetime import datetime

from app.services.structuring.state_manager import create_state_manager
from app.services.structuring.state import UserAction, SystemInternalState, UserVisibleState
from app.core.redis_helper import RedisClient

logger = logging.getLogger(__name__)

router = APIRouter()

# ========================= 请求/响应模型 =========================

class StartAnalysisRequest(BaseModel):
    """开始分析请求 (done)"""
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

# ========================= 新增文档管理相关模型 =========================

class GetDocumentResponse(BaseModel):
    """获取文档响应"""
    success: bool
    message: str
    project_id: str
    doc_type: str
    document: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class UpdateDocumentRequest(BaseModel):
    """更新文档请求"""
    document: Dict[str, Any] = Field(description="编辑后的文档数据")
    user_notes: Optional[str] = Field(default=None, description="用户编辑备注")
    save_as_final: bool = Field(default=True, description="是否保存为最终文档")

class UpdateDocumentResponse(BaseModel):
    """更新文档响应"""
    success: bool
    message: str
    project_id: str
    doc_type: str
    saved_at: str

class DocumentCompareResponse(BaseModel):
    """文档对比响应"""
    success: bool
    message: str
    project_id: str
    source_type: str
    target_type: str
    source_document: Optional[Dict[str, Any]] = None
    target_document: Optional[Dict[str, Any]] = None
    comparison_metadata: Optional[Dict[str, Any]] = None

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
        logger.info(f"开始分析项目 {request.project_id}")
        
        # 创建状态管理器实例
        state_manager = create_state_manager(request.project_id)
        
        # 检查项目是否已经在处理中
        current_state = await state_manager.get_internal_state()
        if current_state and current_state not in [SystemInternalState.COMPLETED, SystemInternalState.FAILED]:
            return StartAnalysisResponse(
                success=False,
                message="项目正在处理中，请等待完成或重试",
                project_id=request.project_id,
                initial_state=current_state.value
            )
        
        # 初始化Agent状态（从文档提取开始）
        agent_state = await state_manager.initialize_agent()
        
        # 使用Celery任务在后台启动分析流程
        from app.tasks.structuring_tasks import run_structuring_analysis
        celery_task = run_structuring_analysis.delay(request.project_id)
        
        logger.info(f"Celery任务已启动: task_id={celery_task.id}, project_id={request.project_id}")
        
        return StartAnalysisResponse(
            success=True,
            message=f"分析已开始，请通过SSE监听进度更新。Celery任务ID: {celery_task.id}",
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
        
        # 创建状态管理器实例
        state_manager = create_state_manager(request.project_id)
        
        # 检查当前状态是否允许编辑
        current_state = await state_manager.get_internal_state()
        if current_state not in [SystemInternalState.AWAITING_EDITING]:
            raise HTTPException(
                status_code=400, 
                detail=f"当前状态不允许编辑: {current_state.value if current_state else 'unknown'}"
            )
        
        # 处理用户编辑完成操作
        success = await state_manager.handle_user_action(
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
        
        # 创建状态管理器实例
        state_manager = create_state_manager(request.project_id)
        
        # 检查当前状态是否允许重试
        current_state = await state_manager.get_internal_state()
        if current_state != SystemInternalState.FAILED:
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

@router.get("/sse/{project_id}")
async def sse_stream(project_id: str, request: Request):
    """
    端点4: SSE流 (使用中间件认证)
    Agent向前端实时推送状态更新和进度信息
    
    认证方式: 
    - HTTP请求: Authorization: Bearer <token>
    - SSE连接: URL参数 ?token=<token>
    - 认证由JWTAuthMiddleware统一处理
    """
    async def event_generator():
        """SSE事件生成器"""
        try:
            # 从中间件获取用户信息
            user_info = request.state.user
            user_id = user_info.get('user_id', 'unknown')
            
            logger.info(f"SSE连接已建立 - 项目: {project_id}, 用户: {user_id}")
            
            # Redis订阅通道
            channel = f"sse:structuring:{project_id}"
            
            # 发送初始连接确认（包含用户信息）
            yield f"data: {json.dumps({
                'event': 'connected', 
                'data': {
                    'projectId': project_id,
                    'userId': user_id,
                    'message': '连接已建立'
                }
            })}\n\n"
            
            # 发送当前状态（如果存在）
            current_state = await create_state_manager(project_id).get_agent_state()
            if current_state:
                initial_data = {
                    "event": "state_update",
                    "data": {
                        "projectId": project_id,
                        "internalState": current_state.current_internal_state.value,
                        "userState": current_state.current_user_state.value,
                        "progress": current_state.overall_progress,
                        "message": "当前状态"
                    }
                }
                yield f"data: {json.dumps(initial_data)}\n\n"
            
            # 监听Redis消息
            pubsub = await RedisClient.subscribe(channel)
            
            # 发送一个测试消息（可选，用于调试）
            test_message = {
                "event": "test",
                "data": {
                    "projectId": project_id,
                    "message": "这是一个测试消息",
                    "timestamp": "2024-01-01T00:00:00Z"
                }
            }
            yield f"data: {json.dumps(test_message)}\n\n"
            
            try:
                # 监听消息
                while True:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message is not None:
                        try:
                            # 解析消息
                            message_data = json.loads(message['data']) if isinstance(message['data'], str) else message['data']
                            
                            # 格式化为SSE格式
                            sse_data = {
                                "event": message_data.get("event", "update"),
                                "data": message_data.get("data", message_data)
                            }
                            
                            yield f"data: {json.dumps(sse_data)}\n\n"
                            
                        except json.JSONDecodeError as e:
                            logger.error(f"Error parsing SSE message: {e}")
                            continue
                    
                    # 检查客户端是否断开连接
                    if await request.is_disconnected():
                        break
                        
            finally:
                # 确保清理pubsub连接
                await RedisClient.unsubscribe(pubsub, channel)
                await pubsub.close()
            
        except Exception as e:
            logger.error(f"Error in SSE stream for project {project_id}: {str(e)}")
            # 发送错误消息
            error_data = {
                "event": "error",
                "data": {
                    "projectId": project_id,
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
        agent_state = await create_state_manager(project_id).get_agent_state()
        
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

# 原来的后台任务函数已被Celery任务替代，详见 app/tasks/structuring_tasks.py

# ========================= 新增文档管理端点 =========================

@router.get("/document/{project_id}", response_model=GetDocumentResponse)
async def get_document(
    project_id: str,
    doc_type: str = "intro"
):
    """
    端点5: 获取文档（供前端编辑器加载）
    支持的文档类型: raw, h1, h2h3, intro, final
    """
    try:
        logger.info(f"Getting document for project {project_id}, type: {doc_type}")
        
        # 验证文档类型
        valid_doc_types = ["raw", "h1", "h2h3", "intro", "final"]
        if doc_type not in valid_doc_types:
            raise HTTPException(
                status_code=400, 
                detail=f"无效的文档类型: {doc_type}。支持的类型: {', '.join(valid_doc_types)}"
            )
        
        # 获取agent实例
        from app.services.structuring.agent import create_or_get_agent
        agent = await create_or_get_agent(project_id)
        
        # 检查项目状态
        agent_state = await agent.current_state
        if not agent_state:
            raise HTTPException(
                status_code=404, 
                detail="项目未找到或尚未开始分析"
            )
        
        # 检查对应的步骤结果是否存在
        doc_type_to_flag_map = {
            'raw': agent_state.has_extracted_content,
            'h1': agent_state.has_h1_analysis_result,
            'h2h3': agent_state.has_h2h3_analysis_result,
            'intro': agent_state.has_introduction_content,
            'final': agent_state.has_final_document
        }
        
        if not doc_type_to_flag_map.get(doc_type, False):
            # 获取可用的文档类型
            available_types = await agent.get_available_document_types()
            
            # 根据当前状态提供相应的提示
            current_internal_state = agent_state.current_internal_state
            if doc_type == "intro" and current_internal_state.value in [
                "extracting_document", "document_extracted", 
                "analyzing_outline_h1", "outline_h1_analyzed",
                "analyzing_outline_h2h3", "outline_h2h3_analyzed",
                "adding_introduction"
            ]:
                raise HTTPException(
                    status_code=202, 
                    detail=f"文档正在处理中，当前状态: {current_internal_state.value}。可用文档类型: {', '.join(available_types) if available_types else '无'}"
                )
            
            raise HTTPException(
                status_code=404, 
                detail=f"文档类型 {doc_type} 暂不可用。可用类型: {', '.join(available_types) if available_types else '无'}"
            )
        
        # 获取文档
        document = await agent.get_document(doc_type)
        
        if not document:
            raise HTTPException(
                status_code=500, 
                detail=f"文档标记显示存在但实际获取失败，可能是缓存过期"
            )
        
        # 获取文档元数据
        metadata = {
            "doc_type": doc_type,
            "project_id": project_id,
            "retrieved_at": datetime.now().isoformat(),
            "document_size": len(json.dumps(document)) if document else 0,
            "available_types": await agent.get_available_document_types()
        }
        
        # 添加状态信息
        metadata.update({
            "current_state": agent_state.current_internal_state.value,
            "progress": agent_state.overall_progress,
            "last_updated": agent_state.updated_at.isoformat(),
            "step_results": {
                "has_extracted_content": agent_state.has_extracted_content,
                "has_h1_analysis_result": agent_state.has_h1_analysis_result,
                "has_h2h3_analysis_result": agent_state.has_h2h3_analysis_result,
                "has_introduction_content": agent_state.has_introduction_content,
                "has_final_document": agent_state.has_final_document
            }
        })
        
        return GetDocumentResponse(
            success=True,
            message=f"成功获取 {doc_type} 文档",
            project_id=project_id,
            doc_type=doc_type,
            document=document,
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取文档失败: {str(e)}")

@router.put("/document/{project_id}/edit", response_model=UpdateDocumentResponse)
async def update_document(
    project_id: str,
    request: UpdateDocumentRequest
):
    """
    端点6: 提交编辑（保存为final_document）
    用户在编辑器中完成编辑后，通过此端点保存最终文档
    """
    try:
        logger.info(f"Updating document for project {project_id}")
        
        # 获取agent实例
        from app.services.structuring.agent import create_or_get_agent
        agent = await create_or_get_agent(project_id)
        
        # 检查当前状态是否允许编辑
        current_state = await agent.current_internal_state
        if current_state not in [SystemInternalState.AWAITING_EDITING, SystemInternalState.COMPLETED]:
            raise HTTPException(
                status_code=400, 
                detail=f"当前状态不允许编辑: {current_state.value if current_state else 'unknown'}"
            )
        
        # 保存文档
        if request.save_as_final:
            # 保存为最终文档
            success = await agent._save_document('final_document', request.document)
            doc_type = "final"
        else:
            # 保存为临时编辑版本（可以扩展支持多个编辑版本）
            success = await agent._save_document('edited_document', request.document)
            doc_type = "edited"
        
        if not success:
            raise HTTPException(status_code=500, detail="保存文档失败")
        
        # 如果保存为最终文档且当前状态是等待编辑，则触发完成编辑操作
        if request.save_as_final and current_state == SystemInternalState.AWAITING_EDITING:
            # 使用状态管理器处理编辑完成操作
            success = await create_state_manager(project_id).handle_user_action(
                action=UserAction.COMPLETE_EDITING,
                payload={
                    "document": request.document,
                    "user_notes": request.user_notes
                }
            )
            
            if not success:
                logger.warning(f"文档已保存但状态更新失败: {project_id}")
        
        return UpdateDocumentResponse(
            success=True,
            message=f"文档已成功保存为 {doc_type} 版本",
            project_id=project_id,
            doc_type=doc_type,
            saved_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating document for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新文档失败: {str(e)}")

@router.get("/document/{project_id}/compare", response_model=DocumentCompareResponse)
async def compare_documents(
    project_id: str,
    source: str = "intro",
    target: str = "final"
):
    """
    端点7: 版本对比（可选，增强体验）
    对比两个版本的文档，帮助用户了解编辑前后的变化
    """
    try:
        logger.info(f"Comparing documents for project {project_id}: {source} vs {target}")
        
        # 验证文档类型
        valid_doc_types = ["raw", "h1", "h2h3", "intro", "final", "edited"]
        if source not in valid_doc_types or target not in valid_doc_types:
            raise HTTPException(
                status_code=400, 
                detail=f"无效的文档类型。支持的类型: {', '.join(valid_doc_types)}"
            )
        
        if source == target:
            raise HTTPException(
                status_code=400, 
                detail="源文档和目标文档不能相同"
            )
        
        # 获取agent实例
        from app.services.structuring.agent import create_or_get_agent
        agent = await create_or_get_agent(project_id)
        
        # 获取两个文档
        source_document = await agent.get_document(source)
        target_document = await agent.get_document(target)
        
        # 检查文档是否存在
        if not source_document:
            raise HTTPException(
                status_code=404, 
                detail=f"源文档 {source} 不存在"
            )
        
        if not target_document:
            raise HTTPException(
                status_code=404, 
                detail=f"目标文档 {target} 不存在"
            )
        
        # 生成对比元数据
        comparison_metadata = {
            "source_type": source,
            "target_type": target,
            "compared_at": datetime.now().isoformat(),
            "source_size": len(json.dumps(source_document)),
            "target_size": len(json.dumps(target_document)),
        }
        
        # 简单的统计对比（可以扩展为更详细的diff算法）
        try:
            source_str = json.dumps(source_document, ensure_ascii=False)
            target_str = json.dumps(target_document, ensure_ascii=False)
            
            comparison_metadata.update({
                "size_difference": len(target_str) - len(source_str),
                "similarity_ratio": _calculate_similarity(source_str, target_str)
            })
        except Exception as e:
            logger.warning(f"Failed to calculate document similarity: {e}")
        
        return DocumentCompareResponse(
            success=True,
            message=f"成功对比文档 {source} 和 {target}",
            project_id=project_id,
            source_type=source,
            target_type=target,
            source_document=source_document,
            target_document=target_document,
            comparison_metadata=comparison_metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing documents for project {project_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"文档对比失败: {str(e)}")

def _calculate_similarity(text1: str, text2: str) -> float:
    """
    计算两个文本的相似度（简单实现）
    返回0-1之间的相似度分数
    """
    try:
        # 简单的字符级相似度计算
        if not text1 and not text2:
            return 1.0
        if not text1 or not text2:
            return 0.0
        
        # 使用最长公共子序列的思想计算相似度
        len1, len2 = len(text1), len(text2)
        max_len = max(len1, len2)
        min_len = min(len1, len2)
        
        # 简单的相似度计算：基于长度差异
        length_similarity = min_len / max_len if max_len > 0 else 1.0
        
        # 可以扩展为更复杂的算法，如编辑距离、余弦相似度等
        return length_similarity
        
    except Exception:
        return 0.0
