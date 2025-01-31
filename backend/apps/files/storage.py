# 用来更详细跟踪文件上传到COS的过程

from storages.backends.s3boto3 import S3Boto3Storage
import logging

logger = logging.getLogger(__name__)

class COSStorage(S3Boto3Storage):
    """
    自定义 COS 存储后端
    继承自 S3Boto3Storage
    """
    def __init__(self, *args, **kwargs):
        logger.info("初始化 COSStorage")

        # 打印更多信息以便调试
        logger.info(f"Storage backend initialization with args: {args}, kwargs: {kwargs}")

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





