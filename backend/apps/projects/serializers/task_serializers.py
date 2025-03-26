from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from ..models import Task, TaskType
from .history_serializers import ChangeTrackingModelSerializer
import logging

logger = logging.getLogger(__name__)



# 任务列表序列化器
class TaskListSerializer(serializers.ModelSerializer):
    """任务列表序列化器"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lock_status_display = serializers.CharField(source='get_lock_status_display', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'name', 
            'type', 'type_display',
            'status', 'status_display', 
            'lock_status', 'lock_status_display',
            'updated_at', 
        ]
        read_only_fields = fields


# ============= 特定场景的专用任务序列化器 =============

# ---- 文件上传任务 专用序列化器
class FileUploadTaskDetailSerializer(serializers.ModelSerializer):
    """文件上传任务读取专用序列化器"""
    class Meta:
        model = Task
        fields = ['id','name','type',
                  'status', 
                  #'lock_status', 'tiptap_content', 'user_confirmed'
                  ]  
        read_only_fields = fields  # 所有字段都是只读的
    
    def to_representation(self, instance):
        if instance.type != TaskType.UPLOAD_TENDER_FILE:
            raise ValidationError(f"此序列化器只能用于 文件上传任务 的读取")
        return super().to_representation(instance)

class FileUploadTaskUpdateSerializer(ChangeTrackingModelSerializer):
    """文件上传任务更新专用序列化器"""
    class Meta:
        model = Task
        fields = [
            #'id', 'name', 'type',
            'status', 
            #'lock_status', 'tiptap_content', 'user_confirmed'
        ]
    
    def validate(self, data):
        if self.instance.type != TaskType.UPLOAD_TENDER_FILE:
            raise ValidationError(f"此序列化器只能用于 文件上传任务 的更新")
        return super().validate(data)

# --- 文档提取专用序列化器  
class DocxExtractionTaskDetailSerializer(serializers.ModelSerializer):
    """文档提取任务读取专用序列化器"""
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

class DocxExtractionTaskUpdateSerializer(ChangeTrackingModelSerializer):
    """文档提取任务更新专用序列化器"""

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