# Celery 测试指南

## 概述

这个项目包含了用于测试 Celery 分布式任务队列的简单测试套件。测试分为两个层次：
1. **基础测试**：不需要 Redis 连接，使用同步模式
2. **集成测试**：需要 Redis 和 Worker 运行，测试真实的异步任务执行

## 快速开始

### 1. 运行基础测试（推荐）

基础测试不需要额外的服务，可以直接运行：

```bash
# 进入项目目录
cd bidlyzer-service

# 运行所有测试
pytest app/core/tests/test_celery.py -v

# 只运行基础测试类
pytest app/core/tests/test_celery.py::TestCeleryBasic -v

# 只运行配置测试
pytest app/core/tests/test_celery.py::TestCeleryBasic::test_celery_app_configuration -v
```

### 2. 运行完整测试（需要 Redis + Worker）

如果你想测试真实的异步任务执行，需要先启动 Redis 和 Celery Worker：

#### 启动 Redis
```bash
# 使用 Docker 启动 Redis
docker run -d -p 6379:6379 redis:latest

# 或者如果已经配置了 docker-compose
docker-compose up redis -d
```

#### 启动 Celery Worker
```bash
# 在项目目录下
cd bidlyzer-service

# 启动 worker
celery -A worker.celery_app worker --loglevel=info
```

#### 运行完整测试
```bash
pytest app/core/tests/test_celery.py -v
```

## 测试说明

### TestCeleryBasic（基础测试）
- ✅ **test_celery_app_configuration**: 检查 Celery 应用配置和任务注册
- ✅ **test_simple_task_synchronous**: 测试简单任务同步执行
- ✅ **test_math_task_synchronous**: 测试数学计算任务
- ✅ **test_error_handling_synchronous**: 测试错误处理

### TestCeleryConnectionOptional（集成测试）
- 🔄 **test_simple_task_asynchronous**: 测试异步任务执行（需要 Redis + Worker）
- 🔄 **test_task_status_tracking**: 测试任务状态跟踪（需要 Redis + Worker）

### TestCeleryUtilities（工具测试）
- ✅ **test_get_task_result_helper**: 测试辅助函数

## 可用的测试任务

项目包含以下测试任务（在 `app/tasks/test_tasks.py` 中定义）：

1. **simple_task**: 简单的消息处理任务
2. **math_task**: 数学计算任务
3. **slow_task**: 模拟耗时任务（用于测试进度跟踪）
4. **error_task**: 错误处理测试任务
5. **periodic_health_check**: 定期健康检查任务

## 手动测试任务

你也可以在 Python 中手动测试任务：

```python
from app.tasks.test_tasks import simple_task, math_task

# 同步执行（测试模式）
result = simple_task.apply(args=["Hello World"])
print(result.result)

# 异步执行（需要 Worker 运行）
result = simple_task.delay("Hello Async World")
print(result.get(timeout=10))
```

## 常见问题

### Q: 测试失败，提示模块导入错误
A: 确保你在正确的目录下运行测试，并且 Python 路径设置正确：
```bash
# 设置 Python 路径
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
pytest app/core/tests/test_celery.py -v
```

### Q: 异步测试被跳过
A: 这是正常的，异步测试需要 Redis 和 Worker 运行。如果只想测试基本功能，基础测试就足够了。

### Q: 如何查看任务详细日志
A: 启动 Worker 时使用详细日志级别：
```bash
celery -A worker.celery_app worker --loglevel=debug
```

## 测试结果示例

```bash
$ pytest app/core/tests/test_celery.py -v

app/core/tests/test_celery.py::TestCeleryBasic::test_celery_app_configuration PASSED
app/core/tests/test_celery.py::TestCeleryBasic::test_simple_task_synchronous PASSED  
app/core/tests/test_celery.py::TestCeleryBasic::test_math_task_synchronous PASSED
app/core/tests/test_celery.py::TestCeleryBasic::test_error_handling_synchronous PASSED
app/core/tests/test_celery.py::TestCeleryConnectionOptional::test_simple_task_asynchronous SKIPPED
app/core/tests/test_celery.py::TestCeleryConnectionOptional::test_task_status_tracking SKIPPED
app/core/tests/test_celery.py::TestCeleryUtilities::test_get_task_result_helper PASSED

================= 5 passed, 2 skipped in 0.15s =================
``` 