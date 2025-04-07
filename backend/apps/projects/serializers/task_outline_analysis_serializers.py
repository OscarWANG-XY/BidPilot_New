from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from ..models import Task, TaskType, TaskLockStatus
from .history_serializers import ChangeTrackingModelSerializer
import logging

logger = logging.getLogger(__name__)

# --- 文档结构分析专用序列化器  
class DocOutlineAnalysisTaskDetailSerializer(serializers.ModelSerializer):
    """文档结构分析任务读取专用序列化器"""
    class Meta:
        model = Task
        fields = ['id','name','type',
                  'status', 'lock_status',
                  'docx_tiptap'
                  ]  
        read_only_fields = fields  # 所有字段都是只读的
    
    def to_representation(self, instance):
        if instance.type != TaskType.DOCX_EXTRACTION_TASK:
            raise ValidationError(f"此序列化器只能用于 文档提取任务 的读取")
        return super().to_representation(instance)

class DocOutlineAnalysisTaskUpdateSerializer(ChangeTrackingModelSerializer):
    """文档结构分析任务更新专用序列化器"""

    class Meta:
        model = Task
        fields = [
            #'id', 'name', 'type',
            'status', 'lock_status',
            'docx_tiptap',
        ]
    
    def validate(self, data):
        if self.instance.type != TaskType.DOCX_EXTRACTION_TASK:
            raise ValidationError(f"此序列化器只能用于 文档提取任务 的更新")
        return super().validate(data)