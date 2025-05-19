# app/models/structuring_models.py
from tortoise import fields
from tortoise.models import Model
from enum import Enum
import json


class StructuringAgentState(Model):
    """文档结构化代理状态模型"""
    id = fields.IntField(pk=True)
    project_id = fields.CharField(max_length=255, unique=True)
    state = fields.CharField(max_length=50)
    state_history = fields.JSONField(default=list)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "structuring_agent_states"


class StructuringAgentDocument(Model):
    """文档结构化代理文档模型"""
    id = fields.IntField(pk=True)
    project_id = fields.CharField(max_length=255)
    document_type = fields.CharField(max_length=50)
    content = fields.JSONField()
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "structuring_agent_documents"
        unique_together = (("project_id", "document_type"),)