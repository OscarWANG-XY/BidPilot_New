from .base import *

DEBUG = False
ALLOWED_HOSTS = ['115.159.6.83']  # 生产环境只允许特定host

# 生产环境的CORS配置
CORS_ALLOWED_ORIGINS = [
    "http://115.159.6.83:5173", # Vite 开发服务器
]