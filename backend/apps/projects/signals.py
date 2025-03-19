import uuid
import json
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
import logging
from .models import (
    Project, ProjectStage,Task,
    ProjectChangeHistory, StageChangeHistory, TaskChangeHistory,
    StageType, StageStatus, TaskType, TaskStatus, TaskLockStatus
)

logger = logging.getLogger(__name__)
User = get_user_model()




# Helper function to set user and remarks before saving a model
def set_change_metadata(instance, user, remarks=''):
    """在保存之前设置实例上的用户和备注。"""
    instance._change_user = user
    if remarks:
        instance._change_remarks = remarks
    return instance

# Helper functions to compare values and determine changes
def compare_values(old_value, new_value, field_name):
    """比较旧值和新值，确定它们是否已更改。"""
    # Add logging for JSONField comparison
    if field_name == 'tiptap_content':
        logger.info(f"compare_values for tiptap_content:")
        logger.info(f"Old value type: {type(old_value)}")
        logger.info(f"New value type: {type(new_value)}")
    
    # 检查字段是否是JSON字段
    if isinstance(old_value, dict) or isinstance(new_value, dict):
        # 对于JSON字段，转换为字符串进行比较
        old_str = json.dumps(old_value, sort_keys=True) if old_value else None
        new_str = json.dumps(new_value, sort_keys=True) if new_value else None
        
        # Add logging for JSON string comparison
        if field_name == 'tiptap_content':
            logger.info(f"JSON comparison:")
            logger.info(f"Old JSON string: {old_str}")
            logger.info(f"New JSON string: {new_str}")
            logger.info(f"Are they different? {old_str != new_str}")
        
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


# ============================== 项目变更历史记录 ==============================
# Project model signal
@receiver(pre_save, sender=Project)
def track_project_changes(sender, instance, **kwargs):
    """跟踪Project模型字段的变更。"""
    try:
        # 仅跟踪现有实例的变更, 不能使用instance.pk, 因为创建时，可能提前分配了pk. 
        if instance._state.adding:
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
        logger.error(f"PROJECT变更 历史记录失败: {str(e)}", exc_info=True)

# ProjectStage model signal
@receiver(pre_save, sender=ProjectStage)
def track_stage_changes(sender, instance, **kwargs):
    """跟踪ProjectStage模型字段的变更。"""
    try:
        # 仅跟踪现有实例的变更,不能使用instance.pk, 因为创建时，可能提前分配了pk. 
        if instance._state.adding:
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
            'name', 'stage_status', 'description', 'progress', 'metadata'
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
        logger.error(f"Stage变更 历史记录失败: {str(e)}", exc_info=True)

# BaseTask model signal - 使用动态字段检测，支持所有子类
@receiver(pre_save, sender=Task)
def track_task_changes(sender, instance, **kwargs):
    """跟踪BaseTask及其所有子类的变更。"""
    try:
        # 仅跟踪现有实例的变更,不能使用instance.pk, 因为创建时，可能提前分配了pk. 
        if instance._state.adding:
            logger.info(f"新任务创建，不触发变更历史记录: {instance.name}")
            return
        
        # 从数据库获取当前状态
        old_instance = sender.objects.get(pk=instance.pk)
        
        # 从线程本地存储获取当前用户
        user = getattr(instance, '_change_user', None)
        if not user:
            # 尝试获取项目创建者
            user = instance.stage.project.creator
        remarks = getattr(instance, '_change_remarks', '')
        
        # 生成操作ID
        operation_id = uuid.uuid4()
        
        # 获取所有字段
        fields_to_track = [
            'name', 'description', 'type', 'status', 'lock_status', 'tiptap_content'
        ]
        
        for field in fields_to_track:
            old_value = getattr(old_instance, field)
            new_value = getattr(instance, field)
            
            # Add detailed logging for tiptap_content
            if field == 'tiptap_content':
                logger.info(f"Comparing tiptap_content for task {instance.id}:")
                logger.info(f"Old value type: {type(old_value)}, value: {old_value}")
                logger.info(f"New value type: {type(new_value)}, value: {new_value}")
            
            changed, old_str, new_str, is_complex = compare_values(old_value, new_value, field)
            
            # Add more logging for tiptap_content comparison result
            if field == 'tiptap_content':
                logger.info(f"Comparison result: changed={changed}, is_complex={is_complex}")
                logger.info(f"Old string: {old_str}")
                logger.info(f"New string: {new_str}")
            
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
        logger.error(f"TASK变更 历史记录失败: {str(e)}", exc_info=True)


