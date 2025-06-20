from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.services.cache import Cache

import logging
logger = logging.getLogger(__name__)

router = APIRouter()


# ========================= 新增文档管理相关模型 =========================

class GetDocumentResponse(BaseModel):
    """获取文档响应"""
    key_name: str
    content: Optional[Dict[str, Any]] = None

class UpdateDocumentRequest(BaseModel):
    """更新文档请求"""
    edited_content: Dict[str, Any] = Field(description="编辑后的文档数据")

class UpdateDocumentResponse(BaseModel):
    """更新文档响应"""
    success: bool
    message: str


# ========================= 新增文档管理端点 =========================


# 构建一个通用路由函数，通过请求的key_name， 获取cache中的document

@router.get("/{project_id}/documents/{key_name}", response_model=GetDocumentResponse)
async def get_document(
    project_id: str,
    key_name: str,
):
    """
    通用路由函数，通过请求的key_name， 获取cache中的document
    """
    try:
        logger.info(f"开始获取项目{project_id}的{key_name}文档的内容")
        # 获取cache实例
        
        cache = Cache(project_id)
        
        # get_document直接返回文档本身，不带key_name
        target_document = await cache.get_document(key_name)


        if not target_document:
            return GetDocumentResponse(
                key_name=key_name,
                content=None,
            )

        return GetDocumentResponse(
            key_name=key_name,
            content=target_document,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"提取项目{project_id}的{key_name}失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"提取{key_name}失败: {str(e)}")




@router.put("/{project_id}/documents/{key_name}", response_model=UpdateDocumentResponse)
async def update_document(
    project_id: str,
    key_name: str,
    request: UpdateDocumentRequest
):
    """
    通用路由函数，通过请求的key_name， 更新cache中的document
    """
    try:
        logger.info(f"更新项目{project_id}的final_document")
        
        # 获取cache实例
        cache = Cache(project_id)
        
        # TODO 考虑添加 编辑权限 的验证 


        # 将文档保存为final_document
        success = await cache.save_document(key_name, request.edited_content)
        
        if not success:
            raise HTTPException(status_code=500, detail="保存final_document失败")
        
        return UpdateDocumentResponse(
            success=True,
            message=f"{key_name} 已成功保存",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新项目{project_id}的final文档失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新文档失败: {str(e)}")





# class DocumentCompareResponse(BaseModel):
#     """文档对比响应"""
#     success: bool
#     message: str
#     project_id: str
#     source_type: str
#     target_type: str
#     source_document: Optional[Dict[str, Any]] = None
#     target_document: Optional[Dict[str, Any]] = None
#     comparison_metadata: Optional[Dict[str, Any]] = None


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
