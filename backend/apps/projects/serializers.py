from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, ProjectHistory, ProjectStage, BaseTask

User = get_user_model()


# ============ 基础模型的序列化器 ============

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
                 'from_status', 'to_status',
                 'get_from_status_display', 'get_to_status_display',
                 'operation_time', 'remarks']
        read_only_fields = ['operation_time']


# ------------ 任务序列化器 ------------
class BaseTaskSerializer(serializers.ModelSerializer):
    """基础任务序列化器"""
    class Meta:
        model = BaseTask
        fields = ['id', 'name', 'description', 'progress', 'type', 'status', 
                  'created_at', 'updated_at']


# ------------ 项目阶段序列化器 ------------
class ProjectStageSerializer(serializers.ModelSerializer):
    """项目阶段序列化器"""
    tasks = BaseTaskSerializer(many=True, read_only=True)
    stage = serializers.CharField(source='stage_type')
    status = serializers.CharField(source='stage_status')
    
    class Meta:
        model = ProjectStage
        fields = ['id', 'stage', 'name', 'status', 'description', 'progress', 
                  'remarks', 'tasks', 'file_id', 'created_at', 'updated_at']






# ============ 项目操作的序列化器 ============


# ------------ 创建项目 序列化器 （前端->后端）------------
# 前端组件： _01_CreateProject.tsx 组件
# 前端API： api/projects_api.ts 文件的 CreateProject 方法 
# 前端HOOK： hooks/useProjects.ts 文件的 createProject 方法 
# 后端视图： views.py 文件的 ProjectViewSet 类中的 create 方法 
# 后端序列化器： serializers.py 文件的 ProjectCreateSerializer 类
class ProjectCreateSerializer(serializers.ModelSerializer):
    """项目创建序列化器"""
    class Meta:
        model = Project
        fields = ['id', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'bid_deadline', 'is_urgent', 'status']
        read_only_fields = ['id']

    def create(self, validated_data):
        project = Project(**validated_data)
        project.save()  # 这里会触发 model 的 save 方法，自动生成 project_code
        return project


# ------------ 项目列表 序列化器 （后端->前端）------------
# 注意 ProjectListSerializer 的名字可能有点误导性， 它也是模型序列化器。
# 实际上，它并不是"返回项目列表"的序列化器，而是"用于项目列表中显示单个项目"的序列化器。
# 它定义了在列表中显示一个项目时需要的字段。
# 前端组件： _02_ProjectList.tsx 组件
# 前端API： api/projects_api.ts 文件的 getAllProjects 方法 
# 前端HOOK： hooks/useProjects.ts 文件的 projecsQuery 方法 
# 后端视图： views.py 文件的 ProjectViewSet 类中的 get_queryset 方法 
# 后端序列化器： serializers.py 文件的 ProjectListSerializer 类
class ProjectListSerializer(serializers.ModelSerializer):
    """项目列表序列化器"""
    creator = UserBriefSerializer(read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'get_project_type_display', 'bid_deadline',
                 'status', 'get_status_display', 'current_active_stage', 
                 'get_current_active_stage_display', 'is_urgent',
                 'creator', 'create_time', 'last_update_time']
        read_only_fields = ['id', 'creator', 'create_time', 'last_update_time',
                           'current_active_stage', 'get_current_active_stage_display', 
                           'get_project_type_display', 'get_status_display']




# ============ 操作项目阶段的序列化器 ============





# ------------ 项目阶段概览序列化器 ------------
# 前端组件： _05_ProjectPhasesOverview.tsx 组件
# 前端API： api/projects_api.ts 文件的 getProjectOverview 方法 
# 前端HOOK： hooks/useProjects.ts 文件的 getProjectOverviewQuery 方法 
# 后端视图： views.py 文件的 ProjectViewSet 类中的 get_project_overview 方法 
# 后端序列化器： serializers.py 文件的 ProjectOverviewSerializer 类
class ProjectOverviewSerializer(serializers.ModelSerializer):
    """项目阶段概览序列化器"""
    project = serializers.SerializerMethodField()  # 定义了获取项目基本信息的方法 对应get_project方法
    stages = serializers.SerializerMethodField()    # 定义了获取项目所有阶段信息的方法 对应get_stages方法
    
    class Meta:
        model = Project   # 序列化器关联的模型，所以后面的obj是Project实例
        fields = ['project', 'stages']  # project和stages 分别通过get_project和get_stages方法获取
    
    def get_project(self, obj):
        """获取项目基本信息"""
        return ProjectListSerializer(obj).data
    
    def get_stages(self, obj):
        """获取项目所有阶段信息"""
        stages = obj.stages.all().order_by('stage_type')
        # stages返回了与当前项目关联的所有阶段信息， 
        # 每个阶段信息都通过 ProjectStageSerializer 序列化器进行序列化，
        # 所以return的序列化操作使用了（stages, many=True）
        return ProjectStageSerializer(stages, many=True).data






# ------------ 项目详情 序列化器 （后端->前端） ------------
class ProjectDetailSerializer(ProjectListSerializer):
    """项目详情序列化器"""
    #ProjectHistory是Project关系数据，通过这里的序列化操作，将关系数据转换为数组
    stage_histories = ProjectHistorySerializer(many=True, read_only=True)

    #以下返回的数据里，包含了stage_historeis，与前端的stageHistories对应 
    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ['stage_histories']








# ------------ 更新项目 序列化器 (前端->后端)------------
class ProjectUpdateSerializer(serializers.ModelSerializer):
    """项目更新序列化器"""
    class Meta:
        model = Project
        fields = ['project_name', 'tenderee', 'bidder', 'project_type',
                 'bid_deadline', 'is_urgent', 'status']




# ------------ 项目状态更新 序列化器 （前端->后端）------------ 
class ProjectStatusUpdateSerializer(serializers.ModelSerializer):
    """项目状态更新序列化器"""
    remarks = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Project
        fields = ['status', 'remarks']

    def update(self, instance, validated_data):
        remarks = validated_data.pop('remarks', '')
        old_status = instance.status
        new_status = validated_data['status']

        if old_status != new_status:
            # 创建项目历史记录
            ProjectHistory.objects.create(
                project=instance,
                from_stage=instance.current_active_stage,  # 保持当前阶段不变
                to_stage=instance.current_active_stage,    # 保持当前阶段不变
                from_status=old_status,                    # 记录状态变更
                to_status=new_status,
                remarks=remarks
            )

        return super().update(instance, validated_data)


# ------------ 项目阶段更新 序列化器 （前端->后端）------------ 
class ProjectStageUpdateSerializer(serializers.ModelSerializer):
    """项目阶段更新序列化器"""
    remarks = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Project
        fields = ['current_active_stage', 'remarks']

    def update(self, instance, validated_data):
        remarks = validated_data.pop('remarks', '')
        old_stage = instance.current_active_stage
        new_stage = validated_data['current_active_stage']

        if old_stage != new_stage:
            # 创建项目历史记录
            ProjectHistory.objects.create(
                project=instance,
                from_stage=old_stage,
                to_stage=new_stage,
                from_status=instance.status,  # 保持当前状态不变
                to_status=instance.status,    # 保持当前状态不变
                remarks=remarks
            )

        return super().update(instance, validated_data)




