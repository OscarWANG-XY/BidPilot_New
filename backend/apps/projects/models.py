import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class Project(models.Model):
    # related_name: 
    # files (在files.models.py中使用), 
    # stages(来自ProjectStage模型),  
    # project_histories(来自ProjectHistory模型)

    # 项目状态选项
    class StageType(models.TextChoices):
        INITIALIZATION = 'INITIALIZATION','项目初始化'
        TENDER_ANALYSIS = 'TENDER_ANALYSIS', '招标文件解读'
        BID_WRITING = 'BID_WRITING', '投标文件撰写'
        BID_REVISION = 'BID_REVISION', '投标文件修订'
        BID_PRODUCTION = 'BID_PRODUCTION', '生产投标文件'

    # 项目类型选项（你可能需要根据实际需求调整）
    class ProjectType(models.TextChoices):
        WELFARE = 'WELFARE', '企业福利'
        FSD = 'FSD', '食材配送'
        OTHER = 'OTHER', '其他'

    class ProjectStatus(models.TextChoices):
        IN_PROGRESS = 'IN_PROGRESS', '进行中'
        COMPLETED = 'COMPLETED', '已完成'
        CANCELLED = 'CANCELLED', '已取消'
        
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
    current_active_stage = models.CharField(
        '当前活动阶段',
        max_length=20,
        choices=StageType.choices,
        default=StageType.INITIALIZATION
    )
    
    is_urgent = models.BooleanField('是否紧急', default=False)
    creator = models.ForeignKey(    
        settings.AUTH_USER_MODEL,   #指向用户模型的引用
        on_delete=models.PROTECT,
        related_name='created_projects',
        verbose_name='创建者'
    )
    create_time = models.DateTimeField('创建时间', auto_now_add=True)
    last_update_time = models.DateTimeField('最后更新时间', auto_now=True)

    def save(self, *args, **kwargs):
        # 方法1：使用 _state.adding 属性检查是否为新对象, 而不是使用self.pk, 其在save之前就被创建。
        is_new = self._state.adding
        logger.info(f"检查项目ID: {self.id}是否是新项目？ 是否新创建: {is_new}")
        
        # 如果这是一个已存在的项目（不是新创建的）
        if not is_new:
            try:
                logger.info(f"检查项目{self.pk}已存在，尝试获取项目ID:{self.pk}的实例")
                old_instance = Project.objects.get(pk=self.pk)
                # 如果状态发生了变化
                if old_instance.current_active_stage != self.current_active_stage:
                    # 创建历史记录
                    ProjectHistory.objects.create(
                        project=self,
                        from_stage=old_instance.current_active_stage,
                        to_stage=self.current_active_stage,
                        remarks=kwargs.pop('remarks', '')  # 如果有备注信息则使用
                    )
            except Project.DoesNotExist:
                pass
        
        # 调用父类的 save 方法
        super().save(*args, **kwargs)
        
        # 如果是新创建的项目，初始化所有项目阶段
        if is_new:
            self._initialize_project_stages()

    def _initialize_project_stages(self):
        """初始化项目的所有阶段"""
        logger.info(f"阶段初始化函数被调用，项目ID: {self.id}")
        # 为每个可能的阶段类型创建一个阶段记录
        stage_names = {
            self.StageType.INITIALIZATION: '项目初始化',
            self.StageType.TENDER_ANALYSIS: '招标文件解读',
            self.StageType.BID_WRITING: '投标文件撰写',
            self.StageType.BID_REVISION: '投标文件修订',
            self.StageType.BID_PRODUCTION: '生产投标文件',
        }
        
        # 设置初始阶段的状态
        for stage_type, stage_name in stage_names.items():
            # 当前活动阶段设为"进行中"，其他阶段设为"未开始"
            status = ProjectStage.StageStatus.IN_PROGRESS if stage_type == self.current_active_stage else ProjectStage.StageStatus.NOT_STARTED
            
            logger.info(f"开始创建阶段: {stage_name}, 状态: {status}")
            # 创建阶段 - 修改字段名
            ProjectStage.objects.create(
                project=self,
                stage_type=stage_type,  # 修改: stage -> stage_type
                name=stage_name,
                stage_status=status,    # 修改: status -> stage_status
                description=f'{stage_name}阶段'
            )
            logger.info(f"阶段创建成功: {stage_name}，状态: {status}，关联项目: {self.id}")

    class Meta:
        verbose_name = '项目'
        verbose_name_plural = '项目'
        ordering = ['-create_time']

    def __str__(self):
        return f"{self.id} - {self.project_name}"


