from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from ..models import Task, TaskType, TaskLockStatus
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

class TaskDetailSerializer(serializers.ModelSerializer):
    """任务详情序列化器（待完善）"""
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

class TaskUpdateSerializer(serializers.ModelSerializer):
    """任务更新序列化器 (待完善)"""
    class Meta:
        model = Task
        fields = ['status', 'lock_status', 'updated_at']
        read_only_fields = ['id', 'name', 'type']

