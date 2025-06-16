# app/core/celery_app.py
from celery import Celery
from app.core.config import settings
from kombu import Queue

# 创建Celery实例 - 使用唯一的应用名称避免与Django Celery冲突
celery_app = Celery(
    "bidlyzer-fastapi-service",  # 唯一的应用名称
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    # include=[
    #     "app.tasks.structuring_tasks",  # 原有的结构化任务模块
    #     "app.tasks.tasks",  # 新增：tasks模块 - 包含analysis_with_lock等任务
    # ]
)

# Celery配置
celery_app.conf.update(
    # 任务序列化
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Shanghai',
    enable_utc=True,

    # 任务路由配置 - 使用独特的队列名称
    task_routes={
        # 'app.tasks.test_tasks.test_task': {'queue': 'default'},  # 默认队列
        # 'app.tasks.test_tasks.test_task_with_lock': {'queue': 'default'},  # 默认队列
        # 'app.tasks.test_tasks.send_email_task': {'queue': 'email'},  # 邮件队列
        # 'app.tasks.test_tasks.send_email_task_with_lock': {'queue': 'email'},  # 邮件队列
        # 'app.tasks.test_tasks.image_process_task': {'queue': 'high_priority'},  # 高优先级队列
        # 'app.tasks.test_tasks.test_redis_connection': {'queue': 'default'},  # 默认队列
        # 'app.tasks.test_tasks.test_lock_mechanism': {'queue': 'default'},  # 默认队列
        # 'app.tasks.test_tasks.clear_test_locks': {'queue': 'default'},  # 默认队列
        # 'app.tasks.test_tasks.check_lock_status': {'queue': 'default'},  # 默认队列
        'app.tasks.agent_tasks.run_structuring': {'queue': 'default'},  # 默认队列
    },
    

    # 根据不同的queue启动worker， 执行时，任务会出现在特定的队列的worker中，需要注意的是，路由注册的名字一定要正确，否则会出现在default队列中
    # celery -A app.core.celery_app worker --loglevel=info --queues=email  #该worker只处理邮件队列
    # celery -A app.core.celery_app worker --loglevel=info --queues=high_priority  #该worker只处理高优先级队列
    # celery -A app.core.celery_app worker --loglevel=info --queues=default,email,high_priority  #该worker处理所有队列

    task_default_queue='default',
    task_queues={
        Queue('default'),
        Queue('email'),
        Queue('high_priority'),
    },


    # # 使用唯一的worker名称前缀避免冲突
    # worker_main='bidlyzer-fastapi',
    

    
    # # 任务软超时： 1小时
    # task_soft_time_limit=3600,

    # # 任务硬超时： 2小时； 比如一个任务等待用户确认，但用户两个小时都没有确认，那么会被强制终止，状态变为failure，这个时候能计入到最大任务数里。 
    # task_time_limit=7200,

    # # 任务最大重试次数
    # task_max_retries=3,
    # task_default_retry_delay = 60,  # 重试间隔60秒

    # # Worker 最大内存限制， 达到后不会中断正在执行的任务，但该worker不再接收新任务， 主线程创建新worker替代。
    # # 不同用户直接的占用是累加的。
    # worker_max_memory_per_child=500000,  # 500MB

    # # 任务最大任务数后重启 (成功和失败的任务都会被计入，但已经开始的，但未结束的不算在里面)
    # worker_max_tasks_per_child=100,


    # # 任务执行配置
    # task_always_eager=False,  # 设为True时任务会同步执行（用于测试， 它会让测试的task立即执行，而不是等待，用于比如单元测试等场景。）

    # # 任务结果过期时间（秒）： 保留时间： 1小时
    # result_expires=3600,
    
    # #任务提前预取，而不是等执行完再取下一个， 这样可以减少通信，提高效率。 

    # worker_prefetch_multiplier=4,  # 每个worker预取的任务数
    
    # #适合关键业务，比如支付处理，数据同步，重要通知等。 
    # task_acks_late=True,  # 任务完成后再确认


    # worker_disable_rate_limits=False,
    
    # # 任务重试配置
    # task_reject_on_worker_lost=True,
    
    # # Beat调度器配置（如果使用定时任务）
    # beat_schedule={
    #     'periodic-health-check-fastapi': {  # 唯一的任务名称
    #         'task': 'app.tasks.test_tasks.periodic_health_check',
    #         'schedule': 30.0,  # 每30秒执行一次
    #     },
    # },
)



# 强制导入任务模块以确保任务被注册
# 这是解决 include 配置有时不生效的问题
try:
    # import app.tasks.structuring_tasks
    # import app.tasks.test_tasks  # 新增：导入tasks模块
    import app.tasks.agent_tasks  # 新增：导入tasks模块
    print(f"✅ 成功导入所有任务模块，已注册 {len(celery_app.tasks)} 个任务")
except ImportError as e:
    print(f"❌ 导入任务模块失败: {e}")

# 用于调试的任务注册检查函数
def list_registered_tasks():
    """列出所有已注册的任务"""
    print("已注册的任务:")
    for task_name in sorted(celery_app.tasks.keys()):
        if not task_name.startswith('celery.'):
            print(f"  - {task_name}")

if __name__ == "__main__":
    list_registered_tasks() 