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

# 调试输出
print("Development settings loaded")
print("INSTALLED_APPS:", INSTALLED_APPS)



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
            'level': 'ERROR',
            'propagate': False,
        },
        'apps.projects': {  # 您的应用logger
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'apps.chat': {  # 您的应用logger
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}


# Celery Configuration for Development (using PostgreSQL)
CELERY_BROKER_URL = 'sqla+postgresql://postgres:123456@localhost:5432/bidpilot_new'  # 使用数据库作为消息代理
CELERY_RESULT_BACKEND = 'django-db'  # 使用数据库存储结果
CELERY_CACHE_BACKEND = 'django-cache'


# 开发时使用同步执行， 等功能稳定后，切换到异步。 
#CELERY_TASK_ALWAYS_EAGER = True
#CELERY_TASK_EAGER_PROPAGATES = True