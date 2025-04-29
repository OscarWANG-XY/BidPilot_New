from django.urls import path, re_path
from channels.routing import URLRouter
from apps.projects.services.agents.structuring.consumers import StructuringAgentConsumer
from apps.projects.consumers.consumers import LLMStreamConsumer
from apps.testground.consumers import TestConsumer, SimpleTestConsumer, BasicConsumer

# Import your WebSocket consumers here
# For example:
# from apps.chat.consumers import ChatConsumer

websocket_urlpatterns = [
    # 专门服务 StructuringAgent 的 WebSocket 通道，(?P<project_id>...) 是URL参数 用在consumer中 进行解析。 
    re_path(r'ws/structuring/(?P<project_id>[^/]+)/$', StructuringAgentConsumer.as_asgi()),


    # 聊天
    path('ws/llm-stream/<str:room_name>/', LLMStreamConsumer.as_asgi()),

    # 测试
    path('ws/test/', TestConsumer.as_asgi()),
    path('ws/simple-test/', SimpleTestConsumer.as_asgi()),
    path('ws/basic/', BasicConsumer.as_asgi()),
    # Define your WebSocket URL patterns here
    
    # For example:
    # path('ws/chat/<str:room_name>/', ChatConsumer.as_asgi()),
]
