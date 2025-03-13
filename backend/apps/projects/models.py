import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)

# 所有枚举定义移到类外部
class StageType(models.TextChoices):
    TENDER_ANALYSIS = 'TENDER_ANALYSIS', '招标文件分析'
    BID_WRITING = 'BID_WRITING', '投标文件编写'


class ProjectType(models.TextChoices):
    WELFARE = 'WELFARE', '企业福利'  # 值为'WELFARE', 显示为'企业福利' 
    FSD = 'FSD', '食材配送'
    OTHER = 'OTHER', '其他'

class ProjectStatus(models.TextChoices):
    IN_PROGRESS = 'IN_PROGRESS', '进行中'
    COMPLETED = 'COMPLETED', '已完成'
    CANCELLED = 'CANCELLED', '已取消'

class StageStatus(models.TextChoices):
    NOT_STARTED = 'NOT_STARTED', '未开始'
    IN_PROGRESS = 'IN_PROGRESS', '进行中'
    COMPLETED = 'COMPLETED', '已完成'
    BLOCKED = 'BLOCKED', '阻塞中'

class TaskType(models.TextChoices):
    UPLOAD_TENDER_FILE = 'UPLOAD_TENDER_FILE', '上传招标文件'
    DOCX_EXTRACTION_TASK = 'DOCX_EXTRACTION_TASK', '提取文档信息'
    DOCX_TREE_BUILD_TASK = 'DOCX_TREE_BUILD_TASK', '构建文档树'
    #AI_STRUCTURE_ANALYSIS = 'AI_STRUCTURE_ANALYSIS', 'AI分析层级结构'
    #BIDDER_INSTRUCTION_ANALYSIS = 'BIDDER_INSTRUCTION_ANALYSIS', '分析投标人须知'
    # SCORING_CRITERIA_ANALYSIS = 'SCORING_CRITERIA_ANALYSIS', '分析评分标准'
    # BID_DOCUMENT_COMPOSITION = 'BID_DOCUMENT_COMPOSITION', '分析投标文件组成'
    # CHAPTER_WRITING = 'CHAPTER_WRITING', '章节撰写'
    # TECHNICAL_SOLUTION = 'TECHNICAL_SOLUTION', '技术方案'
    # PRICE_PROPOSAL = 'PRICE_PROPOSAL', '价格方案'
    # QUALIFICATION_DOCUMENTS = 'QUALIFICATION_DOCUMENTS', '资质文件'
    # DOCUMENT_REVIEW = 'DOCUMENT_REVIEW', '文档审核'
    # DOCUMENT_REVISION = 'DOCUMENT_REVISION', '文档修订'
    # DOCUMENT_PRODUCTION = 'DOCUMENT_PRODUCTION', '文档生产'
    OTHER = 'OTHER', '其他'

class TaskStatus(models.TextChoices):
    PENDING = 'PENDING', '待处理'
    PROCESSING = 'PROCESSING', '处理中'
    COMPLETED = 'COMPLETED', '已完成'
    FAILED = 'FAILED', '失败'
    CONFIRMED = 'CONFIRMED', '已确认'
    BLOCKED = 'BLOCKED', '阻塞中'

class TaskLockStatus(models.TextChoices):
    LOCKED = 'LOCKED', '锁定'
    UNLOCKED = 'UNLOCKED', '解锁'

class Project(models.Model):
    # related_name: 
    # files (在files.models.py中使用), 
    # stages(来自ProjectStage模型),  

    # 使用UUID作为主键
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_name = models.CharField('项目名称', max_length=200)
    tenderee = models.CharField('招标单位', max_length=200)
    bidder = models.CharField('投标单位', max_length=200, blank=True, default='')
    project_type = models.CharField(
        '项目类型',
        max_length=20,
        choices=ProjectType.choices,
        default=ProjectType.OTHER
    )
    bid_deadline = models.DateTimeField('投标截止时间', blank=True, null=True)
    status = models.CharField(
        '项目状态',
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.IN_PROGRESS
    )
    is_urgent = models.BooleanField('是否紧急', default=False)
    current_active_stage = models.CharField(
        '当前活动阶段',
        max_length=20,
        choices=StageType.choices,
        default=StageType.TENDER_ANALYSIS
    )
    creator = models.ForeignKey(    
        settings.AUTH_USER_MODEL,   #指向用户模型的引用
        on_delete=models.PROTECT,
        related_name='created_projects',
        verbose_name='创建者'
    )
    create_time = models.DateTimeField('创建时间', auto_now_add=True)
    last_update_time = models.DateTimeField('最后更新时间', auto_now=True)

    class Meta:
        verbose_name = '项目'
        verbose_name_plural = '项目'
        ordering = ['-create_time']

    def __str__(self):
        return f"{self.id} - {self.project_name}"

