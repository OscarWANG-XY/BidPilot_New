import uuid
from django.db import models
from django.conf import settings
from apps.clients.tiptap.utils import (
    task_get_content_as_html, task_get_content_as_markdown,
    task_set_content_from_html, task_set_content_from_markdown
)
import logging
logger = logging.getLogger(__name__)

# 所有枚举定义移到类外部
class StageType(models.TextChoices):
    TENDER_ANALYSIS = 'TENDER_ANALYSIS', '招标文件分析'
    BID_WRITING = 'BID_WRITING', '投标文件编写'

class StageStatus(models.TextChoices):
    NOT_STARTED = 'NOT_STARTED', '未开始'
    IN_PROGRESS = 'IN_PROGRESS', '进行中'
    COMPLETED = 'COMPLETED', '已完成'
    BLOCKED = 'BLOCKED', '阻塞中'


# 统一的阶段模型，替代之前的多个阶段类
class ProjectStage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        "projects.Project",  # 使用字符串引用模型
        on_delete=models.CASCADE,
        related_name='stages',
        verbose_name='项目'
    )
    stage_type = models.CharField(
        '阶段类型',
        max_length=20,
        choices=StageType.choices
    )
    name = models.CharField('阶段名称', max_length=100)
    
    stage_status = models.CharField(
        '状态',
        max_length=20,
        choices=StageStatus.choices,
        default=StageStatus.NOT_STARTED
    )

    description = models.TextField('描述', blank=True)

    # 可选字段，根据不同阶段类型可能存在
    progress = models.IntegerField('进度', default=0)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    # 其他可能的阶段特定字段可以存储在metadata中
    metadata = models.JSONField('元数据', blank=True, default=dict)
    
    class Meta:
        verbose_name = '项目阶段'
        verbose_name_plural = '项目阶段'
        indexes = [
            models.Index(fields=['project', 'stage_type']),
        ]
        unique_together = [['project', 'stage_type']]
    
    def __str__(self):
        return f"{self.project.id} - {self.name}"














