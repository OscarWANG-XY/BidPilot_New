from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers  # 嵌套路由
from .views import (
    ProjectViewSet, 
    ProjectStageViewSet, 
    ProjectChangeHistoryViewSet, 
    StageChangeHistoryViewSet, 
    TaskChangeHistoryViewSet
)

router = DefaultRouter()
# 以下的'' 不要用'projects'，由于config/urls.py 中已经注册了'projects'，不然会出现重复的projects/projects  
router.register('', ProjectViewSet, basename='project') 

# 添加非嵌套路由器 - 历史记录
router.register('change-history', ProjectChangeHistoryViewSet, basename='project-change-history')
router.register('stages/change-history', StageChangeHistoryViewSet, basename='stage-change-history')
router.register('tasks/change-history', TaskChangeHistoryViewSet, basename='task-change-history')

# 添加嵌套路由器
stage_router = routers.NestedDefaultRouter(router, '', lookup='project')
stage_router.register('stages', ProjectStageViewSet, basename='project-stages')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(stage_router.urls)),  # 添加嵌套路由URLs
]
