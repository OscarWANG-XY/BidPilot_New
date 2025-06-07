from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.services.structuring.state import StateEnum

import logging
logger = logging.getLogger(__name__)

router = APIRouter()


# ========================= 新增文档管理相关模型 =========================

class GetDocumentResponse(BaseModel):
    """获取文档响应"""
    success: bool
    message: str
    project_id: str
    doc_type: str
    version: Optional[str] = None
    document: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class UpdateDocumentRequest(BaseModel):
    """更新文档请求"""
    edited_document: Dict[str, Any] = Field(description="编辑后的文档数据")

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


# ========================= 新增文档管理端点 =========================

@router.get("/raw-document/{project_id}", response_model=GetDocumentResponse)
async def get_raw_document(
    project_id: str,
):
    """
    端点5: 获取原始文档（供前端编辑器加载）
    """
    try:
        logger.info(f"开始获取项目{project_id}的原始招标文档raw_document的内容")
        
        # # 验证文档类型
        # if doc_type != "raw_document":
        #     raise HTTPException(
        #         status_code=400, 
        #         detail=f"无效的文档类型: {doc_type}, 当端口只支持raw_document的读取"
        #     )
        
        # 获取cache实例
        from app.services.structuring.cache import Cache
        cache = Cache(project_id)

        # # ----- 验证: 是否已raw_document? -----
        # # 获取agent历史状态
        # historical_agent_states = await cache._get_sorted_agent_states()
        # if not historical_agent_states:
        #     raise HTTPException(
        #         status_code=404, 
        #         detail="agent历史状态未找，项目分析尚未开始"
        #     )

        # # 找到最后一个非失败状态
        # last_success_state = None
        # for state in historical_agent_states: #由于history是按时间倒序排列，所以会找到第一个非失败的状态。 
        #     if state.current_internal_state != SystemInternalState.FAILED:
        #         last_success_state = state.current_internal_state
        #         break

        # if last_success_state in [SystemInternalState.EXTRACTING_DOCUMENT]:
        #     raise HTTPException(
        #         status_code=404, 
        #         detail="招标文档正在提取中，尚无raw_document"
        #     )
        

        # ----- 通过以上验证后，确认由raw_document, 开始提取 -----

        raw_document = await cache.get_document('raw_document')
        if not raw_document:
            raise HTTPException(
                status_code=404, 
                detail="招标文档尚未提取，无raw_document"
            )

        return GetDocumentResponse(
            success=True,
            message=f"成功获取 raw_document 文档",
            project_id=project_id,
            doc_type="raw_document",
            document=raw_document,
            metadata=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"提取项目{project_id}的raw_document失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"提取raw_document失败: {str(e)}")


@router.get("/review-suggestions/{project_id}", response_model=GetDocumentResponse)
async def get_review_suggestions(
    project_id: str,
):
    """
    端点6: 获取最终文档（供前端编辑器加载）
    """
    try:
        logger.info(f"开始获取项目{project_id}的最终招标文档final_document的内容")
        
        # 获取cache实例
        from app.services.structuring.cache import Cache
        cache = Cache(project_id)

        # ----- 通过以上验证后，确认由final_document, 开始提取 -----

        review_suggestions = await cache.get_document('review_suggestions')
        if not review_suggestions:
            raise HTTPException(
                status_code=404, 
                detail="定稿的招标文档final_document尚未生成"
            )

        return GetDocumentResponse(
            success=True,
            message=f"成功获取 raw_document 文档",
            project_id=project_id,
            doc_type="review_suggestions",
            document=review_suggestions,
            metadata=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"提取项目{project_id}的final_document失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"提取final_document失败: {str(e)}")



@router.get("/final-document/{project_id}", response_model=GetDocumentResponse)
async def get_final_document(
    project_id: str,
):
    """
    端点6: 获取最终文档（供前端编辑器加载）
    """
    try:
        logger.info(f"开始获取项目{project_id}的最终招标文档final_document的内容")
        
        # 获取cache实例
        from app.services.structuring.cache import Cache
        cache = Cache(project_id)

        # ----- 通过以上验证后，确认由final_document, 开始提取 -----

        final_document = await cache.get_document('final_document')
        if not final_document:
            raise HTTPException(
                status_code=404, 
                detail="定稿的招标文档final_document尚未生成"
            )

        return GetDocumentResponse(
            success=True,
            message=f"成功获取 raw_document 文档",
            project_id=project_id,
            doc_type="final_document",
            document=final_document,
            metadata=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"提取项目{project_id}的final_document失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"提取final_document失败: {str(e)}")



@router.put("/final-document/{project_id}", response_model=UpdateDocumentResponse)
async def update_final_document(
    project_id: str,
    request: UpdateDocumentRequest
):
    """
    端点6: 提交编辑（保存为final_document）
    用户在编辑器中完成编辑后，通过此端点保存最终文档
    """
    try:
        logger.info(f"更新项目{project_id}的final_document")
        
        # 获取cache实例
        from app.services.structuring.cache import Cache
        cache = Cache(project_id)
        
        # 检查当前状态是否允许编辑
        agent_state = await cache.get_agent_state()
        current_internal_state = agent_state.state
        if current_internal_state not in [StateEnum.STRUCTURE_REVIEWED]:
            raise HTTPException(
                status_code=400, 
                detail=f"当前状态不允许编辑: {current_internal_state.value if current_internal_state else 'unknown'}"
            )
        

        # 将文档保存为final_document
        success = await cache._save_document('final_document', request.edited_document)
        
        if not success:
            raise HTTPException(status_code=500, detail="保存final_document失败")
        
        return UpdateDocumentResponse(
            success=True,
            message=f"final_document 已成功保存",
            project_id=project_id,
            doc_type="final_document",
            saved_at=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新项目{project_id}的final文档失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新文档失败: {str(e)}")






# @router.get("/document/{project_id}/compare", response_model=DocumentCompareResponse)
# async def compare_documents(
#     project_id: str,
#     source: str = "intro",
#     target: str = "final"
# ):
#     """
#     端点7: 版本对比（可选，增强体验）
#     对比两个版本的文档，帮助用户了解编辑前后的变化
#     """
#     try:
#         logger.info(f"Comparing documents for project {project_id}: {source} vs {target}")
        
#         # 验证文档类型
#         valid_doc_types = ["raw", "h1", "h2h3", "intro", "final", "edited"]
#         if source not in valid_doc_types or target not in valid_doc_types:
#             raise HTTPException(
#                 status_code=400, 
#                 detail=f"无效的文档类型。支持的类型: {', '.join(valid_doc_types)}"
#             )
        
#         if source == target:
#             raise HTTPException(
#                 status_code=400, 
#                 detail="源文档和目标文档不能相同"
#             )
        
#         # 获取agent实例
#         from app.services.structuring.agent import create_or_get_agent
#         agent = await create_or_get_agent(project_id)
        
#         # 获取两个文档
#         source_document = await agent.get_document(source)
#         target_document = await agent.get_document(target)
        
#         # 检查文档是否存在
#         if not source_document:
#             raise HTTPException(
#                 status_code=404, 
#                 detail=f"源文档 {source} 不存在"
#             )
        
#         if not target_document:
#             raise HTTPException(
#                 status_code=404, 
#                 detail=f"目标文档 {target} 不存在"
#             )
        
#         # 生成对比元数据
#         comparison_metadata = {
#             "source_type": source,
#             "target_type": target,
#             "compared_at": datetime.now().isoformat(),
#             "source_size": len(json.dumps(source_document)),
#             "target_size": len(json.dumps(target_document)),
#         }
        
#         # 简单的统计对比（可以扩展为更详细的diff算法）
#         try:
#             source_str = json.dumps(source_document, ensure_ascii=False)
#             target_str = json.dumps(target_document, ensure_ascii=False)
            
#             comparison_metadata.update({
#                 "size_difference": len(target_str) - len(source_str),
#                 "similarity_ratio": _calculate_similarity(source_str, target_str)
#             })
#         except Exception as e:
#             logger.warning(f"Failed to calculate document similarity: {e}")
        
#         return DocumentCompareResponse(
#             success=True,
#             message=f"成功对比文档 {source} 和 {target}",
#             project_id=project_id,
#             source_type=source,
#             target_type=target,
#             source_document=source_document,
#             target_document=target_document,
#             comparison_metadata=comparison_metadata
#         )
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Error comparing documents for project {project_id}: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"文档对比失败: {str(e)}")

# def _calculate_similarity(text1: str, text2: str) -> float:
#     """
#     计算两个文本的相似度（简单实现）
#     返回0-1之间的相似度分数
#     """
#     try:
#         # 简单的字符级相似度计算
#         if not text1 and not text2:
#             return 1.0
#         if not text1 or not text2:
#             return 0.0
        
#         # 使用最长公共子序列的思想计算相似度
#         len1, len2 = len(text1), len(text2)
#         max_len = max(len1, len2)
#         min_len = min(len1, len2)
        
#         # 简单的相似度计算：基于长度差异
#         length_similarity = min_len / max_len if max_len > 0 else 1.0
        
#         # 可以扩展为更复杂的算法，如编辑距离、余弦相似度等
#         return length_similarity
        
#     except Exception:
#         return 0.0
