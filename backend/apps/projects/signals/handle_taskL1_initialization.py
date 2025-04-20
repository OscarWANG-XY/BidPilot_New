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


# ============================== 项目阶段初始化 ==============================
@receiver(post_save, sender=Project)
def initialize_project_stages(sender, instance, created, **kwargs):
    """当项目创建后，初始化所有项目阶段"""
    if created:
        # logger.info(f"检测到新项目创建: {instance.id}，开始初始化项目阶段")
        
        # 直接使用StageType中的所有未注释的选项
        for stage_type in StageType:
            # 当前活动阶段设为"进行中"，其他阶段设为"未开始"
            status = StageStatus.IN_PROGRESS if stage_type == instance.current_active_stage else StageStatus.NOT_STARTED
            
            # 获取阶段的显示名称
            stage_name = stage_type.label
            
            # logger.info(f"开始创建阶段: {stage_name}, 状态: {status}")
            # 创建阶段
            stage = ProjectStage.objects.create(
                project=instance,
                stage_type=stage_type,
                name=stage_name,
                stage_status=status,
                description=f'{stage_name}阶段'
            )
            # logger.info(f"阶段创建成功: {stage_name}，状态: {status}，关联项目: {instance.id}")
            
            # 为招标文件分析阶段创建相关任务
            if stage_type == StageType.TENDER_ANALYSIS:
                # 创建招标文件上传任务
                upload_file_task = Task.objects.create(
                    stage=stage,
                    name='招标文件上传',
                    description='上传招标文件',
                    type=TaskType.UPLOAD_TENDER_FILE,
                    status=TaskStatus.PROCESSING,
                    lock_status=TaskLockStatus.UNLOCKED,
                    task_level=1
                )
                # 创建文档提取任务
                docx_extraction_task = Task.objects.create(
                    stage=stage,
                    name='招标文件信息提取',
                    description='从招标文件中提取结构化信息',
                    type=TaskType.DOCX_EXTRACTION_TASK,
                    status=TaskStatus.NOT_STARTED,
                    lock_status=TaskLockStatus.UNLOCKED,
                    docx_tiptap=None,
                    task_level=1
                )

                # 创建文档结构分析任务
                outline_analysis_task = Task.objects.create(
                    stage=stage,
                    name='文档结构分析',
                    description='分析文档结构',
                    type=TaskType.OUTLINE_ANALYSIS_TASK,
                    status=TaskStatus.NOT_STARTED,
                    lock_status=TaskLockStatus.UNLOCKED,
                    task_level=1
                )
                

                # 设置任务依赖关系
                docx_extraction_task.dependencies.add(upload_file_task)
                outline_analysis_task.dependencies.add(docx_extraction_task)

                # logger.info(f"为阶段 {stage_name} 创建了文档提取和文档树构建任务")


