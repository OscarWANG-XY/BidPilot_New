from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# 数据库配置
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',  # 数据库引擎
        'NAME': 'bidpilot_new',  # 数据库名称
        'USER': 'postgres',  # 数据库用户
        'PASSWORD': '123456',  # 数据库密码\
        'HOST': 'localhost',  # 数据库主机
        'PORT': '5432',  # 数据库端口
        'OPTIONS': {
            'client_encoding': 'UTF8',  # 确保客户端编码为 UTF-8
        },
    }
}

# 自定义用户模型
AUTH_USER_MODEL = 'authentication.User'

# 调试输出
print("Development settings loaded")
print("INSTALLED_APPS:", INSTALLED_APPS)