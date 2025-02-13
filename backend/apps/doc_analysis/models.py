from django.db import models
from apps.files.models import FileRecord
from apps.projects.models import Project
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.conf import settings
from .docx_parser.pipeline import DocxParserPipeline
import requests
import os
import tempfile
import uuid

import logging
logger = logging.getLogger(__name__)


class AnalysisError(Exception):
    """文档分析相关的自定义异常基类"""
    pass

class InvalidStatusTransition(AnalysisError):
    """状态转换错误"""
    pass

class DocumentAnalysis(models.Model):
    """
    文档分析主表
    
    用于管理文档分析的整个生命周期，包括：
    1. 文档基础信息
    2. 分析状态跟踪
    3. 分析结果存储
    4. 确认记录
    """
    
    class AnalysisStatus(models.TextChoices):
        PENDING = 'PENDING', '待分析'
        PROCESSING = 'PROCESSING', '分析中'
        COMPLETED = 'COMPLETED', '已完成'
        FAILED = 'FAILED', '分析失败'
        CONFIRMED = 'CONFIRMED', '已确认'

    # id 将使用Django默认的自增主键（以下用了显式定义）
    id = models.BigAutoField(primary_key=True)

    # 关联字段， 建立多对一的关系。 ForeignKey引用的模型是"一"的一方
    # 即一个项目可以对应多个DocumentAnalysis
    project = models.ForeignKey(
        Project,    
        on_delete=models.CASCADE,
        related_name='document_analyses',
        verbose_name='关联项目',
        db_index=True  # 添加索引
    )
    file_record = models.ForeignKey(
        FileRecord,
        on_delete=models.CASCADE,
        related_name='document_analyses',
        verbose_name='关联文件',
        db_index=True,  # 添加索引
        null=True,      # 允许为空
        blank=True     # 允许为空
    )
    
    # 基础字段
    title = models.CharField(max_length=255, verbose_name='文档标题', db_index=True)
    status = models.CharField(
        max_length=20,
        choices=AnalysisStatus.choices,
        default=AnalysisStatus.PENDING,
        verbose_name='分析状态',
        db_index=True
    )
    
    # 分析配置和结果
    analysis_questions = models.JSONField(
        null=True,
        blank=True,
        verbose_name='分析问题集',
        help_text='存储需要分析的问题集合（如 ["资质要求", "技术参数"]）'
    )
    analysis_result = models.JSONField(
        null=True, 
        blank=True, 
        verbose_name='分析结果',
        db_index=True  # 添加索引以支持JSON字段查询
    )
    # 提取的文档元素
    extracted_elements = models.JSONField(
        null=True,
        blank=True,
        verbose_name='提取的文档元素',
        help_text='存储从文档中提取的结构化元素'
    )
    
    error_message = models.TextField(null=True, blank=True, verbose_name='错误信息')
    raw_xml = models.TextField(
        null=True,
        blank=True,
        verbose_name='原始XML',
        help_text='存储从DOCX提取的原始XML内容'
    )
    
    # 性能和版本信息
    processing_time = models.DurationField(
        null=True,
        blank=True,
        verbose_name='处理耗时'
    )
    analysis_version = models.CharField(
        max_length=50,
        default='1.0.0',
        verbose_name='分析器版本'
    )
    
    # 时间记录
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间', db_index=True)
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    analyzed_at = models.DateTimeField(null=True, blank=True, verbose_name='分析完成时间')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    
    # 用户记录
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_analyses',
        verbose_name='创建者'
    )
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
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
        unique_together = ['project', 'file_record', 'title']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['project', 'status']),
        ]

    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"


    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