# ============================== 项目阶段初始化 ==============================
@receiver(post_save, sender=Project)
def initialize_project_stages(sender, instance, created, **kwargs):
    """当项目创建后，初始化所有项目阶段"""
    if created:
        logger.info(f"检测到新项目创建: {instance.id}，开始初始化项目阶段")
        
        # 直接使用StageType中的所有未注释的选项
        for stage_type in StageType:
            # 当前活动阶段设为"进行中"，其他阶段设为"未开始"
            status = StageStatus.IN_PROGRESS if stage_type == instance.current_active_stage else StageStatus.NOT_STARTED
            
            # 获取阶段的显示名称
            stage_name = stage_type.label
            
            logger.info(f"开始创建阶段: {stage_name}, 状态: {status}")
            # 创建阶段
            stage = ProjectStage.objects.create(
                project=instance,
                stage_type=stage_type,
                name=stage_name,
                stage_status=status,
                description=f'{stage_name}阶段'
            )
            logger.info(f"阶段创建成功: {stage_name}，状态: {status}，关联项目: {instance.id}")
            
            # 为招标文件分析阶段创建相关任务
            if stage_type == StageType.TENDER_ANALYSIS:
                # 创建招标文件上传任务
                Task.objects.create(
                    stage=stage,
                    name='招标文件上传',
                    description='上传招标文件',
                    type=TaskType.UPLOAD_TENDER_FILE,
                    status=TaskStatus.PENDING,
                    lock_status=TaskLockStatus.UNLOCKED,
                    tiptap_content=None
                )
                # 创建文档提取任务
                Task.objects.create(
                    stage=stage,
                    name='招标文件信息提取',
                    description='从招标文件中提取结构化信息',
                    type=TaskType.DOCX_EXTRACTION_TASK,
                    status=TaskStatus.PENDING,
                    lock_status=TaskLockStatus.UNLOCKED
                )
                
                logger.info(f"为阶段 {stage_name} 创建了文档提取和文档树构建任务")


#@receiver(post_save, sender=Task)
def handle_task_status_change(sender, instance, created, **kwargs):
    """
    处理任务状态变更的通用处理器
    """
    if created:
        logger.info(f"新建任务: {instance.name}, 类型: {instance.type}")
        return
        
    logger.info(f"任务状态更新: {instance.name}, 类型: {instance.type}, 状态: {instance.status}, 锁定状态: {instance.lock_status}")

    # 根据任务类型和状态调用不同的处理器
    if instance.type == TaskType.UPLOAD_TENDER_FILE:
        handle_file_upload_auto_task(instance)
    elif instance.type == TaskType.DOCX_EXTRACTION_TASK:
        handle_docx_extraction_auto_task(instance)



def handle_file_upload_auto_task(sender, instance, created, **kwargs):
    """
    当TenderFileUploadTask被更新为COMPLETED状态且被locked时触发改任务，本任务目的：
    1. 检查file_upload任务的状态是否为completed+locked
    2. 检查是否刚从UNLOCKED转为LOCKED
    3. 检查项目是否有关联文件
    4. 检查DocxExtractionTask是否是PENDING状态
    5. 如果以上条件都满足，则将DocxExtractionTask的状态更新为PROCESSING - > 触发handle_auto_docx_extraction信号
    """

    logger.info(f"Handle_tender_file_upload_locked 被触发")
    
    # 1. 外围条件：FileUploadTask 为 COMPLETED + locked 状态
    if not created and instance.lock_status == TaskLockStatus.LOCKED and instance.status == TaskStatus.COMPLETED:
        logger.info(f"探测到 TenderFileUploadTask状态为: COMPLETED + LOCKED")
        try:
            # 获取相关联的阶段和项目
            stage = instance.stage
            project = stage.project

            # 2. 检查是否从UNLOCKED转为LOCKED？
            from apps.projects.models import TaskChangeHistory
            
            lock_status_change = TaskChangeHistory.objects.filter(
                task=instance,
                field_name='lock_status',
                old_value=TaskLockStatus.UNLOCKED,
                new_value=TaskLockStatus.LOCKED
            ).order_by('-changed_at').first()

            if not lock_status_change:
                logger.warning(f"文件上传任务状态不是从UNLOCKED转为LOCKED，跳过处理")
                return

            logger.info(f"检查到 文件上传任务 从非锁定到锁定")

            # 3. 检查项目是否有关联文件
            if not hasattr(project, 'files') or not project.files.exists():
                logger.warning(f"项目 {project.id} 没有关联文件，无法执行文档提取")
                return
            logger.info(f"检查到 项目有关联的文件！")


            # 4. 检查DocxExtractionTask是否是PENDING状态
            docx_extraction_task = Task.objects.filter(
                stage=stage,
                type=TaskType.DOCX_EXTRACTION_TASK,
                status=TaskStatus.PENDING
            ).first()

            if not docx_extraction_task:
                logger.warning(f"文档提取任务不在PENDING状态，无法启动")
                return

            logger.info(f"检查到 文档提取任务为PENDING状态")

            # 5. 更新DocxExtractionTask状态为PROCESSING -> 用来触发handle_auto_docx_extraction信号
            docx_extraction_task.status = TaskStatus.PROCESSING
            docx_extraction_task.save()
            logger.info(f"文档提取任务状态更新为PROCESSING 并 save()")

        except Exception as e:
            logger.error(f"文件上传任务处理失败: {str(e)}")




