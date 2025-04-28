import json
import logging
import time
import asyncio
from django.utils.deprecation import MiddlewareMixin
from django.utils.decorators import sync_and_async_middleware

logger = logging.getLogger(__name__)

@sync_and_async_middleware
class APILoggingMiddleware:
    """API调用日志中间件"""

    def __init__(self, get_response):
        self.get_response = get_response

    def process_request(self, request):
        """处理请求前的日志记录"""
        # 保存请求开始时间
        request.start_time = time.time()
        
        # 记录请求信息
        if request.path.startswith('/api/'):
            method = request.method
            path = request.path
            query_params = dict(request.GET)
            
            # 安全处理请求体 - 避免记录敏感信息
            body = None
            if method in ['POST', 'PUT', 'PATCH'] and request.body:
                try:
                    if isinstance(request.body, bytes):
                        body_str = request.body.decode('utf-8')
                        body = json.loads(body_str)
                        # 可以在这里移除敏感字段
                        if 'password' in body:
                            body['password'] = '******'
                except Exception:
                    body = "(无法解析请求体)"
            
            logger.info(
                f"收到API请求 {method} {path}\n"
                f"查询参数: {query_params}\n"
                f"请求体: {body}\n"
                f"用户: {request.user.username if request.user.is_authenticated else '未认证'}"
            )
        return None

    def process_response(self, request, response):
        """处理响应后的日志记录"""
        if hasattr(request, 'start_time') and request.path.startswith('/api/'):
            # 计算处理时间
            duration = time.time() - request.start_time
            status_code = response.status_code
            
            # 尝试获取响应体内容
            response_body = None
            if hasattr(response, 'data'):
                response_body = response.data
            
            logger.info(
                f"API响应 {request.method} {request.path}\n"
                f"状态码: {status_code}\n"
                f"处理时间: {duration:.2f}秒\n"
                f"响应数据: {response_body if status_code < 400 else '省略'}"
            )
        return response

    # 同步路径
    def __call__(self, request):
        response = self.process_request(request)
        if response is None:
            response = self.get_response(request)
        return self.process_response(request, response)
    
    # 异步路径 - 这是之前缺少的部分
    async def __acall__(self, request):
        # 异步处理请求
        self.process_request(request)
        
        # 获取异步响应
        response = await self.get_response(request)
        
        # 处理响应
        return self.process_response(request, response)