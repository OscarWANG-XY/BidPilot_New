import os
import sys
import django
from pathlib import Path
import logging


#=================auth_tests.ipynb测试是引入的setup项========================= 

# 允许在异步环境（如 Jupyter Notebook）中使用 Django ORM
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

# 计算项目根目录并添加到 Python 路径，确保可以正确导入 Django 代码
PROJECT_ROOT = str(Path(__file__).resolve().parents[3])
sys.path.append(PROJECT_ROOT)

# 指定 Django 配置文件，确保正确加载项目设置
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')



# 初始化 Django，加载应用、数据库等配置信息
django.setup()

# 在 django.setup() 之后添加这些行
from django.conf import settings
settings.ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

# 清理所有已有的日志处理器，避免 Jupyter Notebook 中日志重复输出
logging.root.handlers = []

# 配置全局日志，确保输出格式统一
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# 重新配置应用日志（示例：apps.authentication），确保日志正常输出
app_logger = logging.getLogger('apps.authentication')
app_logger.setLevel(logging.INFO)
app_logger.handlers = []  # 清除旧的 handlers，避免日志重复
app_logger.addHandler(logging.StreamHandler(sys.stdout))  # 绑定新的日志输出
app_logger.propagate = False  # 禁止日志向上层传播，防止重复打印



#=================files_tests.ipynb测试是添加的setup项========================= 

# 加载 Django 设置和存储系统
from django.conf import settings
from django.core.files.storage import default_storage
#from storages.backends.s3boto3 import S3Boto3Storage

# 如果存储使用 S3（如腾讯云 COS），则强制初始化 S3 存储，避免懒加载问题
#if settings.DEFAULT_FILE_STORAGE == "storages.backends.s3boto3.S3Boto3Storage":
#    try:
#        storage = S3Boto3Storage()
#        default_storage._wrapped = storage  # 替换默认存储
#        print("Successfully initialized S3Boto3Storage")
#   except Exception as e:
#        print(f"Failed to initialize S3Boto3Storage: {e}")



# =============== setup关键结果打印 便于检查调试 =========================  

# 打印关键配置信息，便于调试
print(f"Settings从哪里加载？: {os.environ['DJANGO_SETTINGS_MODULE']}")
print(f"项目根目录对么？: {PROJECT_ROOT}")
print(f"文件存储settings对么？: {settings.DEFAULT_FILE_STORAGE}")
print(f"文件default_storage对么？: {default_storage.__class__.__name__}")
print("\n已经安装的应用 Installed Apps 完整了么？:")
for app in settings.INSTALLED_APPS:
    print(f"- {app}")