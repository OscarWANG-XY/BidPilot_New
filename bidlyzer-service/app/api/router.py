from fastapi import APIRouter
from app.api.endpoints import users, events, django, celery
from app.api.project import tests, sse, queries, documents, actions

# 创建主路由
api_router = APIRouter()

# 添加各模块路由
api_router.include_router(users.router, prefix="/users", tags=["tests"])
api_router.include_router(events.router, prefix="/events", tags=["tests"])
api_router.include_router(celery.router, prefix="/tests", tags=["tests"])
# 添加django路由, 用于处理django发出的请求，估计用处不大。
api_router.include_router(django.router, prefix="/django", tags=["django"])

api_router.include_router(actions.router, prefix="/projects", tags=["projects"])
api_router.include_router(documents.router, prefix="/projects", tags=["projects"])
api_router.include_router(queries.router, prefix="/projects", tags=["projects"])
api_router.include_router(sse.router, prefix="/projects", tags=["projects"])
api_router.include_router(tests.router, prefix="/projects", tags=["projects"])





