import os
from celery import Celery


# 设置默认Django设置模块
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')  # 开发环境使用 development

# 创建Celery实例
app = Celery('config')

# 使用Django的设置文件配置Celery
app.config_from_object('django.conf:settings', namespace='CELERY')

# 明确指定要搜索任务的应用列表
app.autodiscover_tasks(['apps.projects'])

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
