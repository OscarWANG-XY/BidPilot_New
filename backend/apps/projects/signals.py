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






# from django.db.models.signals import post_save
# from django.dispatch import receiver


# @receiver(post_save, sender=DocxExtractionTask)
# def handle_docx_extraction_task_update(sender, instance, created, **kwargs):
#     """
#     当 DocxExtractionTask 被更新为 PROCESSING 状态时，
#     自动触发文档处理流程
#     """

#     logger.info(f"DocxExtractionTask进入PROCESSING状态，自动启动文档提取")

#     # 只在以下条件下处理:
#     # 1. 任务被更新（不是新创建）
#     # 2. 状态为 PROCESSING
#     # 3. 确保任务未被锁定，防止循环处理
#     if not created and instance.status == TaskStatus.PROCESSING: #and instance.lock_status == TaskLockStatus.UNLOCKED:
#         try:
#             # 锁定任务，防止重复处理
#             DocxExtractionTask.objects.filter(pk=instance.pk).update(
#                 lock_status=TaskLockStatus.LOCKED
#             )
            
#             # 获取相关联的阶段和项目
#             stage = instance.stage
#             project = stage.project

#             from apps.projects.services.types import ModelData
#             from apps.projects.services._01_extract_docx_elements import DocxExtractorStep
#             docx_extractor = DocxExtractorStep()
#             docx_extractor.process(ModelData(model=Project, instance=project))
#             logger.info(f"DocxExtractionTask完成文档提取")
            
#             # 处理完成后，更新状态为COMPLETED，但不触发信号
#             DocxExtractionTask.objects.filter(pk=instance.pk).update(
#                 status=TaskStatus.COMPLETED,
#                 lock_status=TaskLockStatus.UNLOCKED
#             )
#         except Exception as e:
#             logger.error(f"DocxExtractionTask处理失败: {str(e)}")
#             # 发生错误时，解锁任务并标记为失败
#             DocxExtractionTask.objects.filter(pk=instance.pk).update(
#                 status=TaskStatus.FAILED,
#                 lock_status=TaskLockStatus.UNLOCKED
#             )
