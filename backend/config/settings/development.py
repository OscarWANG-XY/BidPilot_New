from .base import *

DEBUG = True
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
    },
}