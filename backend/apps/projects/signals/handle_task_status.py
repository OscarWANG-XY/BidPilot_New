import uuid
import json
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging
from ..models import (
    Project, ProjectStage,Task,
    ProjectChangeHistory, StageChangeHistory, TaskChangeHistory,
    StageType, StageStatus, TaskType, TaskStatus, TaskLockStatus
)

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=Task)
def handle_task_status_change(sender, instance, created, **kwargs):
    """
    处理任务状态变更的通用处理器
    """
    if created:
        logger.info(f"新建任务: {instance.name}, 类型: {instance.type}, 状态: {instance.status}")
        return
        
    logger.info(f"任务状态更新: {instance.name}, 类型: {instance.type}, 状态: {instance.status}, 锁定状态: {instance.lock_status}")

    # # 根据任务类型和状态调用不同的处理器
    if instance.type == TaskType.UPLOAD_TENDER_FILE:
        handle_file_upload_auto_task(instance)
    elif instance.type == TaskType.DOCX_EXTRACTION_TASK:
        handle_docx_extraction_auto_task(instance)


def handle_file_upload_auto_task(instance):
    """
    该函数目前没有特定作用
    保留 用于日志记录 和 潜在的未来拓展
    """
    logger.info(f"处理文件上传任务状态变更")
    
    # 1. 检查文件上传任务是否完成
    if instance.status == TaskStatus.COMPLETED:
        try:
            # 获取相关联的阶段
            stage = instance.stage
            
            # 2. 检查状态是否从ACTIVE转为COMPLETED
            from apps.projects.models import TaskChangeHistory
            
            status_change = TaskChangeHistory.objects.filter(
                task=instance,
                field_name='status',
                old_value=TaskStatus.PROCESSING,
                new_value=TaskStatus.COMPLETED
            ).order_by('-changed_at').first()
            
            if not status_change:
                logger.warning(f"文件上传任务状态不是从ACTIVE转为COMPLETED，跳过处理")
                return
                
            logger.info(f"检测到文件上传任务从ACTIVE转为COMPLETED")
            
            # 3. 查找文档提取任务，但不自动激活
            # 修改：不再自动将文档提取任务设为ACTIVE，而是让用户在前端手动触发
            docx_extraction_task = Task.objects.filter(
                stage=stage,
                type=TaskType.DOCX_EXTRACTION_TASK
            ).first()
            
            # 确保任务存在但不自动激活
            if docx_extraction_task:
                logger.info(f"文件上传任务已完成，文档提取任务等待用户手动触发")
            
        except Exception as e:
            logger.error(f"处理文件上传任务失败: {str(e)}")


def handle_docx_extraction_auto_task(instance):
    """
    自动触发文档内容提取，需进一步满足以下条件：
    1. DocxExtractionTask 满足 PROCESSING + UNLOCKED 状态
    2. DocxExtractionTask 状态刚从PENDING转为PROCESSING 
    3. TenderFileUploadTask 满足 COMPLETED + LOCKED 状态 （上一个任务的完成情况）
    4. 项目关联文件存在
    执行：
    a. DocxExtractionTask 状态更新为COMPLETED, 使用update()方法，避免触发post_save信号
    b. 使用Celery任务异步处理文档提取
    """

    logger.info(f"DocxExtractionTask状态更新，检查是否需要启动文档提取")

    # 1. 外围条件：DocxExtractionTask 满足 PROCESSING + UNLOCKED + docx_tiptap=None 状态
    if instance.status == TaskStatus.PROCESSING and instance.lock_status == TaskLockStatus.UNLOCKED and instance.docx_tiptap is None:

        logger.info(f"探测到 DocxExtractionTask状态为: PROCESSING + UNLOCKED")

        try:
            # 获取相关联的阶段和项目 
            stage = instance.stage
            project = stage.project


            # 2. 检查状态是否从NOT_STARTED转为PROCESSING
            status_change = TaskChangeHistory.objects.filter(
                task=instance,
                field_name='status',
                #old_value=TaskStatus.NOT_STARTED, #这里不再强制指定之前的状态，意味着我们允许从任何状态转为PROCESSING，包括failed, completed, 等。
                new_value=TaskStatus.PROCESSING
            ).order_by('-changed_at').first()
            
            if not status_change:
                logger.warning(f"DocxExtractionTask状态未变为PROCESSING，跳过处理")
                return
            
            # 可以添加日志记录原始状态
            logger.info(f"DocxExtractionTask状态从{status_change.old_value}变为PROCESSING")
            
            # b. 使用Celery任务异步处理文档提取
            from ..tasks import process_docx_extraction
            process_docx_extraction.delay(project.id)
            
            logger.info(f"已启动异步文档提取任务，project_id={project.id}")

        except Exception as e:
            logger.error(f"DocxExtractionTask处理失败: {str(e)}")
            # 发生错误时，标记为失败
            Task.objects.filter(pk=instance.pk).update(
                status=TaskStatus.FAILED
            )