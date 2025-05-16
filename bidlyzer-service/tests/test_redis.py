# test_redis.py
import asyncio
import sys
import os
import json
from pathlib import Path

# 确保项目根目录被正确添加到 sys.path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
print(f"Project Root: {project_root}")

from app.core.config import settings
from app.core.redis_helper import RedisClient

# 测试.env文件加载, 检查config.py中是否正确加载了.env文件 
def test_env_loading():
    print("\n=== Testing .env file loading ===")
    print(f"Project Name: {settings.PROJECT_NAME}")
    print(f"Redis Host: {settings.REDIS_HOST}")
    print(f"Redis Port: {settings.REDIS_PORT}")
    print(f"Redis DB: {settings.REDIS_DB}")
    print(f"Redis Password: {settings.REDIS_PASSWORD}")
    print(f"Redis URL: {settings.REDIS_URL}")
    print("==============================\n")

    print("Loading .env from:", str(Path(__file__).resolve().parent.parent.parent / ".env"))


# 测试Redis连接
async def test_redis_connection():
    try:
        redis = await RedisClient.get_client()
        await redis.set("ping", "pong")
        result = await redis.get("ping")
        print(f"Redis连接成功: {result}")
        return redis # 返回连接对象，供后续测试使用
    except Exception as e:
        print(f"Redis连接失败: {str(e)}")
        raise



# 测试Redis功能
async def test_redis(redis):
    # 测试基本的设置和获取
    await redis.set("test_key", "test_value")
    value = await redis.get("test_key")
    print(f"测试基本读写: {value}")
    
    # 测试设置带过期时间的键
    await redis.set("test_expire", "will expire", 2)
    print(f"测试过期前: {await redis.get('test_expire')}")
    await asyncio.sleep(3)
    print(f"测试过期后: {await redis.get('test_expire')}")
    
    # 测试JSON序列化和反序列化
    test_dict = {"name": "测试", "value": 123, "nested": {"a": 1, "b": 2}}
    await redis.set("test_json", json.dumps(test_dict))
    result = await redis.get("test_json")
    print(f"测试JSON序列化: {json.loads(result)}")
    
    # 清理测试键
    await redis.delete("test_key")
    
    # # 关闭连接, 在main中有统一关闭
    # await redis.aclose()

if __name__ == "__main__":
    test_env_loading()

    async def main():
        redis = await test_redis_connection()  #获取连接
        await test_redis(redis) #复用连接
        await redis.aclose() # 显式关闭

    asyncio.run(main())  # 单次事件循环
