from .base import *

DEBUG = False

# 存储后端设置
#DEFAULT_FILE_STORAGE = 'apps.files.storage.COSStorage'

ALLOWED_HOSTS = ['115.159.6.83']  # 生产环境只允许特定host

# 生产环境的CORS配置
CORS_ALLOWED_ORIGINS = [
    "http://115.159.6.83:5173", # Vite 开发服务器
]


# Celery Configuration for Production (using Redis)
# Celery Production Configuration (using Redis)
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'