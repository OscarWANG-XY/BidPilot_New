from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import testground
from .serializers import testgroundSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.http import StreamingHttpResponse
import time


@extend_schema_view(
    list=extend_schema(
        tags=['testground'],
        summary='获取testground列表',
        description='获取testground列表'
    ),
    retrieve=extend_schema(
        tags=['testground'],
        summary='获取testground详情',
        description='获取testground详情'
    ),
    create=extend_schema(
        tags=['testground'],
        summary='创建testground',
        description='创建testground'
    ),
    update=extend_schema(
        tags=['testground'],
        summary='更新testground',
        description='更新testground'
    ),
    destroy=extend_schema(
        tags=['testground'],
        summary='删除testground',
        description='删除testground'
    )
)
class testgroundViewSet(viewsets.ModelViewSet):
    queryset = testground.objects.all()
    serializer_class = testgroundSerializer



@api_view(['GET'])
@permission_classes([AllowAny])
def test_sse(request):
    """
    测试SSE连接
    """
    def event_stream():
        for i in range(10):
            yield f"data: 测试消息 {i}\n\n"
            time.sleep(0.5)
        yield "event: done\ndata: \n\n"
    
    response = StreamingHttpResponse(
        streaming_content=event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    #response['Connection'] = 'keep-alive'
    
    return response 

async def websocket_test(request):
    return render(request, 'testground/websocket_test.html') 