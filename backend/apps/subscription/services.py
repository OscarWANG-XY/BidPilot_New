from django.utils import timezone
from django.db import transaction
from datetime import timedelta
import calendar
import logging

from .models import SubscriptionPlan, UserSubscription, Payment, SubscriptionLog

logger = logging.getLogger(__name__)

class SubscriptionService:
    """订阅服务类，处理订阅相关的业务逻辑"""
    
    @staticmethod
    def get_available_plans():
        """获取所有可用的订阅计划"""
        return SubscriptionPlan.objects.filter(is_active=True)
    
    @staticmethod
    def get_user_current_subscription(user):
        """获取用户当前有效的订阅"""
        now = timezone.now()
        try:
            return UserSubscription.objects.get(
                user=user,
                status='active',
                start_date__lte=now,
                end_date__gte=now
            )
        except UserSubscription.DoesNotExist:
            return None
        except UserSubscription.MultipleObjectsReturned:
            # 如果有多个活跃订阅（异常情况），返回最近创建的
            logger.warning(f"User {user.id} has multiple active subscriptions")
            return UserSubscription.objects.filter(
                user=user,
                status='active',
                start_date__lte=now,
                end_date__gte=now
            ).order_by('-created_at').first()
    
    @staticmethod
    def calculate_end_date(start_date):
        """计算订阅结束日期（一个月后）"""
        # 获取下个月的同一天（如果有）
        year = start_date.year + (start_date.month // 12)
        month = (start_date.month % 12) + 1
        
        # 处理月末边界情况
        last_day_of_month = calendar.monthrange(year, month)[1]
        day = min(start_date.day, last_day_of_month)
        
        return start_date.replace(year=year, month=month, day=day)
    
    @staticmethod
    def create_subscription(user, plan, payment_method='mock'):
        """创建新的订阅"""
        with transaction.atomic():
            # 设置订阅起止时间
            start_date = timezone.now()
            end_date = SubscriptionService.calculate_end_date(start_date)
            
            # 创建订阅记录
            subscription = UserSubscription.objects.create(
                user=user,
                plan=plan,
                start_date=start_date,
                end_date=end_date,
                status='active',
                remaining_projects=plan.project_limit
            )
            
            # 创建支付记录
            payment = Payment.objects.create(
                user=user,
                subscription=subscription,
                amount=plan.price,
                payment_method=payment_method,
                status='pending'  # 初始状态为待处理
            )
            
            # 记录订阅日志
            SubscriptionLog.objects.create(
                user=user,
                subscription=subscription,
                action='subscribe',
                description=f"用户订阅了{plan.get_plan_type_display()}，价格：¥{plan.price}/月"
            )
            
            return subscription, payment
    
    @staticmethod
    def process_payment(payment, is_success=True, transaction_id=None, response_data=None):
        """处理支付结果"""
        with transaction.atomic():
            if is_success:
                payment.status = 'success'
                payment.payment_time = timezone.now()
                payment.transaction_id = transaction_id or f"mock_{payment.id}"
                payment.raw_response = response_data or {"message": "模拟支付成功"}
                payment.save()
                
                # 支付成功，确认订阅状态
                subscription = payment.subscription
                subscription.status = 'active'
                subscription.save()
                
                return True
            else:
                payment.status = 'failed'
                payment.raw_response = response_data or {"message": "模拟支付失败"}
                payment.save()
                
                # 支付失败，更新订阅状态
                subscription = payment.subscription
                subscription.status = 'canceled'
                subscription.save()
                
                return False
    
    @staticmethod
    def renew_subscription(subscription, payment_method='mock'):
        """续订订阅"""
        with transaction.atomic():
            user = subscription.user
            plan = subscription.plan
            
            # 设置新的订阅周期
            start_date = subscription.end_date
            end_date = SubscriptionService.calculate_end_date(start_date)
            
            # 创建新的订阅记录
            new_subscription = UserSubscription.objects.create(
                user=user,
                plan=plan,
                start_date=start_date,
                end_date=end_date,
                status='active',
                remaining_projects=plan.project_limit
            )
            
            # 创建支付记录
            payment = Payment.objects.create(
                user=user,
                subscription=new_subscription,
                amount=plan.price,
                payment_method=payment_method,
                status='pending'
            )
            
            # 记录订阅日志
            SubscriptionLog.objects.create(
                user=user,
                subscription=new_subscription,
                action='renew',
                description=f"用户续订了{plan.get_plan_type_display()}，价格：¥{plan.price}/月"
            )
            
            return new_subscription, payment
    
    @staticmethod
    def upgrade_subscription(current_subscription, new_plan, payment_method='mock'):
        """升级订阅计划"""
        with transaction.atomic():
            user = current_subscription.user
            
            # 计算当前订阅剩余天数比例
            now = timezone.now()
            total_subscription_days = (current_subscription.end_date - current_subscription.start_date).days
            remaining_days = (current_subscription.end_date - now).days
            remaining_ratio = remaining_days / total_subscription_days
            
            # 计算需要额外支付的金额
            remaining_value = current_subscription.plan.price * remaining_ratio
            upgrade_cost = new_plan.price - remaining_value
            
            # 设置新的订阅
            new_subscription = UserSubscription.objects.create(
                user=user,
                plan=new_plan,
                start_date=now,
                end_date=current_subscription.end_date,  # 保持原来的结束日期
                status='active',
                remaining_projects=new_plan.project_limit
            )
            
            # 关闭旧订阅
            current_subscription.status = 'canceled'
            current_subscription.save()
            
            # 创建支付记录
            payment = Payment.objects.create(
                user=user,
                subscription=new_subscription,
                amount=upgrade_cost if upgrade_cost > 0 else 0,
                payment_method=payment_method,
                status='pending'
            )
            
            # 记录订阅日志
            SubscriptionLog.objects.create(
                user=user,
                subscription=new_subscription,
                action='upgrade',
                description=f"用户从{current_subscription.plan.get_plan_type_display()}升级到{new_plan.get_plan_type_display()}"
            )
            
            return new_subscription, payment
    
    @staticmethod
    def check_project_availability(user):
        """检查用户是否有可用项目名额"""
        subscription = SubscriptionService.get_user_current_subscription(user)
        if not subscription:
            return False, 0
        
        return subscription.remaining_projects > 0, subscription.remaining_projects
    
    @staticmethod
    def use_project_quota(user):
        """使用一个项目名额"""
        subscription = SubscriptionService.get_user_current_subscription(user)
        if not subscription or subscription.remaining_projects <= 0:
            return False
        
        with transaction.atomic():
            subscription.remaining_projects -= 1
            subscription.save()
            
            # 记录项目使用日志
            SubscriptionLog.objects.create(
                user=user,
                subscription=subscription,
                action='project_used',
                description=f"用户使用了一个项目名额，剩余：{subscription.remaining_projects}"
            )
        
        return True
    
    @staticmethod
    def check_subscription_expiry():
        """检查并更新过期的订阅（可以作为定时任务运行）"""
        now = timezone.now()
        expired_subscriptions = UserSubscription.objects.filter(
            status='active',
            end_date__lt=now
        )
        
        for subscription in expired_subscriptions:
            subscription.status = 'expired'
            subscription.save()
            
            # 记录过期日志
            SubscriptionLog.objects.create(
                user=subscription.user,
                subscription=subscription,
                action='expire',
                description="订阅已过期"
            )


class PaymentService:
    """支付服务类，处理支付相关的业务逻辑"""
    
    @staticmethod
    def create_payment_order(user, subscription, payment_method='mock'):
        """创建支付订单"""
        return Payment.objects.create(
            user=user,
            subscription=subscription,
            amount=subscription.plan.price,
            payment_method=payment_method,
            status='pending'
        )
    
    @staticmethod
    def mock_payment(payment, success=True):
        """模拟支付过程（开发测试用）"""
        payment_time = timezone.now()
        transaction_id = f"mock_{payment.id}_{payment_time.timestamp()}"
        
        response_data = {
            "payment_id": payment.id,
            "transaction_id": transaction_id,
            "amount": float(payment.amount),
            "status": "success" if success else "failed",
            "time": payment_time.isoformat()
        }
        
        return SubscriptionService.process_payment(
            payment, 
            is_success=success, 
            transaction_id=transaction_id, 
            response_data=response_data
        )
    
    @staticmethod
    def wechat_pay(payment):
        """微信支付接口（占位）"""
        # TODO: 实现微信支付API调用
        logger.info(f"调用微信支付API，金额：{payment.amount}")
        return PaymentService.mock_payment(payment)
    
    @staticmethod
    def alipay(payment):
        """支付宝支付接口（占位）"""
        # TODO: 实现支付宝API调用
        logger.info(f"调用支付宝API，金额：{payment.amount}")
        return PaymentService.mock_payment(payment)
    
    @staticmethod
    def process_payment_by_method(payment):
        """根据支付方式处理支付"""
        if payment.payment_method == 'wechat':
            return PaymentService.wechat_pay(payment)
        elif payment.payment_method == 'alipay':
            return PaymentService.alipay(payment)
        else:  # 默认使用模拟支付
            return PaymentService.mock_payment(payment)
    
    @staticmethod
    def get_payment_history(user):
        """获取用户的支付历史"""
        return Payment.objects.filter(user=user).order_by('-created_at')