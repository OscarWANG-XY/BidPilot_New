# integration/conftest.py
# 集中定义共享的测试夹具， 以及通用的钩子函数、配置和插件逻辑， 简单说"全局工具箱"
# 可以被项目种所有的测试文件自动发现和使用，无需显示导入。 
# 主要定义： fixture, 自定义标记（如skip条件）， pytest钩子函数

# 加载环境变量, 指定特定环境变量文件
from dotenv import load_dotenv
from pathlib import Path
#load_dotenv() #默认在当前工作目录下找.env文件， 如果找不到往上一级。  所以取决于pytest的启动目录
# 手动配置
BASE_DIR = Path(__file__).resolve().parent.parent
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

# 检查是否启用了docx测试
skip_if_no_docx = pytest.mark.skipif(
    not os.getenv("DOCX_TEST") == "true",
    reason="Set DOCX_TEST=true to run docx tests"
)