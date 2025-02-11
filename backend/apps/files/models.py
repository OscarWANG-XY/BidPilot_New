from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.files.storage import default_storage
from django.utils import timezone
from django.conf import settings
import boto3
from botocore.config import Config
import logging
import magic
from apps.projects.models import Project

# 定义基础模型，提供公共字段
class BaseModel(models.Model):
    # id 将使用Django默认的自增主键（以下用了显式定义）
    id = models.BigAutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)  # 记录创建时间
    created_by = models.CharField(max_length=100)  # 记录创建者
    updated_at = models.DateTimeField(null=True, blank=True)  # 记录更新时间，可为空
    updated_by = models.CharField(max_length=100, null=True, blank=True)  # 记录更新者，可为空
    version = models.IntegerField(default=1)  # 记录版本号，默认为 1

    class Meta:
        abstract = True  # 定义为抽象模型，不能直接创建实例

# 定义文件记录模型， 注意FileRecord继承了BaseModel
class FileRecord(BaseModel):
    # 文件类型选项
    FILE_TYPE_CHOICES = [
        ('PDF', 'PDF'),
        ('WORD', 'WORD'),
        ('EXCEL', 'EXCEL'),
        ('IMAGE', 'IMAGE'),
        ('OTHER', 'OTHER'),
    ]

    # 处理状态选项
    PROCESSING_STATUS_CHOICES = [
        ('NONE', 'None'),
        ('UPLOADING', 'Uploading'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    name = models.CharField(max_length=255)  # 文件名称
    file = models.FileField(upload_to='uploads/%Y/%m/%d/', storage=default_storage, null=True, blank=True)
    size = models.BigIntegerField()  # 文件大小（字节）
    type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)  # 文件类型
    mime_type = models.CharField(max_length=100, null=True, blank=True)  # MIME 类型，可为空
    
    processing_status = models.CharField(
        max_length=20, 
        choices=PROCESSING_STATUS_CHOICES,
        default='NONE'  # 处理状态，默认为未处理
    )
    processing_progress = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]  # 进度百分比，范围 0-100
    )
    error_message = models.TextField(null=True, blank=True)  # 处理错误信息，可为空
    
    # 文件所有者
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,  # 级联删除时删除相关文件
        related_name='owned_files'
    )
    
    metadata = models.JSONField(null=True, blank=True)  # 存储文件元数据，可为空
    remarks = models.TextField(null=True, blank=True)  # 备注信息，可为空

    class Meta:
        db_table = 'file_records'  # 指定数据库表名

    # 获取文件的直接访问URL, 因为有@property，所以file_record.url 就和 file_record.url() 效果一样。
    @property
    def url(self):
        """
        获取文件的直接访问URL
        """
        if not self.file:
            return None
            
        # 确保使用完整的存储路径
        return f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{self.file.name}"

    # 预定签名URL 用于文件在限定时间内读取。 
    def get_presigned_url(self, expires=3600):
        """
        获取文件的预签名下载URL
        :param expires: URL的有效期（秒），默认1小时
        :return: 预签名的URL
        """
        # 检查文件是否存在，如果不存在直接跳出函数。
        if not self.file:   
            logging.warning(f"文件不存在: id={self.id}, name={self.name}")
            return None
        
        logging.info(f"开始生成预签名URL: id={self.id}, name={self.name}, file_path={self.file.name}")
        
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
            
            params = {
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': self.file.name,
                'ResponseContentDisposition': f'inline; filename="{self.name}"',
                'ResponseContentType': self.mime_type or 'application/octet-stream'
            }
            
            logging.debug(f"生成预签名URL参数: {params}")
            
            url = s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expires
            )
            
            logging.info(f"预签名URL生成成功: id={self.id}, url={url}")
            return url
        
        except Exception as e:
            logging.error(f"生成预签名URL失败: id={self.id}, error={str(e)}")
            return None
        
    # 删除文件 
    def delete(self, *args, **kwargs):
        """
        重写删除方法，在删除数据库记录的同时删除S3中的文件
        """
        if self.file:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                config=Config(
                    s3={'addressing_style': 'path'},  # 与 get_presigned_url 保持一致
                    signature_version='s3v4'  # 使用相同的签名版本
                )
            )

            try:
                # 使用完整的存储路径删除文件
                s3_client.delete_object(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Key=self.file.name
                )
                
                # 等待删除操作完成
                waiter = s3_client.get_waiter('object_not_exists')
                waiter.wait(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Key=self.file.name,
                    WaiterConfig={'Delay': 2, 'MaxAttempts': 3}  # 最多等待3次，每次间隔2秒
                )
            except Exception as e:
                print(f"Error deleting file from S3: {e}")

        super().delete(*args, **kwargs)


    # Generate upload URL 主要用于大文件直接前端上传COS，不经过服务器。该方法暂时用不到。
    @staticmethod
    def generate_upload_url(filename, content_type=None, expires=3600):
        """
        该方法用于前端直接上传到COS，不经过服务器，用户大文件，在BidPilot中应该用不到，先放着吧。
        生成用于直接上传到COS的预签名URL
        :param filename: 要上传的文件名
        :param content_type: 文件的MIME类型
        :param expires: URL的有效期（秒），默认1小时
        :return: 预签名的上传URL和对象键
        """
        # 创建S3客户端，保持与 get_presigned_url 相同的配置
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            config=Config(
                s3={'addressing_style': 'path'},  # 使用 path 风格的 URL
                signature_version='s3v4'  # 使用AWS S3最新的签名版本
            )
        )

        # 生成对象键，保持与 upload_to 一致的路径结构
        now = timezone.now()
        object_key = f'uploads/{now.year}/{now.month:02d}/{now.day:02d}/{filename}'



        try:
            # 准备上传参数
            params = {
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': object_key,
                'ContentType': content_type or 'application/octet-stream',
                'ContentDisposition': f'inline; filename="{filename}"'
            }

            # 生成预签名上传URL
            url = s3_client.generate_presigned_url(
                'put_object',
                Params=params,
                ExpiresIn=expires
            )
            
            return {
                'url': url,
                'object_key': object_key
            }
        except Exception as e:
            print(f"Error generating upload URL: {e}")
            return None


# 自动检测文件类型, 为了检查加载问题添加的。 
    def save(self, *args, **kwargs):
        if not self.mime_type and self.file:
            try:
                # Windows 上使用 python-magic-bin, Linux 上使用 python-magic
                mime = magic.Magic(mime=True)
                self.mime_type = mime.from_buffer(self.file.read(1024))
                self.file.seek(0)  # 重置文件指针
                logging.info(f"自动检测文件类型: id={self.id}, name={self.name}, mime_type={self.mime_type}")
            except Exception as e:
                logging.error(f"检测文件类型失败: {str(e)}")
                self.mime_type = 'application/octet-stream'  # 设置默认类型
        
        super().save(*args, **kwargs)


        