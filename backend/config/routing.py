from django.urls import path
from channels.routing import URLRouter
from apps.projects.consumers import LLMStreamConsumer
from apps.testground.consumers import TestConsumer, SimpleTestConsumer, BasicConsumer

# Import your WebSocket consumers here
# For example:
# from apps.chat.consumers import ChatConsumer

websocket_urlpatterns = [
    path('ws/llm-stream/<str:room_name>/', LLMStreamConsumer.as_asgi()),
    path('ws/test/', TestConsumer.as_asgi()),
    path('ws/simple-test/', SimpleTestConsumer.as_asgi()),
    path('ws/basic/', BasicConsumer.as_asgi()),
    # Define your WebSocket URL patterns here
    # For example:
    # path('ws/chat/<str:room_name>/', ChatConsumer.as_asgi()),
]
