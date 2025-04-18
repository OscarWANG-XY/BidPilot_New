from rest_framework import serializers
from ..models import Project
from .history_serializers import ChangeTrackingModelSerializer
from .user_serializers import ProjectUserBriefSerializer

import logging
logger = logging.getLogger(__name__)




# ============= Project 项目序列化器 =============
class ProjectListSerializer(serializers.ModelSerializer):
    """项目列表序列化器"""
    creator = ProjectUserBriefSerializer(read_only=True)
    project_type_display = serializers.CharField(source='get_project_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    current_active_stage_display = serializers.CharField(source='get_current_active_stage_display', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'project_type_display', 
                 'status', 'status_display', 
                 'current_active_stage', 
                 'current_active_stage_display', 
                 'starred',
                 'bid_deadline',
                 'creator', 'create_time', 'last_update_time']
        read_only_fields = ['id', 'creator', 'create_time', 'last_update_time',
                           'current_active_stage', 'current_active_stage_display', 
                           'project_type', 'project_type_display', 
                           'status', 'status_display']

class ProjectDetailSerializer(ProjectListSerializer):
    """项目详情序列化器"""
    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields


class ProjectCreateSerializer(serializers.ModelSerializer):
    """项目创建序列化器"""
    class Meta:
        model = Project
        fields = ['id', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'bid_deadline', 'starred', 'status']
        read_only_fields = ['id']

    def create(self, validated_data):
        project = Project(**validated_data)
        project.save()  # 这里会触发 model 的 save 方法，自动生成 project_code
        return project
    

class ProjectUpdateSerializer(ChangeTrackingModelSerializer):
    """项目更新序列化器"""
    class Meta:
        model = Project
        fields = ['project_name', 'tenderee', 'bidder', 'project_type',
                 'bid_deadline', 'starred', 'status']

# 专用于前端项目取消，和删除的场景
class ProjectStatusUpdateSerializer(ChangeTrackingModelSerializer):
    """项目状态更新序列化器"""
    remarks = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Project
        fields = ['status', 'remarks']

class ProjectActiveStageUpdateSerializer(serializers.ModelSerializer):
    """项目当前活动阶段更新序列化器"""
    remarks = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Project
        fields = ['current_active_stage', 'remarks']

class ProjectTenderFileExtractionSerializer(serializers.ModelSerializer):
    """项目招标文件提取信息序列化器"""
    
    class Meta:
        model = Project
        fields = ['id', 'tender_file_extraction']
        read_only_fields = ['id']
