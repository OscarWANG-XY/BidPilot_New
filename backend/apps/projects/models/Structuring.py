# models.py
from django.db import models
import json

class StructuringAgentState(models.Model):
    """存储文档结构化流程的状态信息，不存储文档内容"""
    project_id = models.CharField(max_length=100, primary_key=True, db_index=True)
    state = models.CharField(max_length=50)
    state_history = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'structuring_agent_state'
        verbose_name = '文档结构化状态'
        verbose_name_plural = '文档结构化状态'
        indexes = [
            models.Index(fields=['project_id']),
        ]
    
    def __str__(self):
        return f"项目 {self.project_id} 状态: {self.state}"


class StructuringAgentDocument(models.Model):
    """统一存储所有文档内容，无论大小"""
    project_id = models.CharField(max_length=100, db_index=True)
    document_type = models.CharField(max_length=20)  # 'document', 'h1', 'h2h3', 'intro', 'final'
    content = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'structuring_agent_document'
        verbose_name = '文档结构化内容'
        verbose_name_plural = '文档结构化内容'
        unique_together = ('project_id', 'document_type')
        indexes = [
            models.Index(fields=['project_id', 'document_type']),
        ]
    
    def __str__(self):
        return f"项目 {self.project_id} 文档类型: {self.document_type}"