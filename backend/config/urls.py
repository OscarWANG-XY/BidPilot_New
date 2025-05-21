"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)  # 用于生成OPENAPI文档

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return JsonResponse({"status": "healthy"})


urlpatterns = [

    # ------------------------------ 管理员API ------------------------------
    path('admin/', admin.site.urls),

    # ------------------------------ 健康检查API ------------------------------
    path('api/health/', health_check, name='health_check'),

    # ------------------------------ 测试API ------------------------------
    path('api/testground/', include('apps.testground.urls')),

    # -----------------------------面向前端的API -----------------------------
    path('api/auth/', include('apps.authentication.urls')),
    path('api/files/', include('apps.files.urls')),
    path('api/projects/', include('apps.projects.urls')),
    # path('api/doc_analysis/', include('apps.doc_analysis.urls')),
    # path('api/chat/', include('apps.chat.urls')),


    # ------------------------------ 内部API ------------------------------
    path('api/internal/', include('apps.internal_server.urls')),

    # ------------------------------ API 文档 ------------------------------
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Swagger UI:
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Redoc UI:
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),


]
