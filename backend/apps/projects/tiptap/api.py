from rest_framework.decorators import api_view
from rest_framework.response import Response
from .client import TiptapClient

@api_view(['POST'])
def html_to_json(request):
    """将HTML转换为Tiptap JSON"""
    html = request.data.get('html')
    if not html:
        return Response({'success': False, 'error': 'HTML content is required'}, status=400)
    
    client = TiptapClient()
    try:
        result = client.html_to_json(html)
        return Response(result)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
def json_to_html(request):
    """将Tiptap JSON转换为HTML"""
    json_data = request.data.get('json')
    if not json_data:
        return Response({'success': False, 'error': 'JSON content is required'}, status=400)
    
    client = TiptapClient()
    try:
        result = client.json_to_html(json_data)
        return Response(result)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
def markdown_to_json(request):
    """将Markdown转换为Tiptap JSON"""
    markdown = request.data.get('markdown')
    if not markdown:
        return Response({'success': False, 'error': 'Markdown content is required'}, status=400)
    
    client = TiptapClient()
    try:
        result = client.markdown_to_json(markdown)
        return Response(result)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
def json_to_markdown(request):
    """将Tiptap JSON转换为Markdown"""
    json_data = request.data.get('json')
    if not json_data:
        return Response({'success': False, 'error': 'JSON content is required'}, status=400)
    
    client = TiptapClient()
    try:
        result = client.json_to_markdown(json_data)
        return Response(result)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@api_view(['GET'])
def tiptap_health(request):
    """检查Tiptap服务健康状态"""
    client = TiptapClient()
    healthy = client.health_check()
    return Response({'status': 'OK' if healthy else 'ERROR'})