# ------------ 文档分析状态管理 ------------
# 封装并简化"文档分析"处理过程中的状态更新和时间戳记录， 需要显式调用
#  start_analysis(): PENDING -> PROCESSING
#  complete_analysis(): PROCESSING -> COMPLETED
#  fail_analysis(): PENDING/PROCESSING -> FAILED
#  confirm_analysis(): COMPLETED -> CONFIRMED


    def start_analysis(self):
        """开始分析文档"""
        if self.status != self.AnalysisStatus.PENDING:
            raise InvalidStatusTransition("只有待分析状态的文档才能开始分析")
        self.status = self.AnalysisStatus.PROCESSING
        self.save()

    def complete_analysis(self, result, processing_time=None):
        """
        完成分析
        
        Args:
            result: 分析结果
            processing_time: 处理耗时（可选）
        """
        if self.status != self.AnalysisStatus.PROCESSING:
            raise InvalidStatusTransition("只有分析中状态的文档才能标记为完成")
        
        self.status = self.AnalysisStatus.COMPLETED
        self.analysis_result = result
        self.analyzed_at = timezone.now()
        if processing_time:
            self.processing_time = processing_time
        self.save()

    def fail_analysis(self, error_message):
        """分析失败"""
        if self.status not in [self.AnalysisStatus.PENDING, self.AnalysisStatus.PROCESSING]:
            raise InvalidStatusTransition("只有待分析或分析中状态的文档才能标记为失败")
        
        self.status = self.AnalysisStatus.FAILED
        self.error_message = error_message
        self.save()

    def confirm_analysis(self, user, confirmed_results):
        """
        确认分析结果
        
        Args:
            user: 确认用户
            confirmed_results: 确认后的结果列表
        """
        if self.status != self.AnalysisStatus.COMPLETED:
            raise InvalidStatusTransition("只有已完成状态的文档才能被确认")
        
        self.status = self.AnalysisStatus.CONFIRMED
        self.confirmed_by = user
        self.confirmed_at = timezone.now()
        
        # 更新分析结果，添加确认信息
        for result in self.analysis_result:
            for confirmed in confirmed_results:
                if result['question'] == confirmed['question']:
                    result['confirmed_answer'] = confirmed['answer']
                    result['confirmation'] = {
                        'user_phone': user.phone,
                        'timestamp': timezone.now().isoformat(),
                        'comment': confirmed.get('comment')
                    }

        
        self.save()

    def can_transition_to(self, target_status):
        """检查是否可以转换到目标状态"""
        valid_transitions = {
            self.AnalysisStatus.PENDING: [self.AnalysisStatus.PROCESSING],
            self.AnalysisStatus.PROCESSING: [self.AnalysisStatus.COMPLETED, self.AnalysisStatus.FAILED],
            self.AnalysisStatus.COMPLETED: [self.AnalysisStatus.CONFIRMED],
            self.AnalysisStatus.FAILED: [self.AnalysisStatus.PENDING],
            self.AnalysisStatus.CONFIRMED: []
        }
        return target_status in valid_transitions.get(self.status, [])


    def update_file_record(self, file_record):
        """
        更新关联的文件记录、并提取文档内容
        
        Args:
            file_record: FileRecord 实例
        """
        #logger.info(f"开始更新文件记录: analysis_id={self.id}, file_record_id={file_record.id if file_record else 'None'}")
        
        if not file_record:
            logger.error(f"传入的file_record为空: analysis_id={self.id}")
            raise ValidationError("文件记录不能为空")
        
        if self.file_record:
            logger.warning(f"文件记录已存在: analysis_id={self.id}, existing_file_id={self.file_record.id}")
            raise ValidationError("文件记录已存在，不能重复设置")
        
        # 验证文件格式
        #logger.info(f"验证文件格式: analysis_id={self.id}, filename={file_record.name}")
        if not file_record.name.lower().endswith('.docx'):
            logger.error(f"不支持的文件格式: analysis_id={self.id}, filename={file_record.name}")
            raise ValidationError("目前仅支持DOCX格式文件")
        
        # 保存前记录状态
        #logger.info(f"保存前状态: analysis_id={self.id}, file_record_id=None")
        
        self.file_record = file_record
        self.save()
        
        # 保存后确认状态
        #logger.info(f"保存后状态: analysis_id={self.id}, file_record_id={self.file_record.id if self.file_record else 'None'}")
        
        # 提取文档内容
        #logger.info(f"开始提取文档内容: analysis_id={self.id}, file_record_id={file_record.id}")
        #self.extract_document_content()
        
        #logger.info(f"文件记录更新完成: analysis_id={self.id}, file_record_id={self.file_record.id}")

    def clean(self):
        """模型验证"""
        # 移除了文件与项目关联的验证
        pass
