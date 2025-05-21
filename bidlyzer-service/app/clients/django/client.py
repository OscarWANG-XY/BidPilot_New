import requests
import httpx
import json
import logging
import inspect
from app.core.config import settings

# 配置日志
logger = logging.getLogger(__name__)
# 设置 httpx 和 httpcore 的日志级别为 WARNING，这样就不会显示 DEBUG 信息
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

class DjangoClient:
    """Django服务客户端，用于与django-service进行通信"""
    
    def __init__(self, base_url=None):
        """初始化Django客户端"""
        self.base_url = base_url or getattr(settings, 'DJANGO_SERVICE_URL', 'http://localhost:8000')
        
    async def _make_request(self, endpoint, data, method='post'):
        """发送请求到Django服务"""
        url = f"{self.base_url}/{endpoint}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method=method,  # 请求方法默认是post
                    url=url,
                    json=data,
                    headers={'Content-Type': 'application/json'},
                    timeout=30  # 增加超时时间，处理大文档
                )
                # 检查请求状态
                response.raise_for_status()
                
                # 安全地处理json方法，支持同步和异步
                json_method = response.json
                if inspect.iscoroutinefunction(json_method):
                    # 如果是异步方法
                    result = await json_method()
                else:
                    # 如果是同步方法
                    result = json_method()
                
                return result  # 返回解析后的JSON数据

        # 以下使用了Exception， 而不是httpx.RequestError，以捕获更为广泛的错误
        except Exception as e:
            logger.error(f"Django服务请求失败: {e}")
            raise Exception(f"Django服务请求失败: {e}")
        

    async def get_tender_file_url(self, project_id):
        """获取项目招标文件URL
        
        Args:
            project_id (str): 项目ID
            
        Returns:
            dict: 包含文件URL列表的响应数据
        """
        endpoint = f"api/internal/projects/{project_id}/get_tender_file_url/"
        # 使用GET方法获取文件URL
        return await self._make_request(endpoint, data=None, method='get')