from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.authentication.models import User  # 假设你的用户模型在这个路径

class SubscriptionPlan(models.Model):
    """订阅计划模型"""
    PLAN_TYPES = (
        ('basic', '基础版'),
        ('pro', '专业版'),
        ('enterprise', '企业版'),
    )

    name = models.CharField('计划名称', max_length=100)
    plan_type = models.CharField('计划类型', max_length=20, choices=PLAN_TYPES)
    price = models.DecimalField('月价格', max_digits=10, decimal_places=2)
    project_limit = models.PositiveIntegerField('项目数量限制')
    description = models.TextField('描述', blank=True)
    is_active = models.BooleanField('是否可用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '订阅计划'
        verbose_name_plural = '订阅计划'

    def __str__(self):
        return f"{self.get_plan_type_display()} - ¥{self.price}/月"


class UserSubscription(models.Model):
    """用户订阅模型"""
    STATUS_CHOICES = (
        ('active', '生效中'),
        ('expired', '已过期'),
        ('canceled', '已取消'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions', verbose_name='用户')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, verbose_name='订阅计划')
    start_date = models.DateTimeField('开始日期', default=timezone.now)
    end_date = models.DateTimeField('结束日期')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')
    remaining_projects = models.PositiveIntegerField('剩余可用项目数', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '用户订阅'
        verbose_name_plural = '用户订阅'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        # 新创建的订阅时，初始化可用项目数为计划限制
        if not self.pk and self.remaining_projects is None:
            self.remaining_projects = self.plan.project_limit
        super().save(*args, **kwargs)
    
    @property
    def is_active(self):
        """检查订阅是否处于活跃状态"""
        now = timezone.now()
        return self.status == 'active' and self.start_date <= now <= self.end_date
    
    def calculate_end_date(self, months=1):
        """计算结束日期 (从开始日期算起一个月)"""
        # 找到下个月的相同日期
        next_month = self.start_date.replace(month=self.start_date.month + 1) if self.start_date.month < 12 else self.start_date.replace(year=self.start_date.year + 1, month=1)
        # 处理月末情况 (如果当前月天数比下月多)
        try:
            return next_month
        except ValueError:
            # 如果下月没有对应日期(如1月31日->2月28/29日)，使用下月最后一天
            if self.start_date.month == 12:
                next_month = self.start_date.replace(year=self.start_date.year + 1, month=1, day=1)
            else:
                next_month = self.start_date.replace(month=self.start_date.month + 1, day=1)
            import calendar
            last_day = calendar.monthrange(next_month.year, next_month.month)[1]
            return next_month.replace(day=last_day)


class Payment(models.Model):
    """支付记录模型"""
    PAYMENT_STATUS = (
        ('pending', '处理中'),
        ('success', '支付成功'),
        ('failed', '支付失败'),
        ('refunded', '已退款'),
    )
    
    PAYMENT_METHODS = (
        ('wechat', '微信支付'),
        ('alipay', '支付宝'),
        ('mock', '模拟支付'),  # 用于开发测试
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments', verbose_name='用户')
    subscription = models.ForeignKey(UserSubscription, on_delete=models.CASCADE, related_name='payments', verbose_name='关联订阅')
    amount = models.DecimalField('金额', max_digits=10, decimal_places=2)
    payment_method = models.CharField('支付方式', max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField('状态', max_length=20, choices=PAYMENT_STATUS, default='pending')
    transaction_id = models.CharField('交易ID', max_length=100, blank=True, null=True)
    payment_time = models.DateTimeField('支付时间', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    # 支付提供商返回的原始数据
    raw_response = models.JSONField('原始响应', null=True, blank=True)

    class Meta:
        verbose_name = '支付记录'
        verbose_name_plural = '支付记录'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - ¥{self.amount} ({self.get_status_display()})"


class SubscriptionLog(models.Model):
    """订阅操作日志"""
    ACTION_TYPES = (
        ('subscribe', '新订阅'),
        ('renew', '续订'),
        ('upgrade', '升级'),
        ('cancel', '取消'),
        ('expire', '过期'),
        ('project_used', '项目使用'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscription_logs', verbose_name='用户')
    subscription = models.ForeignKey(UserSubscription, on_delete=models.CASCADE, related_name='logs', verbose_name='订阅')
    action = models.CharField('操作类型', max_length=20, choices=ACTION_TYPES)
    description = models.TextField('描述', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        verbose_name = '订阅日志'
        verbose_name_plural = '订阅日志'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_action_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"