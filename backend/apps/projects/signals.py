# signals.py
import logging
from django.db.models.signals import pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver, Signal
from .models import Project

logger = logging.getLogger(__name__)

# 创建自定义信号
view_finished = Signal()  # 如果需要参数，可以使用 providing_args=["request", "response"]

# DRF视图执行完成后的信号
@receiver(view_finished)
def log_api_view_access(sender, **kwargs):
    """记录API视图访问日志"""
    view = kwargs.get('view')
    request = kwargs.get('request')
    response = kwargs.get('response')
    
    # 判断是否是ProjectViewSet
    if hasattr(view, 'basename') and view.basename == 'project':
        action = getattr(view, 'action', 'unknown')
        logger.info(
            f"ProjectViewSet执行了{action}操作\n"
            f"请求方法: {request.method}\n"
            f"访问路径: {request.path}\n"
            f"状态码: {response.status_code}"
        )

# 项目保存前信号
@receiver(pre_save, sender=Project)
def log_project_before_save(sender, instance, **kwargs):
    """记录项目保存前的状态"""
    if instance.pk:  # 更新操作
        try:
            old_instance = Project.objects.get(pk=instance.pk)
            # 记录字段变化
            changes = {}
            for field in Project._meta.fields:
                field_name = field.name
                old_value = getattr(old_instance, field_name)
                new_value = getattr(instance, field_name)
                if old_value != new_value:
                    changes[field_name] = {
                        'old': old_value,
                        'new': new_value
                    }
            if changes:
                logger.info(f"项目更新，ID: {instance.pk}, 变更: {changes}")
        except Project.DoesNotExist:
            pass
    else:  # 新建操作
        logger.info(f"准备创建新项目: {instance.project_name}")

# 项目保存后信号
@receiver(post_save, sender=Project)
def log_project_after_save(sender, instance, created, **kwargs):
    """记录项目保存后的操作"""
    if created:
        logger.info(f"创建项目成功，ID: {instance.pk}, 名称: {instance.project_name}")
    else:
        logger.info(f"更新项目成功，ID: {instance.pk}, 名称: {instance.project_name}")

# 项目删除前信号
@receiver(pre_delete, sender=Project)
def log_project_before_delete(sender, instance, **kwargs):
    """记录项目删除前的状态"""
    logger.info(f"准备删除项目，ID: {instance.pk}, 名称: {instance.project_name}")

# 项目删除后信号
@receiver(post_delete, sender=Project)
def log_project_after_delete(sender, instance, **kwargs):
    """记录项目删除后的操作"""
    logger.info(f"删除项目成功，ID: {instance.pk}, 名称: {instance.project_name}")