class ProjectHistory(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='project_histories',
        verbose_name='项目'
    )
    from_stage = models.CharField(
        '原阶段',
        max_length=20,
        choices=Project.StageType.choices
    )
    to_stage = models.CharField(
        '新阶段',
        max_length=20,
        choices=Project.StageType.choices
    )
    from_status = models.CharField(max_length=20, choices=Project.ProjectStatus.choices, null=True, blank=True)
    to_status = models.CharField(max_length=20, choices=Project.ProjectStatus.choices, null=True, blank=True)
    operation_time = models.DateTimeField('操作时间', auto_now_add=True)
    remarks = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '项目阶段历史'
        verbose_name_plural = '项目阶段历史'
        ordering = ['-operation_time']

    def __str__(self):
        return f"{self.project.id} - {self.from_stage} -> {self.to_stage}"


# 统一的阶段模型，替代之前的多个阶段类
class ProjectStage(models.Model):
    # 阶段状态选项
    class StageStatus(models.TextChoices):
        NOT_STARTED = 'NOT_STARTED', '未开始'
        IN_PROGRESS = 'IN_PROGRESS', '进行中'
        COMPLETED = 'COMPLETED', '已完成'
        BLOCKED = 'BLOCKED', '阻塞中'
    
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='stages',
        verbose_name='项目'
    )
    stage_type = models.CharField(
        '阶段类型',
        max_length=20,
        choices=Project.StageType.choices
    )
    name = models.CharField('阶段名称', max_length=100)
    stage_status = models.CharField(
        '状态',
        max_length=20,
        choices=StageStatus.choices,
        default=StageStatus.NOT_STARTED
    )
    description = models.TextField('描述', blank=True)
    progress = models.IntegerField('进度', default=0)
    remarks = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    # 可选字段，根据不同阶段类型可能存在
    file_id = models.CharField('文件ID', max_length=100, blank=True)
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
    # 任务类型选项
    class TaskType(models.TextChoices):
        DOCUMENT_EXTRACTION = 'DOCUMENT_EXTRACTION', '提取文档信息'
        DOCUMENT_TREE_BUILDING = 'DOCUMENT_TREE_BUILDING', '构建文档树'
        AI_STRUCTURE_ANALYSIS = 'AI_STRUCTURE_ANALYSIS', 'AI分析层级结构'
        BIDDER_INSTRUCTION_ANALYSIS = 'BIDDER_INSTRUCTION_ANALYSIS', '分析投标人须知'
        SCORING_CRITERIA_ANALYSIS = 'SCORING_CRITERIA_ANALYSIS', '分析评分标准'
        BID_DOCUMENT_COMPOSITION = 'BID_DOCUMENT_COMPOSITION', '分析投标文件组成'
        CHAPTER_WRITING = 'CHAPTER_WRITING', '章节撰写'
        TECHNICAL_SOLUTION = 'TECHNICAL_SOLUTION', '技术方案'
        PRICE_PROPOSAL = 'PRICE_PROPOSAL', '价格方案'
        QUALIFICATION_DOCUMENTS = 'QUALIFICATION_DOCUMENTS', '资质文件'
        DOCUMENT_REVIEW = 'DOCUMENT_REVIEW', '文档审核'
        DOCUMENT_REVISION = 'DOCUMENT_REVISION', '文档修订'
        DOCUMENT_PRODUCTION = 'DOCUMENT_PRODUCTION', '文档生产'
        OTHER = 'OTHER', '其他'
    
    # 任务状态选项
    class TaskStatus(models.TextChoices):
        PENDING = 'PENDING', '待处理'
        PROCESSING = 'PROCESSING', '处理中'
        COMPLETED = 'COMPLETED', '已完成'
        FAILED = 'FAILED', '失败'
        CONFIRMED = 'CONFIRMED', '已确认'
        BLOCKED = 'BLOCKED', '阻塞中'
    
    # 直接关联到统一的阶段模型
    stage = models.ForeignKey(
        ProjectStage,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='所属阶段'
    )
    
    name = models.CharField('任务名称', max_length=100)
    description = models.TextField('描述', blank=True)
    progress = models.IntegerField('进度', default=0)
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
    
    class Meta:
        verbose_name = '基础任务'
        verbose_name_plural = '基础任务'
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"


class DocumentExtractionTask(BaseTask):
    file_id = models.CharField('文件ID', max_length=100, blank=True)
    
    class Meta:
        verbose_name = '文档提取任务'
        verbose_name_plural = '文档提取任务'


class DocumentTreeBuildingTask(BaseTask):
    class Meta:
        verbose_name = '文档树构建任务'
        verbose_name_plural = '文档树构建任务'

    