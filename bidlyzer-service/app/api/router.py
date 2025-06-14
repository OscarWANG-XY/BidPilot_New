from fastapi import APIRouter
from app.api.endpoints import users, events, django_endpoints
from app.api.structuring import actions, documents, queries, sse
from app.api.endpoints.project import tests

# 创建主路由
api_router = APIRouter()

# 添加各模块路由
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(events.router, prefix="/events", tags=["events"])

api_router.include_router(actions.router, prefix="/structuring", tags=["structuring-actions"])
api_router.include_router(documents.router, prefix="/structuring", tags=["structuring-doucuments"])
api_router.include_router(queries.router, prefix="/structuring", tags=["structuring-queries"])
api_router.include_router(sse.router, prefix="/structuring", tags=["structuring-see"])
api_router.include_router(tests.router, prefix="/project", tags=["project-tests"])


# 添加django路由, 用于处理django发出的请求，估计用处不大。
api_router.include_router(django_endpoints.router, prefix="/django", tags=["django"])