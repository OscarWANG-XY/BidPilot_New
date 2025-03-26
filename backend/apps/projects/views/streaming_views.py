from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from ..models import Project, Task, TaskType, TaskStatus
from ..utils.redis_manager import RedisManager
from ..tasks import process_outline_analysis_streaming
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes, OpenApiParameter
import logging
import time

logger = logging.getLogger(__name__)

# 流式分析相关的视图方法
class StreamingViewMixin:
    """流式响应视图混入类，提供流式分析相关的方法"""
    
    @extend_schema(
        tags=['streaming-analysis'],
        summary='启动流式大纲分析任务',
        description='启动一个流式大纲分析任务，返回任务ID和状态',
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
    @action(detail=True, methods=['POST'], url_path='analyze-outline-streaming')
    def analyze_outline_streaming(self, request, project_pk=None, pk=None):
        """
        启动流式大纲分析任务
        
        Args:
            request: HTTP请求
            project_pk: 项目ID
            pk: 阶段ID
            
        Returns:
            Response: 包含任务ID的响应
        """
        stage = self.get_object()
        project = stage.project
        
        # 文档提取任务是否完成

        docx_task = Task.objects.get(stage=stage, type=TaskType.DOCX_EXTRACTION_TASK)
        if not docx_task.docx_tiptap and docx_task.status != TaskStatus.COMPLETED:
            return Response(
            {"detail": "文档提取任务尚未完成，无法进行大纲分析"},
            status=status.HTTP_400_BAD_REQUEST
        )

        outline_task = Task.objects.get(stage=stage, type=TaskType.OUTLINE_ANALYSIS_TASK)
        outline_task.status = TaskStatus.ACTIVE
        outline_task.save()
        
        # 启动Celery任务
        # 调用Celery任务的.delay()方法，Celery会创建一个实例并分配一个UUID， 返回一个AsyncResult对象（因为用了.delay()方法）。
        # 而process_outline_analysis_streaming函数本身我们看到return stream_id，但因为ignore_result=True，所以不会返回。
        # 
        print(f"启动大纲分析任务: project_id={project.id}")
        celery_task = process_outline_analysis_streaming.delay(project.id)
        celery_task_id = celery_task.id
        
        # 返回任务信息
        return Response({
            'task_id': outline_task.id,  # 数据库中的任务ID
            'stream_id': celery_task_id,  # 用于获取流式输出的ID (与Celery任务ID相同)
            'status': outline_task.status,
            'message': '大纲分析任务已启动'
        })
    
    @extend_schema(
        tags=['streaming-analysis'],
        summary='获取大纲分析任务状态',
        description='根据流ID获取大纲分析任务的当前状态',
        parameters=[
            OpenApiParameter(name='stream_id', location=OpenApiParameter.PATH, required=True, type=str)
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
    @action(detail=True, methods=['GET'], url_path='outline-analysis-status/(?P<stream_id>[^/.]+)')
    def get_outline_analysis_status(self, request, project_pk=None, pk=None, stream_id=None):
        """
        获取大纲分析任务状态
        
        Args:
            request: HTTP请求
            project_pk: 项目ID
            pk: 阶段ID
            stream_id: 流ID
            
        Returns:
            Response: 包含任务状态的响应
        """
        if not stream_id:
            return Response(
                {"detail": "缺少流ID参数"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 获取任务状态
        redis_manager = RedisManager()
        stream_status = redis_manager.get_stream_status(stream_id)
        
        if not stream_status:
            return Response(
                {"detail": "找不到指定的任务"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(stream_status)
    
    @extend_schema(
        tags=['streaming-analysis'],
        summary='流式获取大纲分析结果',
        description='根据流ID获取大纲分析的实时流式结果',
        parameters=[
            OpenApiParameter(name='stream_id', location=OpenApiParameter.PATH, required=True, type=str)
        ],
        responses={
            200: OpenApiTypes.BINARY,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
    @action(detail=True, methods=['GET'], url_path='outline-analysis-stream/(?P<stream_id>[^/.]+)')
    def stream_outline_analysis(self, request, project_pk=None, pk=None, stream_id=None):
        """
        流式获取大纲分析结果
        
        Args:
            request: HTTP请求
            project_pk: 项目ID
            pk: 阶段ID
            stream_id: 流ID
            
        Returns:
            StreamingHttpResponse: 流式响应
        """
        if not stream_id:
            return Response(
                {"detail": "缺少流ID参数"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 创建流式响应
        redis_manager = RedisManager()
        
        # 检查任务是否存在
        stream_status = redis_manager.get_stream_status(stream_id)
        if not stream_status:
            return Response(
                {"detail": "找不到指定的任务"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 设置响应头
        response = StreamingHttpResponse(
            streaming_content=redis_manager.stream_chunks_generator(stream_id),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # 禁用Nginx缓冲
        #response['Connection'] = 'keep-alive'
        
        return response
    
    @extend_schema(
        tags=['streaming-analysis'],
        summary='获取完整的大纲分析结果',
        description='根据流ID获取已完成的大纲分析的完整结果',
        parameters=[
            OpenApiParameter(name='stream_id', location=OpenApiParameter.PATH, required=True, type=str)
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
    @action(detail=True, methods=['GET'], url_path='outline-analysis-result/(?P<stream_id>[^/.]+)')
    def get_outline_analysis_result(self, request, project_pk=None, pk=None, stream_id=None):
        """
        获取完整的大纲分析结果
        
        Args:
            request: HTTP请求
            project_pk: 项目ID
            pk: 阶段ID
            stream_id: 流ID
            
        Returns:
            Response: 包含完整分析结果的响应
        """
        if not stream_id:
            return Response(
                {"detail": "缺少流ID参数"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 获取所有块
        redis_manager = RedisManager()
        chunks = redis_manager.get_stream_chunks(stream_id)
        
        if not chunks:
            return Response(
                {"detail": "找不到指定任务的结果"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 过滤掉特殊标记块
        content_chunks = [
            chunk for chunk in chunks 
            if chunk.get('content') != 'DONE' and not chunk.get('content', '').startswith('ERROR:')
        ]
        
        # 合并内容
        full_content = ''.join([chunk.get('content', '') for chunk in content_chunks])
        
        # 获取任务状态
        stream_status = redis_manager.get_stream_status(stream_id)
        
        return Response({
            'status': stream_status.get('status', 'UNKNOWN'),
            'content': full_content,
            'chunks_count': len(content_chunks),
            'metadata': {k: v for k, v in stream_status.items() if k not in ['status', 'error', 'start_time', 'update_time']}
        })


# 添加测试SSE视图的schema
@extend_schema(
    tags=['streaming-analysis'],
    summary='测试SSE连接',
    description='用于测试服务器发送事件(SSE)连接的简单端点',
    responses={
        200: OpenApiTypes.BINARY
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
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

