from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Payment, UserSubscription
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Payment)
def handle_payment_status_change(sender, instance, created, **kwargs):
    """处理支付状态变化"""
    if not created and instance.status == 'success':
        # 支付成功，确保订阅是激活状态
        subscription = instance.subscription
        if subscription.status != 'active':
            subscription.status = 'active'
            subscription.save(update_fields=['status'])
            logger.info(f"Payment {instance.id} succeeded, activated subscription {subscription.id}")