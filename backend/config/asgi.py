"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# Initialize Django ASGI application
django_asgi_app = get_asgi_application()

# Import your WebSocket URL patterns
# We'll create this file in the next step
from config.routing import websocket_urlpatterns

# Configure the ASGI application
application = ProtocolTypeRouter({
    # Django's ASGI application for traditional HTTP requests
    "http": django_asgi_app,
    # "websocket": AuthMiddlewareStack(
    #     URLRouter(websocket_urlpatterns)
    # ),
    
    # AllowedHostsOriginValidator 会测试 origin 是否在 ALLOWED_HOSTS 中，同时也会查origin的头。
    # 当我用postman测试的时候，会报错，一开始由于没有添加Origin, value= http://localhost:8000, 一直不能正常连接。 
    "websocket": AllowedHostsOriginValidator(   
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
