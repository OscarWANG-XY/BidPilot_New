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

class TiptapClient:
    """Tiptap服务客户端，用于与tiptap-service进行通信"""
    
    def __init__(self, base_url=None):
        """初始化Tiptap客户端"""
        self.base_url = base_url or getattr(settings, 'TIPTAP_SERVICE_URL', 'http://localhost:3001')
        
    async def _make_request(self, endpoint, data, method='post'):  
        """发送请求到Tiptap服务"""
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
                
                # 如果响应包含data字段，返回其内容
                if isinstance(result, dict) and 'data' in result:
                    return result['data']
                return result
        
        # 以下使用了Exception， 而不是httpx.RequestError，以捕获更为广泛的错误
        except Exception as e:
            logger.error(f"Tiptap服务请求失败: {e}")
            raise Exception(f"Tiptap服务请求失败: {e}")
    
    async def html_to_json(self, html):
        """将HTML转换为Tiptap JSON"""
        return await self._make_request('html-to-json', {'html': html})
    
    async def json_to_html(self, json_data):
        """将Tiptap JSON转换为HTML"""
        return await self._make_request('json-to-html', {'json': json_data})
    
    async def html_to_markdown(self, html):
        """将HTML转换为Markdown"""
        return await self._make_request('html-to-markdown', {'html': html})
    
    async def markdown_to_html(self, markdown):
        """将Markdown转换为HTML"""
        return await self._make_request('markdown-to-html', {'markdown': markdown})
    
    async def json_to_markdown(self, json_data):
        """将Tiptap JSON转换为Markdown"""
        return await self._make_request('json-to-markdown', {'json': json_data})
    
    async def markdown_to_json(self, markdown):
        """将Markdown转换为Tiptap JSON"""
        return await self._make_request('markdown-to-json', {'markdown': markdown})
    
    async def health_check(self):
        """检查Tiptap服务是否正常运行"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health", timeout=5)
                return response.status_code == 200
        except Exception:
            return False