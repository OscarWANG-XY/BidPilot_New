from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, ProjectHistory

User = get_user_model()

class UserBriefSerializer(serializers.ModelSerializer):
    """用户简要信息序列化器"""
    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'role']



# ------------ 项目状态历史 序列化器 （后端->前端）------------
class ProjectHistorySerializer(serializers.ModelSerializer):
    """项目状态历史序列化器"""
    class Meta:
        model = ProjectHistory
        fields = ['id', 'project', 'from_stage', 'to_stage',
                 'get_from_stage_display', 'get_to_stage_display',
                 'operation_time', 'remarks']
        read_only_fields = ['operation_time']


# ------------ 项目列表 序列化器 （后端->前端）------------
# 注意 ProjectListSerializer 的名字可能有点误导性。
# 实际上，它并不是"返回项目列表"的序列化器，而是"用于项目列表中显示单个项目"的序列化器。
# 它定义了在列表中显示一个项目时需要的字段。
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



# ------------ 项目详情 序列化器 （后端->前端） ------------
class ProjectDetailSerializer(ProjectListSerializer):
    """项目详情序列化器"""
    #ProjectHistory是Project关系数据，通过这里的序列化操作，将关系数据转换为数组
    stage_histories = ProjectHistorySerializer(many=True, read_only=True)

    #以下返回的数据里，包含了stage_historeis，与前端的stageHistories对应 
    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ['stage_histories']




# ------------ 创建项目 序列化器 （前端->后端）------------
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



# ------------ 更新项目 序列化器 (前端->后端)------------
class ProjectUpdateSerializer(serializers.ModelSerializer):
    """项目更新序列化器"""
    class Meta:
        model = Project
        fields = ['project_name', 'tenderee', 'bidder', 'project_type',
                 'bid_deadline', 'is_urgent']




# ------------ 项目状态更新 序列化器 （前端->后端）------------ 
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