# 统一的阶段模型，替代之前的多个阶段类
class ProjectStage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='stages',
        verbose_name='项目'
    )
    stage_type = models.CharField(
        '阶段类型',
        max_length=20,
        choices=StageType.choices
    )
    name = models.CharField('阶段名称', max_length=100)
    
    stage_status = models.CharField(
        '状态',
        max_length=20,
        choices=StageStatus.choices,
        default=StageStatus.NOT_STARTED
    )

    description = models.TextField('描述', blank=True)

    # 可选字段，根据不同阶段类型可能存在
    progress = models.IntegerField('进度', default=0)
    remarks = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    # 其他可能的阶段特定字段可以存储在metadata中
    metadata = models.JSONField('元数据', blank=True, default=dict)
    
    class Meta:
        verbose_name = '项目阶段'
        verbose_name_plural = '项目阶段'
        indexes = [
            models.Index(fields=['project', 'stage_type']),
        ]
        unique_together = [['project', 'stage_type']]
    
    def __str__(self):
        return f"{self.project.id} - {self.name}"

class BaseTask(models.Model):
    # 直接关联到统一的阶段模型
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stage = models.ForeignKey(
        ProjectStage,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='所属阶段'
    )
    
    name = models.CharField('任务名称', max_length=100)
    description = models.TextField('描述', blank=True)
    type = models.CharField(
        '任务类型',
        max_length=50,
        choices=TaskType.choices,
        default=TaskType.OTHER
    )
    status = models.CharField(
        '状态',
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    lock_status = models.CharField(
        '锁定状态',
        max_length=20,
        choices=TaskLockStatus.choices,
        default=TaskLockStatus.UNLOCKED
    )


    class Meta:
        verbose_name = '基础任务'
        verbose_name_plural = '基础任务'
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"

class TenderFileUploadTask(BaseTask):
    pass

class DocxExtractionTask(BaseTask):
    extracted_elements = models.JSONField(
        null=True,
        blank=True,
        verbose_name='提取的文档元素',
        help_text='存储从文档中提取的结构化元素'
    )
    # 初步大纲分析结果
    outline_analysis_result = models.JSONField(
        null=True,
        blank=True,
        verbose_name='大纲分析结果',
        help_text='存储大纲分析的结果'
    )
    
    # 初步大纲优化后的文档元素
    improved_docx_elements = models.JSONField(
        null=True,
        blank=True,
        verbose_name='初步大纲优化后的文档元素',
        help_text='存储从经过初步大纲优化的结构化元素'
    )

class DocxTreeBuildTask(BaseTask):
    docxtree = models.JSONField(
        null=True,
        blank=True,
        verbose_name='初步大纲优化后的文档元素',
        help_text='存储从经过初步大纲优化的结构化元素'
    )

    more_subtitles = models.JSONField(
        null=True,
        blank=True,
        verbose_name='更多子标题',
        help_text='存储从经过初步大纲优化的结构化元素'
    )
    class Meta:
        verbose_name = '文档树构建任务'
        verbose_name_plural = '文档树构建任务'





class ProjectChangeHistory(models.Model):
    """项目变更历史记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operation_id = models.UUIDField(
        '操作ID', 
        default=uuid.uuid4,
        db_index=True,
        help_text='同一操作中的多个字段变更共享相同的操作ID'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='change_histories',
        verbose_name='项目'
    )
    
    # 基本字段变更
    field_name = models.CharField('变更字段', max_length=100)
    old_value = models.TextField('旧值', blank=True, null=True)
    new_value = models.TextField('新值', blank=True, null=True)
    
    # 元数据
    changed_at = models.DateTimeField('变更时间', auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='project_changes',
        verbose_name='操作人'
    )
    remarks = models.TextField('备注', blank=True)
    
    class Meta:
        verbose_name = '项目变更历史'
        verbose_name_plural = '项目变更历史'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['project', 'changed_at']),
            models.Index(fields=['field_name']),
        ]
    
    def __str__(self):
        return f"{self.project.project_name} - {self.field_name} 变更于 {self.changed_at}"


class StageChangeHistory(models.Model):
    """阶段变更历史记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operation_id = models.UUIDField(
        '操作ID', 
        default=uuid.uuid4,
        db_index=True,
        help_text='同一操作中的多个字段变更共享相同的操作ID'
    )
    stage = models.ForeignKey(
        ProjectStage,
        on_delete=models.CASCADE,
        related_name='change_histories',
        verbose_name='阶段'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='stage_change_histories',
        verbose_name='项目'
    )
    
    # 基本字段变更
    field_name = models.CharField('变更字段', max_length=100)
    old_value = models.TextField('旧值', blank=True, null=True)
    new_value = models.TextField('新值', blank=True, null=True)
    
    # 元数据
    changed_at = models.DateTimeField('变更时间', auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='stage_changes',
        verbose_name='操作人'
    )
    remarks = models.TextField('备注', blank=True)
    
    class Meta:
        verbose_name = '阶段变更历史'
        verbose_name_plural = '阶段变更历史'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['stage', 'changed_at']),
            models.Index(fields=['project', 'changed_at']),
            models.Index(fields=['field_name']),
        ]
    
    def __str__(self):
        return f"{self.stage.name} - {self.field_name} 变更于 {self.changed_at}"


