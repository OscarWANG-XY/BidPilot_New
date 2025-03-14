import uuid
import json
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging
from .models import (
    Project, ProjectStage, BaseTask,
    ProjectChangeHistory, StageChangeHistory, TaskChangeHistory
)

logger = logging.getLogger(__name__)
User = get_user_model()

# Helper functions to compare values and determine changes
def compare_values(old_value, new_value, field_name):
    """比较旧值和新值，确定它们是否已更改。"""
    # 检查字段是否是JSON字段
    if isinstance(old_value, dict) or isinstance(new_value, dict):
        # 对于JSON字段，转换为字符串进行比较
        old_str = json.dumps(old_value, sort_keys=True) if old_value else None
        new_str = json.dumps(new_value, sort_keys=True) if new_value else None
        return old_str != new_str, old_str, new_str, True
    # 检查值是否不同
    has_changed = old_value != new_value
    return has_changed, str(old_value) if old_value is not None else None, str(new_value) if new_value is not None else None, False

def get_change_summary(old_value, new_value, field_name):
    """为复杂字段生成变更摘要。"""
    if not old_value and new_value:
        return f"添加了'{field_name}'内容"
    elif old_value and not new_value:
        return f"移除了'{field_name}'内容"
    else:
        # 比较字典
        if isinstance(old_value, dict) and isinstance(new_value, dict):
            added_keys = set(new_value.keys()) - set(old_value.keys())
            removed_keys = set(old_value.keys()) - set(new_value.keys())
            modified_keys = set()
            
            for key in set(old_value.keys()).intersection(set(new_value.keys())):
                if old_value[key] != new_value[key]:
                    modified_keys.add(key)
            
            changes = []
            if added_keys:
                changes.append(f"添加了{len(added_keys)}个字段")
            if removed_keys:
                changes.append(f"移除了{len(removed_keys)}个字段")
            if modified_keys:
                changes.append(f"修改了{len(modified_keys)}个字段")
            
            return "，".join(changes) or "内容已更新"
        
        # 默认摘要
        return "内容已更新"

# Project model signal
@receiver(pre_save, sender=Project)
def track_project_changes(sender, instance, **kwargs):
    """跟踪Project模型字段的变更。"""
    try:
        # 仅跟踪现有实例的变更
        if not instance.pk:
            logger.info(f"新项目创建，不触发变更历史记录: {instance.project_name}")
            return
        
        # 从数据库获取当前状态
        old_instance = sender.objects.get(pk=instance.pk)
        
        # 从线程本地存储获取当前用户
        user = getattr(instance, '_change_user', None)
        if not user:
            # 尝试获取上次修改项目的用户
            user = User.objects.filter(created_projects__id=instance.pk).first()
        
        # 获取备注（如果提供）
        remarks = getattr(instance, '_change_remarks', '')
        
        # 为此事务中的所有变更生成单个操作ID
        operation_id = uuid.uuid4()
        
        # 跟踪每个字段的变更
        fields_to_track = [
            'project_name', 'tenderee', 'bidder', 'project_type', 
            'bid_deadline', 'status', 'is_urgent', 'current_active_stage'
        ]
        
        for field in fields_to_track:
            old_value = getattr(old_instance, field)
            new_value = getattr(instance, field)
            
            changed, old_str, new_str, is_complex = compare_values(old_value, new_value, field)
            
            if changed:
                logger.info(f"项目变更: {field} 从 '{old_str}' 变为 '{new_str}'")
                
                # 创建历史记录
                ProjectChangeHistory.objects.create(
                    operation_id=operation_id,
                    project=instance,
                    field_name=field,
                    old_value=old_str,
                    new_value=new_str,
                    changed_by=user,
                    remarks=remarks
                )
    except Exception as e:
        logger.error(f"项目变更历史记录失败: {str(e)}", exc_info=True)

