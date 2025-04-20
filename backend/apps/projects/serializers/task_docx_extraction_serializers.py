from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from ..models import Task, TaskType, TaskLockStatus
from .history_serializers import ChangeTrackingModelSerializer
import logging

logger = logging.getLogger(__name__)


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
    
    def update(self, instance, validated_data):
        task = super().update(instance, validated_data)
        
        # 如果任务完成，将docx_tiptap存储到project.tender_file_extraction
        if task.status == 'COMPLETED':  # 使用TaskStatus.COMPLETED的值
            try:
                # 通过stage获取project
                project = task.stage.project
                if project.tender_file_extraction is None and task.docx_tiptap:
                    project.tender_file_extraction = task.docx_tiptap
                    project.save(update_fields=['tender_file_extraction'])
                    logger.info(f"已将任务ID:{task.id}的docx_tiptap存储到项目ID:{project.id}的tender_file_extraction")
            except Exception as e:
                logger.error(f"存储docx_tiptap到project.tender_file_extraction失败: {str(e)}")
        
        return task

class DocxExtractionStartSerializer(ChangeTrackingModelSerializer):
    """文档提取任务更新专用序列化器"""

    class Meta:
        model = Task
        fields = [
            #'id', 'name', 'type',
            'status', 
            'lock_status',
            #'docx_tiptap',
        ]
    
    def validate(self, data):
        if self.instance.type != TaskType.DOCX_EXTRACTION_TASK:
            raise ValidationError(f"此序列化器只能用于 文档提取任务 的更新")
        if self.instance.lock_status != TaskLockStatus.UNLOCKED:
            raise ValidationError(f"文档提取任务未解锁，无法启动")
        return super().validate(data)

