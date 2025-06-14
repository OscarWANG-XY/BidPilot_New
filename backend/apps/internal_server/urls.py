from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectInternalViewSet

router = DefaultRouter()

# 下面决定了url路径里有api/internal/projects/
router.register(r'projects', ProjectInternalViewSet, basename='project-internal')


urlpatterns = [
    path('', include(router.urls)),
]
