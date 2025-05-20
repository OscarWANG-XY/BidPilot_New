from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/frontend", tags=["frontend"])


# 前端点击开始分析