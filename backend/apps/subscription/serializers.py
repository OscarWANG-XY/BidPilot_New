from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription, Payment, SubscriptionLog


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """订阅计划序列化器"""
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)
    
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'plan_type', 'plan_type_display', 'price', 
                  'project_limit', 'description', 'is_active']


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """用户订阅序列化器"""
    plan = SubscriptionPlanSerializer(read_only=True)
    plan_id = serializers.IntegerField(write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSubscription
        fields = ['id', 'user', 'plan', 'plan_id', 'start_date', 'end_date', 
                  'status', 'status_display', 'is_active', 'remaining_projects',
                  'days_remaining', 'created_at']
        read_only_fields = ['user', 'start_date', 'end_date', 'status', 'remaining_projects']
    
    def get_days_remaining(self, obj):
        """计算订阅剩余天数"""
        from django.utils import timezone
        if obj.status != 'active':
            return 0
        
        now = timezone.now()
        if now > obj.end_date:
            return 0
        
        return (obj.end_date - now).days


class PaymentSerializer(serializers.ModelSerializer):
    """支付记录序列化器"""
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'user', 'subscription', 'amount', 'payment_method', 
                  'payment_method_display', 'status', 'status_display', 
                  'transaction_id', 'payment_time', 'created_at']
        read_only_fields = ['user', 'subscription', 'amount', 'status', 
                            'transaction_id', 'payment_time']


class SubscriptionLogSerializer(serializers.ModelSerializer):
    """订阅日志序列化器"""
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = SubscriptionLog
        fields = ['id', 'user', 'subscription', 'action', 'action_display', 
                  'description', 'created_at']
        read_only_fields = ['user', 'subscription', 'action', 'description']


class CreateSubscriptionSerializer(serializers.Serializer):
    """创建订阅的请求序列化器"""
    plan_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=['wechat', 'alipay', 'mock'], default='mock')


class PaymentCallbackSerializer(serializers.Serializer):
    """支付回调请求序列化器"""
    payment_id = serializers.IntegerField()
    transaction_id = serializers.CharField(allow_blank=True, required=False)
    success = serializers.BooleanField()
    data = serializers.JSONField(required=False)