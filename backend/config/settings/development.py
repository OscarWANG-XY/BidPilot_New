from .base import *

DEBUG = True

# 存储后端设置
#DEFAULT_FILE_STORAGE = 'apps.files.storage.COSStorage'

ALLOWED_HOSTS = ['115.159.6.83', 'localhost', '127.0.0.1']

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React 开发服务器
    "http://localhost:5173",  # Vite 开发服务器
    "http://115.159.6.83:5173",  # Vite 开发服务器   主要是这行
    "http://115.159.6.83:3000",  # React 开发服务器 
]
# CORS_ALLOW_ALL_ORIGINS = True  # 仅开发阶段使用 (development.py)

# 自定义用户模型
AUTH_USER_MODEL = 'authentication.User'

# JWT 时效配置
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # 设置access token有效期为30分钟
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),    # 设置refresh token有效期为1天
    # 其他配置...
}



LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'level': 'DEBUG', 
        },
    },
    'loggers': {
        '': {  # Root logger
            'handlers': ['console'],
            'level': 'INFO',
        },
        'apps.authentication': {  # 您的应用logger
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.files': {  # 您的应用logger
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.doc_analysis': {  # 您的应用logger
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.projects': {  # 您的应用logger
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.chat': {  # 您的应用logger
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'apps._tools.docx_parser': {  # 添加docx_parser的logger配置
            'handlers': ['console'],
            'level': 'ERROR',  # 设置为INFO、DEBUG、WARNING或ERROR
            'propagate': False,
        },
        
        # 添加以下配置来隐藏中间件的日志
        'apps.projects.middlewares': {
            'handlers': ['console'],
            'level': 'WARNING',  # 将级别提高到WARNING，这样INFO级别的日志就不会显示
            'propagate': False,
        },
        'apps.projects.signals': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps._tools.LLM_services': {
            'handlers': ['console'],
            'level': 'DEBUG',  # 设置为DEBUG以显示所有日志
            'propagate': False,
        },
        'apps.projects.utils.redis_manager': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}


