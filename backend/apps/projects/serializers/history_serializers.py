from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import (
    ProjectChangeHistory, StageChangeHistory, TaskChangeHistory,
)

from ..signals import set_change_metadata
from .user_serializers import ProjectUserBriefSerializer

import logging

logger = logging.getLogger(__name__)
User = get_user_model()

# ===============    ProjectHistory 项目状态历史序列化器  ===============

class ChangeTrackingModelSerializer(serializers.ModelSerializer):
    """包含变更跟踪功能的基础序列化器，自动记录用户和备注信息"""
    
    def update(self, instance, validated_data):
        # 提取备注（如果有）
        remarks = validated_data.pop('remarks', '') if 'remarks' in validated_data else ''
        
        # 获取当前用户
        request = self.context.get('request') # 从上下文获取request对象, 在views中设置   
        user = request.user if request else None
        
        # 设置变更元数据
        set_change_metadata(instance, user, remarks)
        
        # 调用父类方法
        return super().update(instance, validated_data)


class ProjectChangeHistorySerializer(serializers.ModelSerializer):
    """
    项目变更历史记录序列化器
    """
    changed_by = ProjectUserBriefSerializer(read_only=True)
    
    class Meta:
        model = ProjectChangeHistory
        fields = [
            'id', 'operation_id', 'project', 'field_name', 
            'old_value', 'new_value', 'changed_at', 
            'changed_by', 'remarks'
        ]
        read_only_fields = fields


class StageChangeHistorySerializer(serializers.ModelSerializer):
    """
    阶段变更历史记录序列化器
    """
    changed_by = ProjectUserBriefSerializer(read_only=True)
    
    class Meta:
        model = StageChangeHistory
        fields = [
            'id', 'operation_id', 'stage', 'project', 
            'field_name', 'old_value', 'new_value', 
            'changed_at', 'changed_by', 'remarks'
        ]
        read_only_fields = fields


class TaskChangeHistorySerializer(serializers.ModelSerializer):
    """
    任务变更历史记录序列化器
    """
    changed_by = ProjectUserBriefSerializer(read_only=True)
    
    class Meta:
        model = TaskChangeHistory
        fields = [
            'id', 'operation_id', 'task', 'stage', 
            'project', 'task_type', 'field_name', 
            'old_value', 'new_value', 'is_complex_field',
            'change_summary', 'changed_at', 'changed_by', 'remarks'
        ]
        read_only_fields = fields