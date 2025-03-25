from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import serializers
from .client import TiptapClient

# 添加序列化器类
class HtmlInputSerializer(serializers.Serializer):
    html = serializers.CharField(required=True)

class JsonInputSerializer(serializers.Serializer):
    json = serializers.JSONField(required=True)

class MarkdownInputSerializer(serializers.Serializer):
    markdown = serializers.CharField(required=True)

class TiptapResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField(default=True)
    error = serializers.CharField(required=False, allow_null=True)

class HealthCheckSerializer(serializers.Serializer):
    status = serializers.CharField()

@api_view(['POST'])
def html_to_json(request):
    """将HTML转换为Tiptap JSON"""
    serializer = HtmlInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'error': serializer.errors}, status=400)
    
    client = TiptapClient()
    try:
        result = client.html_to_json(serializer.validated_data['html'])
        return Response(result)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
def json_to_html(request):
    """将Tiptap JSON转换为HTML"""
    serializer = JsonInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'error': serializer.errors}, status=400)
    
    client = TiptapClient()
    try:
        result = client.json_to_html(serializer.validated_data['json'])
        return Response(result)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
def markdown_to_json(request):
    """将Markdown转换为Tiptap JSON"""
    serializer = MarkdownInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'error': serializer.errors}, status=400)
    
    client = TiptapClient()
    try:
        result = client.markdown_to_json(serializer.validated_data['markdown'])
        return Response(result)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
def json_to_markdown(request):
    """将Tiptap JSON转换为Markdown"""
    serializer = JsonInputSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'error': serializer.errors}, status=400)
    
    client = TiptapClient()
    try:
        result = client.json_to_markdown(serializer.validated_data['json'])
        return Response(result)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['GET'])
def tiptap_health(request):
    """检查Tiptap服务健康状态"""
    client = TiptapClient()
    healthy = client.health_check()
    response_data = {'status': 'OK' if healthy else 'ERROR'}
    serializer = HealthCheckSerializer(data=response_data)
    serializer.is_valid()
    return Response(serializer.data)