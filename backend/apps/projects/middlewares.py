import json
import logging
import time
import asyncio
from django.utils.decorators import sync_and_async_middleware
from asgiref.sync import sync_to_async, async_to_sync

logger = logging.getLogger(__name__)

class APILoggingMiddleware:
    """API调用日志中间件"""

    def __init__(self, get_response):
        self.get_response = get_response
        # 确定 get_response 是同步还是异步函数
        self.is_async = asyncio.iscoroutinefunction(get_response)

    def log_request(self, request):
        """记录请求信息"""
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

    def log_response(self, request, response):
        """记录响应信息"""
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
        if self.is_async:
            # 如果 get_response 是异步的，但我们在同步上下文中
            # 使用 async_to_sync 转换
            return async_to_sync(self.__acall__)(request)
        
        # 记录请求
        self.log_request(request)
        
        # 获取响应
        response = self.get_response(request)
        
        # 记录并返回响应
        return self.log_response(request, response)
    
    # 异步路径
    async def __acall__(self, request):
        # 记录请求
        self.log_request(request)
        
        # 获取响应
        if self.is_async:
            response = await self.get_response(request)
        else:
            # 如果 get_response 是同步的，但我们在异步上下文中
            response = await sync_to_async(self.get_response)(request)
        
        # 记录并返回响应
        return self.log_response(request, response)
    


    