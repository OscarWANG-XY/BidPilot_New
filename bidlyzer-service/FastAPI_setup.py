import sys, os
from pathlib import Path
from pprint import pprint
import asyncio
import nest_asyncio
nest_asyncio.apply()

# 导入必要的库
import json
import httpx
from fastapi.testclient import TestClient

# 导入我们的应用
from app.main import app

print("FastAPI_setup.py 执行完毕")