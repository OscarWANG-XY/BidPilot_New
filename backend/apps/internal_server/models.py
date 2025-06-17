import uuid
from django.db import models
from django.conf import settings
from apps.projects.models import Project

import logging
logger = logging.getLogger(__name__)



class ProjectAgentStorage(models.Model):


# 项目数据模型
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='project_agent_storage'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# 项目AgentSSE数据

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


# ========================= （Structuring阶段） =========================


# --- 过程产出（含结果） ---  
# 招标文件数据（Structuring阶段）

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

# 招标文档相关建议（Structuring阶段）

    review_suggestions = models.JSONField(
        null=True,
        blank=True,
        verbose_name='招标文档结构修正建议文档'
    )


# --- 生产资料 ---
# 章节md
    chapters_md = models.JSONField(
        null=True,
        blank=True,
        verbose_name='章节md'
    )


# 通过章节内容浏览，建立主题章节地图 (tiptap JSON)
    topic_chapters_map = models.JSONField(
        null=True,
        blank=True,
        verbose_name='章节内容主题对应表'
    )


# ==========================  （Planning阶段） ==========================

    # 对每个主题（相关章节）分析，获得 主题对应的 to-dos清单 （普通json dict）
    # 每一条to-do包含： todo_id, todo_title, todo_description, relevant_chapters, todo_type.
    # todo_type 包含： 1. 证明材料准备 2. 写作 3. 其他 
    raw_topic_todos = models.JSONField(
        null=True,
        blank=True,
        verbose_name='章节内容主题对应表'
    )

    # 合并同类项后的_todos 
    integrated_topic_todos = models.JSONField(
        null=True,
        blank=True,
        verbose_name='合并同类项后的_todos'
    )






# --- 过程产出 （documents） ---  

    # 写作to-do
     



# 
# 工作计划表








# ========================== （Writting阶段） ==========================


    draft_bid_document = models.JSONField(
        null=True,
        blank=True,
        verbose_name='草稿投标文件'
    )













    class Meta:
        db_table = 'structuring_agent_storage'
        verbose_name = '结构化Agent存储'
        verbose_name_plural = '结构化Agent存储'