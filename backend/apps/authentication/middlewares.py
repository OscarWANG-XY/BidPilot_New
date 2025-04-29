from django.contrib.auth.models import AnonymousUser
from channels.auth import BaseMiddleware
from channels.db import database_sync_to_async
from jwt import decode as jwt_decode
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.conf import settings
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        print("=" * 50)
        print("JWT中间件开始处理")
        
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        # print(f"WebSocket查询参数: {query_params}")
        
        token_list = query_params.get('token')
        if token_list:
            token = token_list[0]
            # print("找到token，尝试验证")
            user = await self.get_user_from_token(token)
            if user:
                print(f"认证成功: 用户ID={user.id}")
            else:
                print("Token验证失败")
            scope['user'] = user if user else AnonymousUser()
        else:
            # print("未提供token")
            scope['user'] = AnonymousUser()
        
        print("JWT中间件处理完成")
        # print("=" * 50)
        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            # 使用 AccessToken 验证
            access_token = AccessToken(token)
            user_id = access_token.payload.get('user_id')
            
            # 获取用户
            return User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist):
            return None





# 测试用户中间件， 在 DEBUG 模式下添加测试用户
from django.conf import settings
from .models import User

class TestUserMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 仅在 DEBUG 模式下添加测试用户
        if settings.DEBUG:
            # 尝试获取第一个用户作为测试用户
            try:
                test_user = User.objects.first()
                if test_user:
                    request.user = test_user
                    # 添加一个属性标记这是测试用户
                    request.user.is_test_user = True
            except Exception as e:
                print(f"Error in TestUserMiddleware: {e}")
        
        response = self.get_response(request)
        return response