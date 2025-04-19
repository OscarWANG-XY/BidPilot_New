from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from ..models import ProjectStage, Task
from ..signals import set_change_metadata
from .history_serializers import ChangeTrackingModelSerializer
from .task_serializers import TaskListSerializer
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

# ============= ProjectStage 项目阶段序列化器 =============
# ProjectStage初始化创建，不需要CreateSerializer 




class ProjectStageDetailSerializer(serializers.ModelSerializer):
    """项目阶段读取专用序列化器"""

    # 额外定义序列化字段
    tasks_l1 = serializers.SerializerMethodField()

    stage_type_display = serializers.CharField(source='get_stage_type_display', read_only=True)
    stage_status_display = serializers.CharField(source='get_stage_status_display', read_only=True)
    
    def get_tasks_l1(self, obj):
        """只返回task_level=1的任务"""
        tasks_l1 = obj.tasks.filter(task_level=1)
        return TaskListSerializer(tasks_l1, many=True).data
    
    class Meta:
        model = ProjectStage
        fields = [
            'id', 'project', 'stage_type', 'stage_type_display', 'name', 
            'stage_status', 'stage_status_display', 'description', 
            'progress', 'created_at', 
            'updated_at', 'metadata', 
            'tasks_l1'  # 任务列表，现在只包含task_level=1的任务
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