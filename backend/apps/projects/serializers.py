from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, ProjectHistory

User = get_user_model()

class UserBriefSerializer(serializers.ModelSerializer):
    """用户简要信息序列化器"""
    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'role']  # 指定序列化的字段

class ProjectHistorySerializer(serializers.ModelSerializer):
    """项目状态历史序列化器"""
    from_stage_display = serializers.CharField(source='get_from_stage_display', read_only=True)
    to_stage_display = serializers.CharField(source='get_to_stage_display', read_only=True)

    class Meta:
        model = ProjectHistory
        fields = ['id', 'project', 'from_stage', 'to_stage', 
                 'from_stage_display', 'to_stage_display',
                 'operation_time', 'remarks']
        read_only_fields = ['operation_time']

class ProjectListSerializer(serializers.ModelSerializer):
    """项目列表序列化器"""
    creator = UserBriefSerializer(read_only=True)
    current_stage_display = serializers.CharField(source='get_current_stage_display', read_only=True)
    project_type_display = serializers.CharField(source='get_project_type_display', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'project_code', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'project_type_display', 'bid_deadline',
                 'current_stage', 'current_stage_display', 'is_urgent',
                 'creator', 'create_time', 'last_update_time']
        read_only_fields = ['creator', 'create_time', 'last_update_time']

class ProjectDetailSerializer(ProjectListSerializer):
    """项目详情序列化器"""
    stage_histories = ProjectHistorySerializer(many=True, read_only=True)

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ['stage_histories']

class ProjectCreateSerializer(serializers.ModelSerializer):
    """项目创建序列化器"""
    class Meta:
        model = Project
        fields = ['id','project_code', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'bid_deadline', 'is_urgent']
        read_only_fields = ['id', 'project_code'] # project_code 将自动生成

    def create(self, validated_data):
        # 从上下文中获取当前用户
        user = self.context['request'].user
        # 创建项目实例
        project = Project(creator=user, **validated_data)
        project.save() # 这里会触发 model 的 save 方法，自动生成 project_code
        return project

class ProjectUpdateSerializer(serializers.ModelSerializer):
    """项目更新序列化器"""
    class Meta:
        model = Project
        fields = ['project_name', 'tenderee', 'bidder', 'project_type',
                 'bid_deadline', 'is_urgent']

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

        # 创建状态变更历史记录
        if old_stage != new_stage:
            ProjectHistory.objects.create(
                project=instance,
                from_stage=old_stage,
                to_stage=new_stage,
                remarks=remarks
            )

        return super().update(instance, validated_data)
