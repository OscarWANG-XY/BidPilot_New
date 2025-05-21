import uuid
from django.db import models
from django.conf import settings
from apps.clients.tiptap.utils import (
    task_get_content_as_html, task_get_content_as_markdown,
    task_set_content_from_html, task_set_content_from_markdown
)
import logging
logger = logging.getLogger(__name__)

from .ProjectStage import StageType


class ProjectType(models.TextChoices):
    WELFARE = 'WELFARE', '企业福利'  # 值为'WELFARE', 显示为'企业福利' 
    FSD = 'FSD', '食材配送'
    OTHER = 'OTHER', '其他'

class ProjectStatus(models.TextChoices):
    IN_PROGRESS = 'IN_PROGRESS', '进行中'
    COMPLETED = 'COMPLETED', '已完成'
    CANCELLED = 'CANCELLED', '已取消'


class Project(models.Model):

    # 使用UUID作为主键
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_name = models.CharField('项目名称', max_length=200)
    tenderee = models.CharField('招标单位', max_length=200)
    bidder = models.CharField('投标单位', max_length=200, blank=True, default='')
    project_type = models.CharField(
        '项目类型',
        max_length=20,
        choices=ProjectType.choices,
        default=ProjectType.OTHER
    )
    bid_deadline = models.DateTimeField('投标截止时间', blank=True, null=True)
    status = models.CharField(
        '项目状态',
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.IN_PROGRESS
    )
    starred = models.BooleanField('是否标星', default=False)
    current_active_stage = models.CharField(
        '当前活动阶段',
        max_length=20,
        choices=StageType.choices,
        default=StageType.TENDER_ANALYSIS
    )
    creator = models.ForeignKey(    
        settings.AUTH_USER_MODEL,   #指向用户模型的引用
        on_delete=models.PROTECT,
        related_name='created_projects',
        verbose_name='创建者'
    )
    create_time = models.DateTimeField('创建时间', auto_now_add=True)
    last_update_time = models.DateTimeField('最后更新时间', auto_now=True)
    tender_file_extraction = models.JSONField(
        null=True,
        blank=True,
        verbose_name='招标文件提取的内容',
        help_text='存储招标文件提取的内容'
    )

    outline_L1 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='大纲L1',
        help_text='存储大纲L1'
    )   
    index_path_map_L1 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='大纲L1索引路径映射',
        help_text='存储大纲L1索引路径映射'
    )
    tender_file_extraction_L1 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='招标文件更新L1',
        help_text='存储招标文件更新L1'
    )
    
    outline_L2 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='大纲L2',
        help_text='存储大纲L2'
    )
    index_path_map_L2 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='大纲L2索引路径映射',
        help_text='存储大纲L2索引路径映射'
    )
    tender_file_extraction_L2 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='招标文件更新L2',
        help_text='存储招标文件更新L2'
    )
    
    outline_L3 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='大纲L3',
        help_text='存储大纲L3'
    )
    index_path_map_L3 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='大纲L3索引路径映射',
        help_text='存储大纲L3索引路径映射'
    )
    tender_file_extraction_L3 = models.JSONField(
        null=True,
        blank=True,
        verbose_name='招标文件更新L3',
        help_text='存储招标文件更新L3'
    )

    class Meta:
        verbose_name = '项目'
        verbose_name_plural = '项目'
        ordering = ['-create_time']

    def __str__(self):
        return f"{self.id} - {self.project_name}"