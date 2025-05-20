from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.core.cache_manager import CacheManager

router = APIRouter(prefix="/django", tags=["django"])

class DocumentAnalysisRequest(BaseModel):
    """分析请求模型"""
    project_id: str
    document: Dict[str, Any]  # TiptapJson 格式文档

@router.post("/analyze")
async def analyze_document(request: DocumentAnalysisRequest):
    """
    接收招标文档分析请求
    
    - 保存TiptapJson格式的文档数据到缓存
    - 返回任务受理确认
    """
    try:
        # 存储文档到Redis缓存
        success = await CacheManager.cache_document(
            project_id=request.project_id,
            doc_type="document",
            document=request.document,
            timeout=3600
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="文档存储失败")
        
        # 初始化分析状态
        await CacheManager.cache_state(
            project_id=request.project_id,
            state_data={
                "status": "pending",
                "message": "文档已接收，等待分析",
                "progress": 0
            }
        )
        
        return {
            "status": "success",
            "message": "文档分析请求已接收",
            "project_id": request.project_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理分析请求失败: {str(e)}")


@router.get("/documents/{project_id}")
async def get_document(project_id: str):
    """
    获取存储的文档数据
    """
    document = await CacheManager.get_document(project_id, "document") 
    if not document:
        raise HTTPException(status_code=404, detail="文档未找到")


    return{
        "project_id": project_id,
        "document": document,
    }


