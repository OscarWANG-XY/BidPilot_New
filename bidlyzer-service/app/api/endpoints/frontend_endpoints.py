from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class StartAnalysisRequest(BaseModel):
    project_id: str

# 前端点击开始分析
@router.post("/start_analysis")
async def start_analysis(request: StartAnalysisRequest):
    pass



