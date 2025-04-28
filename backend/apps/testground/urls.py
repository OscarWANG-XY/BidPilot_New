from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import testgroundViewSet, test_sse, websocket_test

router = DefaultRouter()
router.register('', testgroundViewSet, basename='testground')

urlpatterns = [
    path('test-sse/', test_sse, name='test-sse'),  # 添加SSE测试路由
    path('', include(router.urls)),
    path('websocket-test/', websocket_test, name='websocket_test'),
]
