from fastapi import APIRouter
from app.api.endpoints import users, events, django_endpoints, structuring_endpoints

# 创建主路由
api_router = APIRouter()

# 添加各模块路由
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])

api_router.include_router(structuring_endpoints.router, prefix="/structuring", tags=["structuring"])


# 添加django路由, 用于处理django发出的请求，估计用处不大。
api_router.include_router(django_endpoints.router, prefix="/django", tags=["django"])