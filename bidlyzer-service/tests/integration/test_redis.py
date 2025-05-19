# test_redis.py
import asyncio
import json
import pytest
import pytest_asyncio
from app.core.config import settings
from ..conftest import skip_if_no_redis
from app.core.redis_helper import RedisClient


# 添加标记，使其可以通过pytest -m redis运行
pytestmark = [pytest.mark.integration, pytest.mark.redis]

@pytest_asyncio.fixture
async def redis_client():
    """获取Redis客户端连接作为fixture"""
    client = await RedisClient.get_client()
    yield client
    # 清理测试数据
    await client.delete("test_key", "test_json")
    # 关闭连接
    await client.aclose()

@pytest.fixture
def event_loop():
    """创建一个新的事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close() 


@skip_if_no_redis
def test_env_loading():
    """测试.env文件加载, 检查config.py中是否正确加载了.env文件"""
    assert settings.PROJECT_NAME, "项目名称未设置"   # 断言失败时，显示错误信息"项目名称未设置"
    assert settings.REDIS_HOST, "Redis主机未设置"
    assert settings.REDIS_PORT, "Redis端口未设置"
    assert isinstance(settings.REDIS_DB, int), "Redis数据库应为整数"
    assert settings.REDIS_URL, "Redis URL未设置"

@skip_if_no_redis
@pytest.mark.asyncio
async def test_redis_connection():
    """测试Redis连接是否正常工作"""
    from app.core.redis_helper import RedisClient
    redis = await RedisClient.get_client()
    try:
        await redis.set("ping", "pong")
        result = await redis.get("ping")
        assert result == "pong", "Redis连接测试失败"
    finally:
        await redis.delete("ping")
        await redis.aclose()

@skip_if_no_redis
@pytest.mark.asyncio
async def test_redis_basic_operations(redis_client):
    """测试Redis基本读写操作"""
    await redis_client.set("test_key", "test_value")
    value = await redis_client.get("test_key")
    assert value == "test_value", "基本读写操作失败"

@skip_if_no_redis
@pytest.mark.asyncio
async def test_redis_expiry(redis_client):
    """测试Redis键过期功能"""
    await redis_client.set("test_expire", "will expire", 1)
    value_before = await redis_client.get("test_expire")
    assert value_before == "will expire", "设置带过期时间的键失败"
    
    await asyncio.sleep(2)
    value_after = await redis_client.get("test_expire")
    assert value_after is None, "键过期功能未正常工作"

@skip_if_no_redis
@pytest.mark.asyncio
async def test_redis_json(redis_client):
    """测试Redis JSON序列化和反序列化"""
    test_dict = {"name": "测试", "value": 123, "nested": {"a": 1, "b": 2}}
    await redis_client.set("test_json", json.dumps(test_dict))
    result = await redis_client.get("test_json")
    loaded_dict = json.loads(result)
    assert loaded_dict == test_dict, "JSON序列化和反序列化失败"
    assert loaded_dict["name"] == "测试", "JSON值不匹配"
    assert loaded_dict["nested"]["a"] == 1, "嵌套JSON值不匹配"



