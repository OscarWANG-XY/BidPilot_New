# 用来更详细跟踪文件上传到COS的过程

from storages.backends.s3boto3 import S3Boto3Storage
from django.core.files.storage import default_storage
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class COSStorage(S3Boto3Storage):
    """
    自定义 COS 存储后端
    继承自 S3Boto3Storage
    """
    def __init__(self, *args, **kwargs):
        #logger.info("初始化 COSStorage")

        # 打印更多信息以便调试
        #logger.info(f"Storage backend initialization with args: {args}, kwargs: {kwargs}")

        super().__init__(*args, **kwargs)

    def _save(self, name, content):
        """重写保存方法，添加日志"""
        logger.info(f"开始上传文件到 COS: {name}")
        try:
            result = super()._save(name, content)
            logger.info(f"文件上传到 COS 完成: {name}")
            return result
        except Exception as e:
            logger.error(f"文件上传到 COS 失败: {name}, 错误: {str(e)}")
            raise

    def url(self, name):
        """重写 url 方法，添加日志"""
        url = super().url(name)
        logger.debug(f"生成文件 URL: {url}")
        return url 

def initialize_storage():
    """
    强制初始化 COS 存储
    在应用启动时调用此函数
    """
    try:
        # 根据配置选择存储后端
        if settings.DEFAULT_FILE_STORAGE == "storages.backends.s3boto3.S3Boto3Storage":
            #logger.info("使用 S3Boto3Storage 初始化存储")
            storage = S3Boto3Storage()
            default_storage._wrapped = storage
            #logger.info("✅ 成功初始化 S3Boto3Storage")
            logger.info(f"default_storage 的类型: {default_storage.__class__.__name__}")
        elif settings.DEFAULT_FILE_STORAGE == "apps.files.storage.COSStorage":
            #logger.info("使用 COSStorage 初始化存储")
            storage = COSStorage()
            default_storage._wrapped = storage
            #logger.info("✅ 成功初始化 COSStorage")
            logger.info(f"default_storage 的类型: {default_storage.__class__.__name__}")
        else:
            logger.warning(f"未知的存储后端: {settings.DEFAULT_FILE_STORAGE}")
            return False
        return True
    except Exception as e:
        logger.error(f"❌ 初始化存储失败: {str(e)}")
        return False





