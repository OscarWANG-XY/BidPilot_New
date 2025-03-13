from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import (
    Project, ProjectHistory, ProjectStage, BaseTask, 
    DocxExtractionTask, DocxTreeBuildTask, TenderFileUploadTask, TaskStatus
)
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


# ============ 基础模型序列化器 (Basic Model Serializers) ============

class UserBriefSerializer(serializers.ModelSerializer):
    """
    用户简要信息序列化器
    在项目相关API中展示用户的基本信息，只包含id, phone, role的必要信息。
    """

    # 核心信息
    id = serializers.UUIDField(
        read_only=True,   # 必须字段，但不需用户填写
        help_text="用户唯一标识符"
    )
    phone = serializers.CharField(
        read_only=True,   # 必须字段，但不需用户填写
        help_text="用户手机号，作为主要联系方式"
    )
    role = serializers.CharField(
        read_only=True,   # 必须字段，但不需用户填写
        help_text="用户角色，如'user'、'admin'等"
    )
    
    class Meta:
        model = User
        fields = ['id', 'phone', 'role']
        read_only_fields = ['id', 'phone', 'role']


# ============= Project 项目序列化器 =============

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

class ProjectDetailSerializer(ProjectListSerializer):
    """项目详情序列化器"""
    stage_histories = serializers.SerializerMethodField()

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ['stage_histories']
    
    def get_stage_histories(self, obj):
        histories = obj.project_histories.all()
        return ProjectHistorySerializer(histories, many=True).data

class ProjectUpdateSerializer(serializers.ModelSerializer):
    """项目更新序列化器"""
    class Meta:
        model = Project
        fields = ['project_name', 'tenderee', 'bidder', 'project_type',
                 'bid_deadline', 'is_urgent', 'status']

# 专用于前端项目取消，和删除的场景
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

class ProjectActiveStageUpdateSerializer(serializers.ModelSerializer):
    """项目当前活动阶段更新序列化器"""
    class Meta:
        model = Project
        fields = ['current_active_stage']


# ============= ProjectStage 项目阶段序列化器 =============
# ProjectStage初始化创建，不需要CreateSerializer 

class ProjectStageDetailSerializer(serializers.ModelSerializer):
    """项目阶段读取专用序列化器"""

    # 额外定义序列化字段
    tasks = serializers.SerializerMethodField()  # 自定义序列化逻辑
    stage_type_display = serializers.CharField(source='get_stage_type_display', read_only=True)
    stage_status_display = serializers.CharField(source='get_stage_status_display', read_only=True)
    
    class Meta:
        model = ProjectStage
        fields = [
            'id', 'project', 'stage_type', 'stage_type_display', 'name', 
            'stage_status', 'stage_status_display', 'description', 
            'file_id', 'progress', 'remarks', 'created_at', 
            'updated_at', 'metadata', 'tasks'
        ]
        read_only_fields = fields  # 所有字段都是只读的
    
    def get_tasks(self, obj):
        """获取该阶段的所有任务"""

        # 使用ProjectStage的反向关联查询到所有的tasks，包括BaseTask 和它的子类Task. 
        tasks = obj.tasks.all()  
        
        # 根据任务类型使用不同的序列化器
        serialized_tasks = []
        for task in tasks:
            if isinstance(task, TenderFileUploadTask):
                serialized_tasks.append(TenderFileUploadTaskListSerializer(task).data)
            elif isinstance(task, DocxExtractionTask):
                serialized_tasks.append(DocxExtractionTaskListSerializer(task).data)
            elif isinstance(task, DocxTreeBuildTask):
                serialized_tasks.append(DocxTreeBuildTaskListSerializer(task).data)
            else:
                # 默认使用基础任务序列化器
                serialized_tasks.append(BaseTaskListSerializer(task).data)
        return serialized_tasks

class ProjectStageUpdateSerializer(serializers.ModelSerializer):
    """项目阶段更新序列化器，主要用于更新阶段状态和相关信息，以及关联任务的状态"""

    # 前端每个项目阶段的任务作为子组件和用户交互，用户一次只会操作一个组件
    # 因此，我们只需要接收一个任务类型和目标状态 
    # 简化为单个任务更新
    task_type = serializers.CharField(
        required=False, 
        write_only=True,
        help_text="要更新状态的任务类型"
    )
    task_status = serializers.CharField(
        required=False, 
        write_only=True,
        help_text="任务的新状态值"
    )
    lock_status = serializers.CharField(
        required=False,
        write_only=True,
        help_text="任务的锁定状态"
    )


    class Meta:
        model = ProjectStage
        fields = ['stage_status', 'progress', 'remarks', 'metadata', 'task_type', 'task_status', 'lock_status']
    
    def update(self, instance, validated_data):
        # with transaction.atomic(): 
        # 在这里不添加，因为每个任务的更新是独立的，不会影响其他任务
        # with transaction.atomic():本身有性能开销，所以在这种简单的场景下不使用。 

        # 提取并移除任务状态更新字段
        task_type = validated_data.pop('task_type', None)
        task_status = validated_data.pop('task_status', None)
        lock_status = validated_data.pop('lock_status', None)
        
        # 更新阶段信息
        instance = super().update(instance, validated_data)
        
        # 如果提供了任务类型和状态，则更新该任务
        if task_type and task_status:
            # 查找并更新特定类型的任务
            tasks_to_update = instance.tasks.filter(type=task_type)
            tasks_to_update.update(status=task_status, lock_status=lock_status)

        # 检查是否所有任务都已完成的逻辑保持不变
        if instance.tasks.exists() and not instance.tasks.exclude(status=TaskStatus.COMPLETED).exists():
            if instance.stage_status != ProjectStage.StageStatus.COMPLETED:
                instance.stage_status = ProjectStage.StageStatus.COMPLETED
                instance.save(update_fields=['stage_status'])
        
        return instance



