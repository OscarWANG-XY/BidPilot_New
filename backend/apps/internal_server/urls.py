from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectAgentStorageViewSet

router = DefaultRouter()

# 下面决定了url路径里有api/internal/projects/

router.register(r'projects', ProjectAgentStorageViewSet, basename='project-agent-storage')


urlpatterns = [
    path('', include(router.urls)),
]