class TaskChangeHistory(models.Model):
    """任务变更历史记录"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operation_id = models.UUIDField(
        '操作ID', 
        default=uuid.uuid4,
        db_index=True,
        help_text='同一操作中的多个字段变更共享相同的操作ID'
    )
    task = models.ForeignKey(
        BaseTask,
        on_delete=models.CASCADE,
        related_name='change_histories',
        verbose_name='任务'
    )
    stage = models.ForeignKey(
        ProjectStage,
        on_delete=models.CASCADE,
        related_name='task_change_histories',
        verbose_name='阶段'
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='task_change_histories',
        verbose_name='项目'
    )
    
    # 任务类型
    task_type = models.CharField(
        '任务类型',
        max_length=50,
        choices=TaskType.choices,
        default=TaskType.OTHER
    )
    
    # 基本字段变更
    field_name = models.CharField('变更字段', max_length=100)
    old_value = models.TextField('旧值', blank=True, null=True)
    new_value = models.TextField('新值', blank=True, null=True)
    
    # 对于复杂字段（如JSON类型），可以存储有意义的摘要
    is_complex_field = models.BooleanField('是否复杂字段', default=False)
    change_summary = models.TextField('变更摘要', blank=True, null=True)  # 例如"更新了10个元素"
    
    # 元数据
    changed_at = models.DateTimeField('变更时间', auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='task_changes',
        verbose_name='操作人'
    )
    remarks = models.TextField('备注', blank=True)
    
    class Meta:
        verbose_name = '任务变更历史'
        verbose_name_plural = '任务变更历史'
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['task', 'changed_at']),
            models.Index(fields=['stage', 'changed_at']),
            models.Index(fields=['project', 'changed_at']),
            models.Index(fields=['task_type']),
            models.Index(fields=['field_name']),
        ]
    
    def __str__(self):
        return f"{self.task.name} - {self.field_name} 变更于 {self.changed_at}"







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
                TenderFileUploadTask.objects.create(
                    stage=stage,
                    name='招标文件上传',
                    description='上传招标文件',
                    type=TaskType.UPLOAD_TENDER_FILE,
                    status=TaskStatus.PENDING
                )
                # 创建文档提取任务
                DocxExtractionTask.objects.create(
                    stage=stage,
                    name='招标文件信息提取',
                    description='从招标文件中提取结构化信息',
                    type=TaskType.DOCX_EXTRACTION_TASK,
                    status=TaskStatus.PENDING
                )
                
                # 创建文档树构建任务
                DocxTreeBuildTask.objects.create(
                    stage=stage,
                    name='招标文件树构建',
                    description='构建招标文件的层级结构树',
                    type=TaskType.DOCX_TREE_BUILD_TASK,
                    status=TaskStatus.PENDING
                )
                
                logger.info(f"为阶段 {stage_name} 创建了文档提取和文档树构建任务")