# ============================== 文档提取任务处理 ==============================
def handle_docx_extraction_auto_task(sender, instance, created, **kwargs):
    """
    自动触发文档内容提取，需进一步满足以下条件：
    1. DocxExtractionTask 满足 PROCESSING + UNLOCKED 状态
    2. DocxExtractionTask 状态刚从PENDING转为PROCESSING 
    3. TenderFileUploadTask 满足 COMPLETED + LOCKED 状态 （上一个任务的完成情况）
    4. 项目关联文件存在
    执行：
    a. DocxExtractionTask 状态更新为COMPLETED, 使用update()方法，避免触发post_save信号
    b. 使用Celery任务异步处理文档提取
    """

    logger.info(f"DocxExtractionTask状态更新，检查是否需要启动文档提取")

    # 1. 外围条件：DocxExtractionTask 满足 PROCESSING + UNLOCKED 状态
    if not created and instance.status == TaskStatus.PROCESSING and instance.lock_status == TaskLockStatus.UNLOCKED:

        logger.info(f"探测到 DocxExtractionTask状态为: PROCESSING + UNLOCKED")

        try:
            # 获取相关联的阶段和项目 
            stage = instance.stage
            project = stage.project


            # 2. 检查状态是否从PENDING转为PROCESSING
            
            status_change = TaskChangeHistory.objects.filter(
                task=instance,
                field_name='status',
                old_value=TaskStatus.PENDING,
                new_value=TaskStatus.PROCESSING
            ).order_by('-changed_at').first()
            
            if not status_change:
                logger.warning(f"DocxExtractionTask状态不是从PENDING转为PROCESSING，跳过处理")
                return
            
            logger.info(f"检查到 DocxExtractionTask状态从PENDING转为PROCESSING")            

            # 3. 检查TenderFileUpload任务是否已完成且被锁定 （上一个任务的完成情况）
            upload_task = Task.objects.filter(
                stage=stage,
                type=TaskType.UPLOAD_TENDER_FILE,
                status=TaskStatus.COMPLETED,
                lock_status=TaskLockStatus.LOCKED
            ).first()
            
            if not upload_task:
                logger.warning(f"文件上传任务未完成或未锁定，无法执行文档提取")
                return
            
            logger.info(f"检查到 文件上传任务已完成且被锁定")


            # 4. 检查项目是否有关联文件
            if not hasattr(project, 'files') or not project.files.exists():
                logger.warning(f"项目 {project.id} 没有关联文件，无法执行文档提取")
                return
            logger.info(f"检查到 项目有关联的文件！")

        
            # a. 使用update直接更新数据库，避免触发post_save信号
            Task.objects.filter(pk=instance.pk).update(
                status=TaskStatus.COMPLETED
            )
            # 更新内存中的实例状态，确保一致性
            instance.status = TaskStatus.COMPLETED
            logger.info(f"DocxExtractionTask状态更新为COMPLETED, 这样处理避免触发post_save信号后，重复执行文档提取")

            
            # b. 使用Celery任务异步处理文档提取
            from .tasks import process_docx_extraction
            process_docx_extraction.delay(project.id)
            
            logger.info(f"已启动异步文档提取任务，project_id={project.id}")

        except Exception as e:
            logger.error(f"DocxExtractionTask处理失败: {str(e)}")
            # 发生错误时，标记为失败
            Task.objects.filter(pk=instance.pk).update(
                status=TaskStatus.FAILED
            )