# ProjectStage model signal
@receiver(pre_save, sender=ProjectStage)
def track_stage_changes(sender, instance, **kwargs):
    """跟踪ProjectStage模型字段的变更。"""
    try:
        # 仅跟踪现有实例的变更
        if not instance.pk:
            logger.info(f"新阶段创建，不触发变更历史记录: {instance.name}")
            return
        
        # 从数据库获取当前状态
        old_instance = sender.objects.get(pk=instance.pk)
        
        # 从线程本地存储获取当前用户
        user = getattr(instance, '_change_user', None)
        if not user:
            # 尝试获取项目创建者
            user = instance.project.creator
        
        # 获取备注（如果提供）
        remarks = getattr(instance, '_change_remarks', '')
        
        # 为此事务中的所有变更生成单个操作ID
        operation_id = uuid.uuid4()
        
        # 跟踪每个字段的变更
        fields_to_track = [
            'name', 'stage_status', 'description', 'progress', 'remarks', 'metadata'
        ]
        
        for field in fields_to_track:
            old_value = getattr(old_instance, field)
            new_value = getattr(instance, field)
            
            changed, old_str, new_str, is_complex = compare_values(old_value, new_value, field)
            
            if changed:
                logger.info(f"阶段变更: {field} 从 '{old_str}' 变为 '{new_str}'")
                
                # 创建历史记录
                StageChangeHistory.objects.create(
                    operation_id=operation_id,
                    stage=instance,
                    project=instance.project,
                    field_name=field,
                    old_value=old_str,
                    new_value=new_str,
                    changed_by=user,
                    remarks=remarks
                )
    except Exception as e:
        logger.error(f"阶段变更历史记录失败: {str(e)}", exc_info=True)

# BaseTask model signal - 使用动态字段检测，支持所有子类
@receiver(pre_save, sender=BaseTask)
def track_task_changes(sender, instance, **kwargs):
    """跟踪BaseTask及其所有子类的变更。"""
    try:
        # 仅跟踪现有实例的变更
        if not instance.pk:
            logger.info(f"新任务创建，不触发变更历史记录: {instance.name}")
            return
        
        # 获取模型类和实际实例
        model_class = instance.__class__
        
        # 从数据库获取当前状态（使用实际模型类）
        old_instance = model_class.objects.get(pk=instance.pk)
        
        # 获取用户和备注
        user = getattr(instance, '_change_user', None) or instance.stage.project.creator
        remarks = getattr(instance, '_change_remarks', '')
        
        # 生成操作ID
        operation_id = uuid.uuid4()
        
        # 动态获取实际模型类（可能是子类）的所有字段
        fields_to_track = [f.name for f in model_class._meta.fields 
                         if not f.primary_key and f.name not in ('created_at', 'updated_at')]
        
        for field in fields_to_track:
            old_value = getattr(old_instance, field)
            new_value = getattr(instance, field)
            
            changed, old_str, new_str, is_complex = compare_values(old_value, new_value, field)
            
            if changed:
                logger.info(f"任务变更: {instance.name} - {field}")
                
                # 为复杂字段获取变更摘要
                change_summary = get_change_summary(old_value, new_value, field) if is_complex else None
                
                # 创建历史记录
                TaskChangeHistory.objects.create(
                    operation_id=operation_id,
                    task=instance,
                    stage=instance.stage,
                    project=instance.stage.project,
                    task_type=instance.type,
                    field_name=field,
                    old_value=old_str,
                    new_value=new_str,
                    is_complex_field=is_complex,
                    change_summary=change_summary,
                    changed_by=user,
                    remarks=remarks
                )
    except Exception as e:
        logger.error(f"任务变更历史记录失败: {str(e)}", exc_info=True)

# Helper function to set user and remarks before saving a model
def set_change_metadata(instance, user, remarks=''):
    """在保存之前设置实例上的用户和备注。"""
    instance._change_user = user
    if remarks:
        instance._change_remarks = remarks
    return instance