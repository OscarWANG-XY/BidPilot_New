from celery import current_task
from app.core.celery_app import celery_app
import time
import random


@celery_app.task(bind=True)
def simple_task(self, message: str = "Hello from Celery!"):
    """简单的测试任务，用于验证Celery基本功能"""
    try:
        print(f"📝 执行测试任务: {message}")
        return {
            "status": "success",
            "message": message,
            "task_id": self.request.id
        }
    except Exception as e:
        print(f"❌ 任务执行失败: {e}")
        raise


@celery_app.task(bind=True)
def math_task(self, x: int, y: int):
    """数学计算测试任务"""
    try:
        result = x + y
        print(f"🧮 计算 {x} + {y} = {result}")
        return {
            "status": "success", 
            "input": {"x": x, "y": y},
            "result": result,
            "task_id": self.request.id
        }
    except Exception as e:
        print(f"❌ 数学任务执行失败: {e}")
        raise


@celery_app.task(bind=True)
def slow_task(self, duration: int = 2):
    """模拟耗时任务"""
    try:
        print(f"⏳ 开始执行耗时任务，持续 {duration} 秒")
        for i in range(duration):
            time.sleep(1)
            # 更新任务进度
            self.update_state(
                state='PROGRESS',
                meta={'current': i + 1, 'total': duration}
            )
            print(f"⏳ 进度: {i + 1}/{duration}")
        
        print(f"✅ 耗时任务完成")
        return {
            "status": "success",
            "duration": duration,
            "task_id": self.request.id
        }
    except Exception as e:
        print(f"❌ 耗时任务执行失败: {e}")
        raise


@celery_app.task(bind=True)
def error_task(self, should_fail: bool = True):
    """测试错误处理的任务"""
    if should_fail:
        raise ValueError("这是一个测试错误")
    
    return {
        "status": "success",
        "message": "任务正常完成",
        "task_id": self.request.id
    }


@celery_app.task
def periodic_health_check():
    """定期健康检查任务"""
    try:
        # 简单的健康检查逻辑
        timestamp = time.time()
        health_status = {
            "status": "healthy",
            "timestamp": timestamp,
            "random_value": random.randint(1, 100)
        }
        print(f"💓 健康检查完成: {health_status}")
        return health_status
    except Exception as e:
        print(f"❌ 健康检查失败: {e}")
        raise


# 用于测试的辅助函数
def get_task_result(task_result):
    """获取任务结果的辅助函数"""
    if task_result.ready():
        if task_result.successful():
            return task_result.result
        else:
            return {"status": "error", "error": str(task_result.info)}
    else:
        return {"status": "pending", "task_id": task_result.id}
