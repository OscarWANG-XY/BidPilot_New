import os
import sys
import django
from pathlib import Path
import logging


# 允许在异步环境中进行同步操作
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

# 将项目根目录添加到 Python 路径
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)

sys.path.append(PROJECT_ROOT)

# 设置 Django 设置模块
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# 初始化 Django
django.setup() 

from django.conf import settings
print(f"Using settings from: {os.environ['DJANGO_SETTINGS_MODULE']}")
print(f"Project root: {PROJECT_ROOT}")
print("\nInstalled Apps:")
for app in settings.INSTALLED_APPS:
    print(f"- {app}")


# 清理所有现有的 handlers
logging.root.handlers = []

# 配置根 logger
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# 获取应用 logger 并配置
app_logger = logging.getLogger('apps.authentication')
app_logger.setLevel(logging.INFO)  # 确保设置了正确的日志级别
app_logger.handlers = []  # 清理现有的 handlers
app_logger.addHandler(logging.StreamHandler(sys.stdout))  # 添加新的 handler
app_logger.propagate = False  # 防止日志传播