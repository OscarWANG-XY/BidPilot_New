from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, ProjectHistory

User = get_user_model()

class UserBriefSerializer(serializers.ModelSerializer):
    """用户简要信息序列化器"""
    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'role']



# ------------ 项目状态历史 序列化器 ------------
class ProjectHistorySerializer(serializers.ModelSerializer):
    """项目状态历史序列化器"""
    class Meta:
        model = ProjectHistory
        fields = ['id', 'project', 'from_stage', 'to_stage',
                 'get_from_stage_display', 'get_to_stage_display',
                 'operation_time', 'remarks']
        read_only_fields = ['operation_time']


# ------------ 项目列表 序列化器 ------------
class ProjectListSerializer(serializers.ModelSerializer):
    """项目列表序列化器"""
    creator = UserBriefSerializer(read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'project_code', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'get_project_type_display', 'bid_deadline',
                 'current_stage', 'get_current_stage_display', 'is_urgent',
                 'creator', 'create_time', 'last_update_time']
        read_only_fields = ['id', 'project_code', 'creator', 'create_time', 'last_update_time',
                           'current_stage', 'get_current_stage_display', 'get_project_type_display']



# ------------ 项目详情 序列化器 ------------
class ProjectDetailSerializer(ProjectListSerializer):
    """项目详情序列化器"""
    stage_histories = ProjectHistorySerializer(many=True, read_only=True)

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ['stage_histories']




# ------------ 创建项目 序列化器 ------------
class ProjectCreateSerializer(serializers.ModelSerializer):
    """项目创建序列化器"""
    class Meta:
        model = Project
        fields = ['id', 'project_code', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'bid_deadline', 'is_urgent']
        read_only_fields = ['id', 'project_code']

    def create(self, validated_data):
        project = Project(**validated_data)
        project.save()  # 这里会触发 model 的 save 方法，自动生成 project_code
        return project



# ------------ 更新项目 序列化器 ------------
class ProjectUpdateSerializer(serializers.ModelSerializer):
    """项目更新序列化器"""
    class Meta:
        model = Project
        fields = ['project_name', 'tenderee', 'bidder', 'project_type',
                 'bid_deadline', 'is_urgent']




# ------------ 项目状态更新 序列化器 ------------
class ProjectStageUpdateSerializer(serializers.ModelSerializer):
    """项目状态更新序列化器"""
    remarks = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Project
        fields = ['current_stage', 'remarks']

    def update(self, instance, validated_data):
        remarks = validated_data.pop('remarks', '')
        old_stage = instance.current_stage
        new_stage = validated_data['current_stage']

        if old_stage != new_stage:
            ProjectHistory.objects.create(
                project=instance,
                from_stage=old_stage,
                to_stage=new_stage,
                remarks=remarks
            )

        return super().update(instance, validated_data)
