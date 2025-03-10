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