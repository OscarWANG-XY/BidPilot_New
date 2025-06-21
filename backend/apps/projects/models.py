import uuid
from django.db import models
from django.conf import settings
from django.core.files.storage import default_storage
import boto3
from botocore.config import Config
import logging
import os

logger = logging.getLogger(__name__)


class ProjectType(models.TextChoices):
    WELFARE = 'WELFARE', '企业福利'  # 值为'WELFARE', 显示为'企业福利' 
    FSD = 'FSD', '食材配送'
    OTHER = 'OTHER', '其他'

class ProjectStatus(models.TextChoices):
    IN_PROGRESS = 'IN_PROGRESS', '进行中'
    COMPLETED = 'COMPLETED', '已完成'
    CANCELLED = 'CANCELLED', '已取消'


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
    status = models.CharField(
        '项目状态',
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.IN_PROGRESS
    )
    starred = models.BooleanField('是否标星', default=False)
    tender_file = models.FileField(upload_to='uploads/%Y/%m/%d/', storage=default_storage, null=True, blank=True)
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
    

    # 预定签名URL 用于文件在限定时间内读取
    def get_tender_file_presigned_url(self, expires=3600):
        """
        获取招标文件的预签名下载URL
        :param expires: URL的有效期（秒），默认1小时
        :return: 预签名的URL
        """
        # 检查文件是否存在，如果不存在直接跳出函数
        if not self.tender_file:   
            logger.warning(f"招标文件不存在: project_id={self.id}, project_name={self.project_name}")
            return None
        
        logger.info(f"Projects.models.get_tender_file_presigned_url:开始生成预签名URL: project_id={self.id}, file_path={self.tender_file.name[0:30]}...")
        
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                config=Config(
                    s3={'addressing_style': 'path'},
                    signature_version='s3v4'
                )
            )
            
            # 从文件路径中提取文件名
            filename = os.path.basename(self.tender_file.name)
            
            params = {
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': self.tender_file.name,
                'ResponseContentDisposition': f'inline; filename="{filename}"',
                'ResponseContentType': 'application/octet-stream'
            }
            
            logger.debug(f"Projects.models.get_tender_file_presigned_url: 生成预签名URL参数: {params}")
            
            url = s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expires
            )
            
            logger.info(f"Projects.models.get_tender_file_presigned_url:预签名URL生成成功: project_id={self.id}")
            return url
        
        except Exception as e:
            logger.error(f"生成招标文件预签名URL失败: project_id={self.id}, error={str(e)}")
            return None

    def delete_tender_file(self):
        """
        删除招标文件
        """
        if not self.tender_file:
            return True
            
        try:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                config=Config(
                    s3={'addressing_style': 'path'},
                    signature_version='s3v4'
                )
            )
            
            # 删除S3中的文件
            s3_client.delete_object(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=self.tender_file.name
            )
            
            # 清空数据库中的文件字段
            self.tender_file = None
            self.save(update_fields=['tender_file'])
            
            logger.info(f"招标文件删除成功: project_id={self.id}")
            return True
            
        except Exception as e:
            logger.error(f"删除招标文件失败: project_id={self.id}, error={str(e)}")
            return False
        
    