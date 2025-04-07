from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from ..models import Task, TaskType, TaskLockStatus
from .history_serializers import ChangeTrackingModelSerializer
import logging

logger = logging.getLogger(__name__)

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