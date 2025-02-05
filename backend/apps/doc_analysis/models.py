from django.db import models
from django.contrib.auth import get_user_model
from apps.files.models import FileRecord
from apps.projects.models import Project
from django.utils import timezone

User = get_user_model()

class DocumentAnalysis(models.Model):
    """文档分析主表"""
    class AnalysisStatus(models.TextChoices):
        PENDING = 'PENDING', '待分析'
        PROCESSING = 'PROCESSING', '分析中'
        COMPLETED = 'COMPLETED', '已完成'
        FAILED = 'FAILED', '分析失败'
        CONFIRMED = 'CONFIRMED', '已确认'

    # 关联字段， 建立多对一的关系。 ForeignKey引用的模型是“一”的一方
    # 即一个项目可以对应多个DocumentAnalysis
    project = models.ForeignKey(
        Project,    
        on_delete=models.CASCADE,
        related_name='document_analyses',
        verbose_name='关联项目'
    )
    file_record = models.ForeignKey(
        FileRecord,
        on_delete=models.CASCADE,
        related_name='document_analyses',
        verbose_name='关联文件'
    )
    
    # 基础字段
    title = models.CharField(max_length=255, verbose_name='文档标题')
    content = models.TextField(verbose_name='文档内容', null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=AnalysisStatus.choices,
        default=AnalysisStatus.PENDING,
        verbose_name='分析状态'
    )
    
    # 分析结果存储
    analysis_result = models.JSONField(null=True, blank=True, verbose_name='分析结果')
    error_message = models.TextField(null=True, blank=True, verbose_name='错误信息')
    
    # 时间记录
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    analyzed_at = models.DateTimeField(null=True, blank=True, verbose_name='分析完成时间')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    
    # 用户记录
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_analyses',
        verbose_name='创建者'
    )
    confirmed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='confirmed_analyses',
        verbose_name='确认者'
    )

    class Meta:
        verbose_name = '文档分析'
        verbose_name_plural = '文档分析'
        ordering = ['-created_at']
        # 确保每个文件在同一个项目中只能被分析一次
        unique_together = ['project', 'file_record']

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"

    def start_analysis(self):
        """开始分析文档"""
        self.status = self.AnalysisStatus.PROCESSING
        self.save()

    def complete_analysis(self, result):
        """完成分析"""
        self.status = self.AnalysisStatus.COMPLETED
        self.analysis_result = result
        self.analyzed_at = timezone.now()
        self.save()

    def fail_analysis(self, error_message):
        """分析失败"""
        self.status = self.AnalysisStatus.FAILED
        self.error_message = error_message
        self.save()

    def confirm_analysis(self, user):
        """确认分析结果"""
        self.status = self.AnalysisStatus.CONFIRMED
        self.confirmed_by = user
        self.confirmed_at = timezone.now()
        self.save()
