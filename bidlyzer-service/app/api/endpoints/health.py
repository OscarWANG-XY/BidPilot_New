from fastapi import APIRouter, status

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK, tags=["健康检查"])
async def health_check():
    """
    服务健康检查端点
    """
    return {
        "status": "健康",
        "message": "bidlyzer-service 运行正常"
    }   