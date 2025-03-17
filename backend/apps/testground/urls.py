from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import testgroundViewSet

router = DefaultRouter()
router.register('', testgroundViewSet, basename='testground')

urlpatterns = [
    path('', include(router.urls)),
]
