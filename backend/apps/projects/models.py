import uuid
from django.db import models
from django.conf import settings
from .tiptap.utils import (
    task_get_content_as_html, task_get_content_as_markdown,
    task_set_content_from_html, task_set_content_from_markdown
)
import logging
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
    OUTLINE_ANALYSIS_TASK = 'OUTLINE_ANALYSIS_TASK', '分析文档结构'
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
    NOT_STARTED = 'NOT_STARTED', '未开始'
    ACTIVE = 'ACTIVE', '激活中'
    COMPLETED = 'COMPLETED', '完成'
    FAILED = 'FAILED', '失败'

class TaskLockStatus(models.TextChoices):
    LOCKED = 'LOCKED', '锁定'
    UNLOCKED = 'UNLOCKED', '解锁'

class Project(models.Model):

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
    starred = models.BooleanField('是否标星', default=False)
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



# 统一的任务模型，替代原来的基于抽象类的多个任务模型
class Task(models.Model):
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
        default=TaskStatus.NOT_STARTED
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    lock_status = models.CharField(
        '锁定状态',
        max_length=20,
        choices=TaskLockStatus.choices,
        default=TaskLockStatus.UNLOCKED
    )
    
     ######TODO 待将tiptap_content改为 docx_content, 移到ProjectStage里。 
    # 添加特定任务类型的字段，用于存储文档提取任务的内容
    
    # 用于存储 招标文件提取的 tiptap JSON 内容 
    docx_tiptap = models.JSONField(
        null=True,
        blank=True,
        verbose_name='tiptap内容',
        help_text='存储tiptap内容'
    )

    # 用于存储 大模型分析的 数据输入
    data_input = models.JSONField(
        null=True,
        blank=True,
        verbose_name='数据输入',
        help_text='存储数据输入'
    )

    # 用于存储 大模型分析的 补充上下文
    additional_input = models.JSONField(
        null=True,
        blank=True,
        verbose_name='补充输入',
        help_text='存储补充输入'
    )

    # 用于存储 大模型分析的 输出格式
    output_format = models.JSONField(
        null=True,
        blank=True,
        verbose_name='输出格式',
        help_text='存储输出格式'
    )

    # 用于存储 大模型分析的 prompt 模板
    prompt_template = models.JSONField(
        null=True,
        blank=True,
        verbose_name='prompt模板',
        help_text='存储prompt模板'
    )

    # 用于存储 大模型分析的 索引路径映射
    index_path_map = models.JSONField(
        null=True,
        blank=True,
        verbose_name='索引路径映射',
        help_text='存储索引路径映射'
    )
    


    # 用于存储 大模型分析的 的模型配置
    llm_config = models.JSONField(
        null=True,
        blank=True,
        verbose_name='模型配置',
        help_text='存储模型配置'
    )

    # 用于存储 大模型分析的 结果原始数据
    result_raw = models.JSONField(
        null=True,
        blank=True,
        verbose_name='结果原始数据',
        help_text='存储结果原始数据'
    )

    # 用于存储 大模型分析的 结果的 Tiptap JSON
    result_Tiptapjson = models.JSONField(
        null=True,
        blank=True,
        verbose_name='结果Tiptap JSON',
        help_text='存储结果Tiptap JSON'
    )
    
    # 用于存储 大模型分析的 结果的 Markdown
    result_markdown = models.TextField(
        null=True,
        blank=True,
        verbose_name='结果Markdown',
        help_text='存储结果Markdown'
    )
    
    # 用于存储 大模型分析的 结果的 HTML 
    result_html = models.TextField(
        null=True,
        blank=True,
        verbose_name='结果HTML',
        help_text='存储结果HTML'
    )

    class Meta:
        verbose_name = '任务'
        verbose_name_plural = '任务'
        indexes = [
            models.Index(fields=['stage', 'type']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.get_status_display()}"

    # 在 models.py 中的 Task 类中添加以下方法
    # 在 Task 类内部添加这些方法
    def get_content_as_html(self):
        """将 tiptap_content 转换为 HTML"""
        return task_get_content_as_html(self)

    def get_content_as_markdown(self):
        """将 tiptap_content 转换为 Markdown"""
        return task_get_content_as_markdown(self)

    def set_content_from_html(self, html):
        """从 HTML 设置 tiptap_content"""
        return task_set_content_from_html(self, html)

    def set_content_from_markdown(self, markdown):
        """从 Markdown 设置 tiptap_content"""
        return task_set_content_from_markdown(self, markdown)




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
    
    # 直接关联到Task模型
    task = models.ForeignKey(
        Task,
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









