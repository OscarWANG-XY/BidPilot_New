from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'plans', views.SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'subscriptions', views.UserSubscriptionViewSet, basename='user-subscription')
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'logs', views.SubscriptionLogViewSet, basename='subscription-log')

urlpatterns = [
    path('', include(router.urls)),
    path('payment-callback/', views.PaymentCallbackView.as_view(), name='payment-callback'),
]