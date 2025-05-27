# app/core/celery_app.py
from celery import Celery
from app.core.config import settings

# 创建Celery实例 - 使用唯一的应用名称避免与Django Celery冲突
celery_app = Celery(
    "bidlyzer-fastapi-service",  # 唯一的应用名称
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.test_tasks",  # 包含任务模块
        "app.tasks.structuring_tasks",  # 新增：文档结构化任务
    ]
)

# Celery配置
celery_app.conf.update(
    # 任务序列化
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Shanghai',
    enable_utc=True,
    
    # 使用唯一的worker名称前缀避免冲突
    worker_main='bidlyzer-fastapi',
    
    # 任务路由配置 - 使用独特的队列名称
    task_routes={
        'app.tasks.example_tasks.*': {'queue': 'fastapi_default'},
        'app.tasks.bid_analysis_tasks.*': {'queue': 'fastapi_analysis'},
        'app.tasks.test_tasks.*': {'queue': 'fastapi_test'},
        'app.tasks.structuring_tasks.*': {'queue': 'fastapi_structuring'},  # 新增：结构化任务队列
        'structuring.*': {'queue': 'fastapi_structuring'},  # 新增：按任务名称路由
    },
    
    # 任务结果过期时间（秒）
    result_expires=3600,
    
    # 任务执行配置
    task_always_eager=False,  # 设为True时任务会同步执行（用于测试）
    worker_prefetch_multiplier=1,  # 每个worker预取的任务数
    task_acks_late=True,  # 任务完成后再确认
    worker_disable_rate_limits=False,
    
    # 任务重试配置
    task_reject_on_worker_lost=True,
    
    # Beat调度器配置（如果使用定时任务）
    beat_schedule={
        'periodic-health-check-fastapi': {  # 唯一的任务名称
            'task': 'app.tasks.test_tasks.periodic_health_check',
            'schedule': 30.0,  # 每30秒执行一次
        },
    },
)

# 任务装饰器的默认配置
celery_app.conf.task_default_retry_delay = 60  # 重试间隔60秒
celery_app.conf.task_max_retries = 3  # 最大重试次数

# 强制导入任务模块以确保任务被注册
# 这是解决 include 配置有时不生效的问题
try:
    import app.tasks.test_tasks
    print(f"✅ 成功导入测试任务模块，已注册 {len(celery_app.tasks)} 个任务")
except ImportError as e:
    print(f"❌ 导入测试任务模块失败: {e}")

# 用于调试的任务注册检查函数
def list_registered_tasks():
    """列出所有已注册的任务"""
    print("已注册的任务:")
    for task_name in sorted(celery_app.tasks.keys()):
        if not task_name.startswith('celery.'):
            print(f"  - {task_name}")

if __name__ == "__main__":
    list_registered_tasks() 