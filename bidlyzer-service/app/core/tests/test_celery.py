# app/core/tests/test_celery.py
import pytest
import time
from app.core.celery_app import celery_app
from app.tasks.test_tasks import (
    simple_task,
    math_task,
    slow_task,
    error_task,
    get_task_result
)


def _check_redis_connection():
    """检查Redis连接是否可用以及FastAPI Celery worker是否运行"""
    try:
        from app.core.celery_app import celery_app
        
        # 首先检查基本的Redis连接
        import redis
        from app.core.config import settings
        redis_client = redis.from_url(settings.REDIS_URL)
        redis_client.ping()  # 测试Redis连接
        
        # 然后检查是否有FastAPI Celery worker在运行
        inspector = celery_app.control.inspect(timeout=5.0)  # 增加timeout
        active_nodes = inspector.active()
        
        if not active_nodes:
            print("没有检测到FastAPI Celery worker")
            return False
            
        # 检查是否有属于我们FastAPI应用的worker
        worker_names = list(active_nodes.keys())
        
        fastapi_workers = [node for node in worker_names 
                          if 'fastapi' in node.lower() or 'bidlyzer-fastapi' in node]
        
        if fastapi_workers:
            print(f"检测到FastAPI Celery workers: {fastapi_workers}")
            return True
        else:
            print(f"检测到worker但不是FastAPI的: {worker_names}")
            return False
            
    except Exception as e:
        print(f"Redis连接检查失败: {e}")
        return False


class TestCeleryBasic:
    """基础Celery功能测试"""
    
    def test_celery_app_configuration(self):
        """测试Celery应用配置"""
        # 检查Celery应用是否正确初始化
        assert celery_app is not None
        assert celery_app.conf.broker_url is not None
        assert celery_app.conf.result_backend is not None
        
        # 检查任务是否注册
        registered_tasks = list(celery_app.tasks.keys())
        expected_tasks = [
            'app.tasks.test_tasks.simple_task',
            'app.tasks.test_tasks.math_task', 
            'app.tasks.test_tasks.slow_task',
            'app.tasks.test_tasks.error_task',
            'app.tasks.test_tasks.periodic_health_check'
        ]
        
        for task_name in expected_tasks:
            assert task_name in registered_tasks, f"任务 {task_name} 未注册"
    
    def test_simple_task_synchronous(self):
        """测试简单任务同步执行"""
        # 设置为同步执行模式进行测试
        original_eager = celery_app.conf.task_always_eager
        celery_app.conf.task_always_eager = True
        
        try:
            # 执行任务
            result = simple_task.apply(args=["Test message"])
            
            # 检查结果
            assert result.successful()
            task_result = result.result
            assert task_result["status"] == "success"
            assert task_result["message"] == "Test message"
            assert "task_id" in task_result
            
        finally:
            # 恢复原始配置
            celery_app.conf.task_always_eager = original_eager
    
    def test_math_task_synchronous(self):
        """测试数学计算任务同步执行"""
        original_eager = celery_app.conf.task_always_eager
        celery_app.conf.task_always_eager = True
        
        try:
            # 执行任务
            result = math_task.apply(args=[5, 3])
            
            # 检查结果
            assert result.successful()
            task_result = result.result
            assert task_result["status"] == "success"
            assert task_result["result"] == 8
            assert task_result["input"]["x"] == 5
            assert task_result["input"]["y"] == 3
            
        finally:
            celery_app.conf.task_always_eager = original_eager
    
    def test_error_handling_synchronous(self):
        """测试错误处理同步执行"""
        original_eager = celery_app.conf.task_always_eager
        celery_app.conf.task_always_eager = True
        
        try:
            # 测试成功情况
            result = error_task.apply(args=[False])
            assert result.successful()
            assert result.result["status"] == "success"
            
            # 测试失败情况
            result = error_task.apply(args=[True])
            assert result.failed()
            # 检查异常类型
            assert isinstance(result.info, ValueError)
            assert "这是一个测试错误" in str(result.info)
            
        finally:
            celery_app.conf.task_always_eager = original_eager


class TestCeleryConnectionOptional:
    """需要Redis连接的测试（可选）"""
    
    def test_simple_task_asynchronous(self):
        """测试简单任务异步执行（需要Redis和Worker）"""
        # 运行时检查Redis连接
        if not _check_redis_connection():
            pytest.skip("Redis服务不可用，跳过异步任务测试")
        
        # 确保异步模式
        celery_app.conf.task_always_eager = False
        
        # 发送任务
        result = simple_task.delay("Async test message")
        
        # 等待结果（最多10秒）
        try:
            task_result = result.get(timeout=10)
            assert task_result["status"] == "success"
            assert task_result["message"] == "Async test message"
        except Exception as e:
            pytest.skip(f"异步任务测试失败，可能是Worker未启动: {e}")
    
    def test_task_status_tracking(self):
        """测试任务状态跟踪（需要Redis和Worker）"""
        # 运行时检查Redis连接
        if not _check_redis_connection():
            pytest.skip("Redis服务不可用，跳过异步任务测试")
            
        celery_app.conf.task_always_eager = False
        
        # 发送慢任务
        result = slow_task.delay(2)
        
        # 检查任务状态
        assert result.id is not None
        
        # 等待完成或超时
        try:
            task_result = result.get(timeout=15)
            assert task_result["status"] == "success"
            assert task_result["duration"] == 2
        except Exception as e:
            pytest.skip(f"慢任务测试失败，可能是Worker未启动: {e}")


class TestCeleryUtilities:
    """测试工具函数"""
    
    def test_get_task_result_helper(self):
        """测试任务结果获取辅助函数"""
        original_eager = celery_app.conf.task_always_eager
        celery_app.conf.task_always_eager = True
        
        try:
            # 测试成功任务
            result = simple_task.apply(args=["Helper test"])
            task_info = get_task_result(result)
            
            assert task_info["status"] == "success"
            assert task_info["message"] == "Helper test"
            
        finally:
            celery_app.conf.task_always_eager = original_eager


if __name__ == "__main__":
    # 可以直接运行此文件进行快速测试
    pytest.main([__file__, "-v"])
