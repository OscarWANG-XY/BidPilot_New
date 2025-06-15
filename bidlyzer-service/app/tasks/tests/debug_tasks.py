#!/usr/bin/env python3
"""
调试 Celery 任务锁问题的脚本
"""

from app.tasks.tasks import (
    test_redis_connection,
    test_lock_mechanism,
    clear_test_locks,
    check_lock_status,
    test_task_with_lock
)

def test_sync_locks():
    print("=== Celery 任务调试 ===")
    
    print("\n1. 测试 Redis 连接...")
    try:
        result = test_redis_connection.delay()
        print(f"Redis 连接测试结果: {result.get(timeout=10)}")
    except Exception as e:
        print(f"Redis 连接测试失败: {e}")
    
    print("\n2. 测试锁机制...")
    try:
        result = test_lock_mechanism.delay()
        print(f"锁机制测试结果: {result.get(timeout=10)}")
    except Exception as e:
        print(f"锁机制测试失败: {e}")
    
    print("\n3. 检查现有锁状态...")
    try:
        result = check_lock_status.delay("task_lock:test_task:TEST_DUPLICATE")
        print(f"锁状态检查结果: {result.get(timeout=10)}")
    except Exception as e:
        print(f"锁状态检查失败: {e}")
    
    print("\n4. 清理测试锁...")
    try:
        result = clear_test_locks.delay()
        print(f"锁清理结果: {result.get(timeout=10)}")
    except Exception as e:
        print(f"锁清理失败: {e}")
    
    print("\n5. 再次测试带锁的任务...")
    try:
        result = test_task_with_lock.delay("TEST_DUPLICATE")
        print(f"带锁任务测试结果: {result.get(timeout=15)}")
    except Exception as e:
        print(f"带锁任务测试失败: {e}")

if __name__ == "__main__":
    test_sync_locks() 