import uuid
from django.db import models
from django.conf import settings
from apps.projects.models import Project

import logging
logger = logging.getLogger(__name__)



class StructuringAgentStorage(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='structuring_agent_storage'
    )

    agent_state_history = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Agent状态历史'
    )

    agent_message_history = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Agent消息历史'
    )

    raw_document = models.JSONField(
        null=True,
        blank=True,
        verbose_name='原始文档'
    )

    h1_document = models.JSONField(
        null=True,
        blank=True,
        verbose_name='一级大纲文档'
    )

    h2h3_document = models.JSONField(
        null=True,
        blank=True,
        verbose_name='更细大纲文档'
    )

    intro_document = models.JSONField(
        null=True,
        blank=True,
        verbose_name='含前言目录的文档'
    )

    final_document = models.JSONField(
        null=True,
        blank=True,
        verbose_name='最终文档'
    )
    review_suggestions = models.JSONField(
        null=True,
        blank=True,
        verbose_name='招标文档结构修正建议文档'
    )

    chapters_md = models.JSONField(
        null=True,
        blank=True,
        verbose_name='章节md'
    )


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'structuring_agent_storage'
        verbose_name = '结构化Agent存储'
        verbose_name_plural = '结构化Agent存储'