# ============= BaseTask 任务序列化器 =============
# List serializers 

class BaseTaskListSerializer(serializers.ModelSerializer):
    """基础任务列表序列化器 - 只包含列表视图需要的字段"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = BaseTask
        fields = [
            'id', 'name', 'type', 'type_display',
            'status', 'status_display', 'updated_at', 'lock_status'
        ]
        read_only_fields = fields

class TenderFileUploadTaskListSerializer(BaseTaskListSerializer):
    """招标文件上传任务列表序列化器"""
    class Meta(BaseTaskListSerializer.Meta):
        model = TenderFileUploadTask
        fields = BaseTaskListSerializer.Meta.fields
        read_only_fields = fields

class DocxExtractionTaskListSerializer(BaseTaskListSerializer):
    """文档提取任务列表序列化器"""
    # 只包含列表视图需要的基本信息，不添加额外字段
    class Meta(BaseTaskListSerializer.Meta):
        model = DocxExtractionTask
        # 使用与基类相同的字段
        fields = BaseTaskListSerializer.Meta.fields
        read_only_fields = fields

class DocxTreeBuildTaskListSerializer(BaseTaskListSerializer):
    """文档树构建任务列表序列化器"""
    # 只包含列表视图需要的基本信息，不添加额外字段
    class Meta(BaseTaskListSerializer.Meta):
        model = DocxTreeBuildTask
        # 使用与基类相同的字段
        fields = BaseTaskListSerializer.Meta.fields
        read_only_fields = fields

# detail serializers 

class BaseTaskDetailSerializer(serializers.ModelSerializer):
    """基础任务读取专用序列化器"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = BaseTask
        fields = [
            'id', 'stage', 'name', 'description', 'type', 'type_display',
            'status', 'status_display', 'created_at', 'updated_at', 'lock_status'
        ]
        read_only_fields = fields  # 所有字段都是只读的

class TenderFileUploadTaskDetailSerializer(BaseTaskDetailSerializer):
    """招标文件上传任务读取专用序列化器"""
    class Meta(BaseTaskDetailSerializer.Meta):
        model = TenderFileUploadTask
        fields = BaseTaskDetailSerializer.Meta.fields
        read_only_fields = fields

class DocxExtractionTaskDetailSerializer(BaseTaskDetailSerializer):
    """文档提取任务读取专用序列化器"""
    class Meta(BaseTaskDetailSerializer.Meta):
        model = DocxExtractionTask
        fields = BaseTaskDetailSerializer.Meta.fields + [
            'extracted_elements', 'outline_analysis_result', 'improved_docx_elements'
        ]
        read_only_fields = fields  # 所有字段都是只读的

class DocxTreeBuildTaskDetailSerializer(BaseTaskDetailSerializer):
    """文档树构建任务读取专用序列化器"""
    class Meta(BaseTaskDetailSerializer.Meta):
        model = DocxTreeBuildTask
        fields = BaseTaskDetailSerializer.Meta.fields + [
            'docxtree', 'more_subtitles'
        ]
        read_only_fields = fields  # 所有字段都是只读的

# update serializers 
# 针对 更新操作， 不需要多态。 
class BaseTaskUpdateSerializer(serializers.ModelSerializer):
    """基础任务更新专用序列化器"""
    class Meta:
        model = BaseTask
        fields = ['name', 'description', 'status', 'lock_status']

class TenderFileUploadTaskUpdateSerializer(serializers.ModelSerializer):
    """招标文件上传任务更新专用序列化器"""
    class Meta(BaseTaskUpdateSerializer.Meta):
        model = TenderFileUploadTask
        fields = BaseTaskUpdateSerializer.Meta.fields

class DocxExtractionTaskUpdateSerializer(serializers.ModelSerializer):
    """文档提取任务更新专用序列化器"""
    class Meta(BaseTaskUpdateSerializer.Meta):
        model = DocxExtractionTask
        fields = BaseTaskUpdateSerializer.Meta.fields + [
            'extracted_elements', 'outline_analysis_result', 'improved_docx_elements'
        ]

class DocxTreeBuildTaskUpdateSerializer(serializers.ModelSerializer):
    """文档树构建任务更新专用序列化器"""
    class Meta(BaseTaskUpdateSerializer.Meta):
        model = DocxTreeBuildTask
        fields = BaseTaskUpdateSerializer.Meta.fields + [
            'docxtree', 'more_subtitles'
        ]




# ===============    ProjectHistory 项目状态历史序列化器  ===============
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

class ProjectHistoryCreateSerializer(serializers.ModelSerializer):
    """项目状态历史创建序列化器"""
    class Meta:
        model = ProjectHistory
        fields = ['project', 'from_stage', 'to_stage', 'from_status', 
                 'to_status', 'remarks']







