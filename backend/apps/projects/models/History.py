import uuid
from django.db import models
from django.conf import settings
from apps.clients.tiptap.utils import (
    task_get_content_as_html, task_get_content_as_markdown,
    task_set_content_from_html, task_set_content_from_markdown
)
import logging
logger = logging.getLogger(__name__)

from .Project import Project
from .ProjectStage import ProjectStage
from .Task import Task, TaskType


class ProjectChangeHistory(models.Model):
    """项目变更历史记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operation_id = models.UUIDField(
        '操作ID', 
        default=uuid.uuid4,
        db_index=True,
        help_text='同一操作中的多个字段变更共享相同的操作ID'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='change_histories',
        verbose_name='项目'
    )
    
    # 基本字段变更
    field_name = models.CharField('变更字段', max_length=100)
    old_value = models.TextField('旧值', blank=True, null=True)
    new_value = models.TextField('新值', blank=True, null=True)
    
    # 元数据
    changed_at = models.DateTimeField('变更时间', auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='project_changes',
        verbose_name='操作人'
    )
    remarks = models.TextField('备注', blank=True)
    
    class Meta:
        verbose_name = '项目变更历史'
        verbose_name_plural = '项目变更历史'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['project', 'changed_at']),
            models.Index(fields=['field_name']),
        ]
    
    def __str__(self):
        return f"{self.project.project_name} - {self.field_name} 变更于 {self.changed_at}"


class StageChangeHistory(models.Model):
    """阶段变更历史记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operation_id = models.UUIDField(
        '操作ID', 
        default=uuid.uuid4,
        db_index=True,
        help_text='同一操作中的多个字段变更共享相同的操作ID'
    )
    stage = models.ForeignKey(
        ProjectStage,
        on_delete=models.CASCADE,
        related_name='change_histories',
        verbose_name='阶段'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='stage_change_histories',
        verbose_name='项目'
    )
    
    # 基本字段变更
    field_name = models.CharField('变更字段', max_length=100)
    old_value = models.TextField('旧值', blank=True, null=True)
    new_value = models.TextField('新值', blank=True, null=True)
    
    # 元数据
    changed_at = models.DateTimeField('变更时间', auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='stage_changes',
        verbose_name='操作人'
    )
    remarks = models.TextField('备注', blank=True)
    
    class Meta:
        verbose_name = '阶段变更历史'
        verbose_name_plural = '阶段变更历史'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['stage', 'changed_at']),
            models.Index(fields=['project', 'changed_at']),
            models.Index(fields=['field_name']),
        ]
    
    def __str__(self):
        return f"{self.stage.name} - {self.field_name} 变更于 {self.changed_at}"


class TaskChangeHistory(models.Model):
    """任务变更历史记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operation_id = models.UUIDField(
        '操作ID', 
        default=uuid.uuid4,
        db_index=True,
        help_text='同一操作中的多个字段变更共享相同的操作ID'
    )
    
    # 直接关联到Task模型
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='change_histories',
        verbose_name='任务'
    )

    stage = models.ForeignKey(
        ProjectStage,
        on_delete=models.CASCADE,
        related_name='task_change_histories',
        verbose_name='阶段'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='task_change_histories',
        verbose_name='项目'
    )
    
    # 任务类型
    task_type = models.CharField(
        '任务类型',
        max_length=50,
        choices=TaskType.choices,
        default=TaskType.OTHER
    )
    
    # 基本字段变更
    field_name = models.CharField('变更字段', max_length=100)
    old_value = models.TextField('旧值', blank=True, null=True)
    new_value = models.TextField('新值', blank=True, null=True)
    
    # 对于复杂字段（如JSON类型），可以存储有意义的摘要
    is_complex_field = models.BooleanField('是否复杂字段', default=False)
    change_summary = models.TextField('变更摘要', blank=True, null=True)  # 例如"更新了10个元素"
    
    # 元数据
    changed_at = models.DateTimeField('变更时间', auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='task_changes',
        verbose_name='操作人'
    )
    remarks = models.TextField('备注', blank=True)
    
    class Meta:
        verbose_name = '任务变更历史'
        verbose_name_plural = '任务变更历史'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['task', 'changed_at']),
            models.Index(fields=['stage', 'changed_at']),
            models.Index(fields=['project', 'changed_at']),
            models.Index(fields=['task_type']),
            models.Index(fields=['field_name']),
        ]
    
    def __str__(self):
        return f"{self.task.name} - {self.field_name} 变更于 {self.changed_at}"









