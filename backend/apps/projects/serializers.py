from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .models import (
    Project, ProjectStage, Task,
    ProjectChangeHistory, StageChangeHistory, TaskChangeHistory,
    TaskStatus, TaskType
)
from .signals import set_change_metadata
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
    changed_by = UserBriefSerializer(read_only=True)
    
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
    changed_by = UserBriefSerializer(read_only=True)
    
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
    changed_by = UserBriefSerializer(read_only=True)
    
    class Meta:
        model = TaskChangeHistory
        fields = [
            'id', 'operation_id', 'task', 'stage', 
            'project', 'task_type', 'field_name', 
            'old_value', 'new_value', 'is_complex_field',
            'change_summary', 'changed_at', 'changed_by', 'remarks'
        ]
        read_only_fields = fields



# ============= Project 项目序列化器 =============
class ProjectListSerializer(serializers.ModelSerializer):
    """项目列表序列化器"""
    creator = UserBriefSerializer(read_only=True)
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





# ============= ProjectStage 项目阶段序列化器 =============
# ProjectStage初始化创建，不需要CreateSerializer 

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


class ProjectStageDetailSerializer(serializers.ModelSerializer):
    """项目阶段读取专用序列化器"""

    # 额外定义序列化字段
    tasks = TaskListSerializer(many=True, read_only=True)

    stage_type_display = serializers.CharField(source='get_stage_type_display', read_only=True)
    stage_status_display = serializers.CharField(source='get_stage_status_display', read_only=True)
    
    class Meta:
        model = ProjectStage
        fields = [
            'id', 'project', 'stage_type', 'stage_type_display', 'name', 
            'stage_status', 'stage_status_display', 'description', 
            'progress', 'created_at', 
            'updated_at', 'metadata', 
            'tasks'  # 任务列表，定义使用TaskListSerializer(many=True, read_only=True)
        ]
        read_only_fields = fields  # 所有字段都是只读的

class ProjectStageUpdateSerializer(ChangeTrackingModelSerializer):
    """项目阶段更新序列化器，主要用于更新阶段状态和相关信息，以及关联任务的状态"""

     # 前端每个项目阶段的任务作为子组件和用户交互，用户一次只会操作一个组件
    # 简化为单个任务更新
    task_id = serializers.UUIDField(
        required=False, 
        write_only=True,
        help_text="要更新的任务ID"
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
    remarks = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = ProjectStage
        fields = ['stage_status', 'progress', 'metadata', 'task_id', 'task_status', 'lock_status', 'remarks']
    


    ### TODO 当我们用bottomup的方式管理前端组件的状态，我们将不再通过ProjectStage提取和处理任务信息。
    def update(self, instance, validated_data):
        # with transaction.atomic(): 
        # 在这里不添加，因为每个任务的更新是独立的，不会影响其他任务
        # with transaction.atomic():本身有性能开销，所以在这种简单的场景下不使用。 

        # 提取并移除任务状态更新字段
        task_id = validated_data.pop('task_id', None)
        task_status = validated_data.pop('task_status', None)
        lock_status = validated_data.pop('lock_status', None)
        
        # 更新阶段信息
        instance = super().update(instance, validated_data)
        
        # 如果提供了任务类型和状态，则更新该任务
        # 如果提供了任务ID和状态，则更新该任务
        if task_id and task_status:
            try:
                task = Task.objects.get(id=task_id, stage=instance)
                task.status = task_status
                if lock_status:
                    task.lock_status = lock_status
                # 设置变更用户和备注
                set_change_metadata(task, getattr(instance, '_change_user', None), getattr(instance, '_change_remarks', ''))
                task.save()
                logger.info(f"更新任务状态: task_id={task_id}, status={task_status}, lock_status={lock_status}")
            except Task.DoesNotExist:
                logger.warning(f"任务不存在: task_id={task_id}")
        
        return instance





# ============= 任务序列化器 =============


# class TaskDetailSerializer(serializers.ModelSerializer):
#     """任务详情序列化器"""
#     type_display = serializers.CharField(source='get_type_display', read_only=True)
#     status_display = serializers.CharField(source='get_status_display', read_only=True)
#     lock_status_display = serializers.CharField(source='get_lock_status_display', read_only=True)
    
#     class Meta:
#         model = Task
#         fields = [
#             'id', 'stage', 'name', 'description',
#             'type', 'type_display',
#             'status', 'status_display', 
#             'created_at', 'updated_at', 
#             'lock_status', 'lock_status_display',
#             'tiptap_content'
#         ]
#         read_only_fields = [
#             'id', 'stage', 'type', 'type_display', 
#             'created_at', 'updated_at',
#             'status_display', 'lock_status_display'
#         ]


# class TaskUpdateSerializer(ChangeTrackingModelSerializer):
#     """任务更新序列化器"""
#     remarks = serializers.CharField(required=False, write_only=True)
    
#     class Meta:
#         model = Task
#         fields = ['status', 'lock_status', 'tiptap_content', 'remarks']                  
        
#         ######TODO 待将tiptap_content改为 docx_content, 移到ProjectStage里。 



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

