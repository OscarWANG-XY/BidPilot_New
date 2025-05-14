from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction

from .models import SubscriptionPlan, UserSubscription, Payment, SubscriptionLog
from .serializers import (
    SubscriptionPlanSerializer, UserSubscriptionSerializer, 
    PaymentSerializer, SubscriptionLogSerializer,
    CreateSubscriptionSerializer, PaymentCallbackSerializer
)
from .services import SubscriptionService, PaymentService


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """订阅计划视图集"""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserSubscriptionViewSet(viewsets.ModelViewSet):
    """用户订阅视图集"""
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取当前用户的订阅"""
        return UserSubscription.objects.filter(user=self.request.user).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """创建新订阅"""
        serializer = CreateSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        plan_id = serializer.validated_data['plan_id']
        payment_method = serializer.validated_data['payment_method']
        
        # 获取订阅计划
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"error": "订阅计划不存在或已失效"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 检查是否有正在激活的订阅
        current_subscription = SubscriptionService.get_user_current_subscription(request.user)
        if current_subscription:
            return Response(
                {"error": "您已有活跃的订阅，请先等待其到期或选择升级"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 创建新订阅
        subscription, payment = SubscriptionService.create_subscription(
            user=request.user,
            plan=plan,
            payment_method=payment_method
        )
        
        # 如果是模拟支付，直接处理支付结果
        if payment_method == 'mock':
            PaymentService.mock_payment(payment)
        
        return Response(
            {
                "subscription": UserSubscriptionSerializer(subscription).data,
                "payment": PaymentSerializer(payment).data,
                "message": "订阅创建成功，请完成支付"
            },
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """获取当前活跃的订阅"""
        subscription = SubscriptionService.get_user_current_subscription(request.user)
        if not subscription:
            return Response(
                {"message": "您当前没有活跃的订阅"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(subscription)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        """续订订阅"""
        subscription = self.get_object()
        
        # 检查是否可以续订
        if subscription.status != 'active':
            return Response(
                {"error": "只能续订活跃状态的订阅"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_method = request.data.get('payment_method', 'mock')
        new_subscription, payment = SubscriptionService.renew_subscription(
            subscription,
            payment_method=payment_method
        )
        
        # 如果是模拟支付，直接处理支付结果
        if payment_method == 'mock':
            PaymentService.mock_payment(payment)
        
        return Response(
            {
                "subscription": UserSubscriptionSerializer(new_subscription).data,
                "payment": PaymentSerializer(payment).data,
                "message": "订阅续订成功，请完成支付"
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def upgrade(self, request, pk=None):
        """升级订阅计划"""
        current_subscription = self.get_object()
        
        # 检查是否可以升级
        if current_subscription.status != 'active':
            return Response(
                {"error": "只能升级活跃状态的订阅"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 获取新计划
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response(
                {"error": "请指定升级的计划ID"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"error": "计划不存在或已失效"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 检查是否是真正的升级（新计划价格更高）
        if new_plan.price <= current_subscription.plan.price:
            return Response(
                {"error": "只能升级到价格更高的计划"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_method = request.data.get('payment_method', 'mock')
        new_subscription, payment = SubscriptionService.upgrade_subscription(
            current_subscription,
            new_plan,
            payment_method=payment_method
        )
        
        # 如果是模拟支付，直接处理支付结果
        if payment_method == 'mock':
            PaymentService.mock_payment(payment)
        
        return Response(
            {
                "subscription": UserSubscriptionSerializer(new_subscription).data,
                "payment": PaymentSerializer(payment).data,
                "message": "订阅升级成功，请完成支付"
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def check_project_availability(self, request):
        """检查用户是否有可用项目名额"""
        available, remaining = SubscriptionService.check_project_availability(request.user)
        
        return Response({
            "available": available,
            "remaining_projects": remaining
        })
    
    @action(detail=False, methods=['post'])
    def use_project_quota(self, request):
        """使用一个项目名额"""
        success = SubscriptionService.use_project_quota(request.user)
        
        if not success:
            return Response(
                {"error": "没有可用的项目名额或没有活跃的订阅"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        available, remaining = SubscriptionService.check_project_availability(request.user)
        
        return Response({
            "success": True,
            "remaining_projects": remaining
        })


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """支付记录视图集"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取当前用户的支付记录"""
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """处理支付（仅用于模拟）"""
        payment = self.get_object()
        
        # 检查支付状态
        if payment.status != 'pending':
            return Response(
                {"error": "只能处理待支付状态的订单"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 处理支付
        success = request.data.get('success', True)
        PaymentService.mock_payment(payment, success=success)
        
        return Response({
            "payment": PaymentSerializer(payment).data,
            "success": success,
            "message": "支付处理完成"
        })


class PaymentCallbackView(APIView):
    """支付回调视图（用于接收第三方支付平台的回调）"""
    permission_classes = [permissions.AllowAny]  # 支付回调通常不需要认证
    
    def post(self, request, format=None):
        serializer = PaymentCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        payment_id = serializer.validated_data['payment_id']
        success = serializer.validated_data['success']
        transaction_id = serializer.validated_data.get('transaction_id', '')
        data = serializer.validated_data.get('data', {})
        
        try:
            payment = Payment.objects.get(id=payment_id, status='pending')
        except Payment.DoesNotExist:
            return Response(
                {"error": "支付记录不存在或已处理"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 处理支付结果
        SubscriptionService.process_payment(
            payment, 
            is_success=success, 
            transaction_id=transaction_id, 
            response_data=data
        )
        
        return Response({
            "success": True,
            "message": "支付回调处理成功"
        })


class SubscriptionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """订阅日志视图集"""
    serializer_class = SubscriptionLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取当前用户的订阅日志"""
        return SubscriptionLog.objects.filter(user=self.request.user).order_by('-created_at')