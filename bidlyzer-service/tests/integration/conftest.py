# integration/conftest.py
# 集中定义共享的测试夹具， 以及通用的钩子函数、配置和插件逻辑， 简单说"全局工具箱"
# 可以被项目种所有的测试文件自动发现和使用，无需显示导入。 
# 主要定义： fixture, 自定义标记（如skip条件）， pytest钩子函数

# 加载环境变量, 指定特定环境变量文件
from dotenv import load_dotenv
from pathlib import Path
#load_dotenv() #默认在当前工作目录下找.env文件， 如果找不到往上一级。  所以取决于pytest的启动目录
# 手动配置
BASE_DIR = Path(__file__).resolve().parent.parent.parent
dotenv_path = BASE_DIR / ".env.test"
print(f"加载环境变量文件: {dotenv_path}")
load_dotenv(dotenv_path=dotenv_path)


import pytest
import os
import asyncio
import logging
import pytest_asyncio
from app.tiptap.client import TiptapClient
from app.core.redis_helper import RedisClient


# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 全局集成测试开关
RUN_ALL_INTEGRATION_TESTS = os.getenv("ALL_INTEGRATION_TESTS") == "true"

# 环境变量检查装饰器
# 如果环境变量TIPTAP_INTEGRATION_TEST不为true，则跳过测试
skip_if_no_service = pytest.mark.skipif(
    not (os.getenv("TIPTAP_INTEGRATION_TEST") == "true" or RUN_ALL_INTEGRATION_TESTS),
    reason="Set TIPTAP_INTEGRATION_TEST=true or ALL_INTEGRATION_TESTS=true to run integration tests"
)

# Redis集成测试跳过条件
skip_if_no_redis = pytest.mark.skipif(
    not (os.getenv("REDIS_INTEGRATION_TEST") == "true" or RUN_ALL_INTEGRATION_TESTS),
    reason="Set REDIS_INTEGRATION_TEST=true or ALL_INTEGRATION_TESTS=true to run Redis integration tests"
)

@pytest.fixture(scope="session")
def tiptap_service_url():
    """从环境变量获取Tiptap服务URL"""
    return os.getenv("TIPTAP_SERVICE_URL", "http://localhost:3001")

@pytest.fixture
def tiptap_client(tiptap_service_url):
    """创建一个真实的TiptapClient实例"""
    logger.info(f"创建TiptapClient实例，连接到 {tiptap_service_url}")
    return TiptapClient(base_url=tiptap_service_url)

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