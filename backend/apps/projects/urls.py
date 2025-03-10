from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet

router = DefaultRouter()
# 以下的'' 不要用'projects'，由于config/urls.py 中已经注册了'projects'，不然会出现重复的projects/projects  
router.register('', ProjectViewSet, basename='project') 

urlpatterns = [
    path('', include(router.urls)),
]