import uuid
from django.db import models
from django.conf import settings
from apps.clients.tiptap.utils import (
    task_get_content_as_html, task_get_content_as_markdown,
    task_set_content_from_html, task_set_content_from_markdown
)
import logging
logger = logging.getLogger(__name__)


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
    CONFIGURING = 'CONFIGURING', '配置中'
    PROCESSING = 'PROCESSING', '处理中'
    REVIEWING = 'REVIEWING', '审核中'
    COMPLETED = 'COMPLETED', '完成'
    FAILED = 'FAILED', '失败'

class TaskLockStatus(models.TextChoices):
    LOCKED = 'LOCKED', '锁定'
    UNLOCKED = 'UNLOCKED', '解锁'


# 统一的任务模型，替代原来的基于抽象类的多个任务模型
class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # Type_TaskDetail
    stage = models.ForeignKey(
        'projects.ProjectStage',
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='所属阶段'
    )
    name = models.CharField('任务名称', max_length=100)   # Type_TaskDetail
    description = models.TextField('描述', blank=True)
    type = models.CharField(
        '任务类型',
        max_length=50,
        choices=TaskType.choices,
        default=TaskType.OTHER
    )
    status = models.CharField(                          # Type_TaskDetail
        '状态',
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.NOT_STARTED
    )
    task_level = models.IntegerField(    # 强调任务层级关系，有助于前端渲染树状结构。 
        '任务层级',
        default=0
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
    


    # ---------------------------
    # 用于存储 招标文件提取的 tiptap JSON 内容 
    docx_tiptap = models.JSONField(
        null=True,
        blank=True,
        verbose_name='tiptap内容',
        help_text='存储tiptap内容'
    )

    # 用于和前端tasksApi数据结构对齐的部分：  Type_TaskDetail
    context = models.JSONField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='上下文',
        help_text='存储上下文'
    )

    context_description = models.TextField('上下文描述', blank=True)

    context_tokens = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='上下文token',
        help_text='存储上下文token'
    )


    # 用于存储 大模型分析的 指令
    instruction = models.JSONField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='指令',
        help_text='存储指令'
    )

    instruction_description = models.TextField('指令描述', blank = True)

    instruction_tokens = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='指令token',
        help_text='存储指令token'
    )


    # 用于存储 大模型分析的 补充信息    
    supplement = models.JSONField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='补充信息',
        help_text='存储补充信息'
    )

    supplement_description = models.TextField('补充描述', blank=True)

    supplement_tokens = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='补充token',
        help_text='存储补充token'
    )


    # 用于存储 大模型分析的 输出格式
    output_format = models.JSONField(
        null=True,
        blank=True,
        verbose_name='输出格式',
        help_text='存储输出格式'
    )

    output_format_description = models.TextField('输出格式描述', blank=True)

    output_format_tokens = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='输出格式token',
        help_text='存储输出格式token'
    )


    # 用于存储 大模型分析的 prompt 模板
    prompt_template = models.JSONField(
        null=True,
        blank=True,
        verbose_name='prompt模板',
        help_text='存储prompt模板'
    )

    prompt_template_description = models.TextField('prompt模板描述', blank=True)

    prompt_template_tokens = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='prompt模板token',
        help_text='存储prompt模板token'
    )



    # 用于存储 大模型分析的 索引路径映射
    index_path_map = models.JSONField(
        null=True,
        blank=True,
        verbose_name='索引路径映射',
        help_text='存储索引路径映射'
    )

    index_path_map_description = models.TextField('索引路径映射描述', blank=True)

    # 用于存储 大模型分析的 的模型配置
    llm_config = models.JSONField(
        null=True,
        blank=True,
        verbose_name='模型配置',
        help_text='存储模型配置'
    )

    llm_config_description = models.TextField('模型配置描述', blank=True)


    # 用于存储 大模型分析的 结果原始数据
    result_raw = models.JSONField(
        null=True,
        blank=True,
        verbose_name='结果原始数据',
        help_text='存储结果原始数据'
    )

    out_tokens = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='输出token',
        help_text='存储输出token'
    )
    

    # 用于存储 大模型分析的 审核过的 最终结果
    final_result = models.JSONField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='最终结果',
        help_text='存储最终结果'
    )

    final_result_description = models.TextField('最终结果描述', blank=True)



    # -----------------------------
    task_started_at = models.DateTimeField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='任务开始时间',
        help_text='存储任务开始时间'
    )

    task_completed_at = models.DateTimeField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='任务完成时间',
        help_text='存储任务完成时间'
    )

    analysis_duration = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='分析时长',
        help_text='存储分析时长'
    )

    in_tokens = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='输入token',
        help_text='存储输入token'
    )           

    out_tokens = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='输出token',
        help_text='存储输出token'
    )
    
    total_tokens = models.IntegerField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='总token',
        help_text='存储总token'
    )   

    error_message = models.TextField(             # Type_TaskDetail
        null=True,
        blank=True,
        verbose_name='错误信息',
        help_text='存储错误信息'
    )
    
    # 用于存储 任务依赖 (在signals.py初始化所有任务时，定义任务间依赖关系，而依赖的逻辑在services.py中定义can_process_task实现）
    dependencies = models.ManyToManyField('self', symmetrical=False, related_name='dependents', blank=True)



    # -----------------------------
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








