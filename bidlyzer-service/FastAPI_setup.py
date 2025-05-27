import sys, os
from pathlib import Path
from pprint import pprint
import asyncio
import nest_asyncio
nest_asyncio.apply()
import logging
from dotenv import load_dotenv
# 导入必要的库
import json
import httpx
from fastapi.testclient import TestClient


# ================== 环境配置 (对应Django setup的环境配置) ===================


# 日志配置 - 清理并重新配置日志，避免Jupyter中重复输出
logging.root.handlers = []  # 清理所有已有的日志处理器

# 配置全局日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# 配置FastAPI应用相关的日志
app_logger = logging.getLogger('app')
app_logger.setLevel(logging.INFO)
app_logger.handlers = []  # 清除旧的handlers
app_logger.addHandler(logging.StreamHandler(sys.stdout))
app_logger.propagate = False

# 配置uvicorn日志（如果需要）
uvicorn_logger = logging.getLogger('uvicorn')
uvicorn_logger.setLevel(logging.INFO)
uvicorn_logger.handlers = []
uvicorn_logger.addHandler(logging.StreamHandler(sys.stdout))
uvicorn_logger.propagate = False


# ================== 应用初始化 ===================

# 导入我们的应用和配置
from app.main import app
from app.core.config import settings

# ================== 调试信息输出 ===================

# 打印关键配置信息，便于调试（对应Django setup中的调试输出）
print(f"当前环境: {os.environ.get('ENVIRONMENT', 'development')}")
print(f"FastAPI应用名称: {settings.PROJECT_NAME}")
print(f"API端口: {settings.API_PORT}")
print(f"数据库URL: {settings.DATABASE_URL}")
print(f"Redis URL: {settings.REDIS_URL}")
# print(f"阿里云API Key: {settings.ALIBABA_API_KEY}")
print("FastAPI_setup.py 执行完毕")