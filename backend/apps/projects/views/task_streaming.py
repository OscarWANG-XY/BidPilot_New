from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from ..models import Task, TaskType, TaskStatus
from ..utils.redis_manager import RedisManager
from ..tasks import process_task_analysis_streaming
from drf_spectacular.utils import extend_schema, OpenApiTypes, OpenApiParameter
import logging
import time
from ..services.task_service import can_process_task

logger = logging.getLogger(__name__)

# 流式分析相关的视图方法
class StreamingViewMixin:
    """流式响应视图混入类，提供流式分析相关的方法"""
    
    @extend_schema(
        tags=['task-stream'],
        summary='启动流式任务',
        description='启动一个流式任务，返回任务ID和状态',
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
    @action(detail=True, methods=['POST'], url_path='start-stream')
    def start_stream(self, request, project_pk=None, stage_pk=None, pk=None):
        """
        启动流式任务
        (完成检查~)
        """
        # 传参 project_pk = None, stage_pk = None, pk = None, stream_id = None 设定了默认值。
        # 而实际project_pk, stage_pk, pk的值会由DRF通过嵌套参数提取，而stream_id的值会由上面的url_path中提取。
        # 如果自动提取的内容不存在，由于有默认的None值，不会报错。 
        
        task = self.get_object()
        stage = task.stage
        project = stage.project
        
        # 文档提取任务是否完成
        if not can_process_task(task):

            return Response(
                {"detail": "任务依赖未完成，无法进行当前任务"},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.status = TaskStatus.PROCESSING
        task.save()
        
        # 启动Celery任务
        # 调用Celery任务的.delay()方法，Celery会创建一个实例并分配一个UUID， 返回一个AsyncResult对象（因为用了.delay()方法）。
        # 而process_outline_analysis_streaming函数本身我们看到return stream_id，但因为ignore_result=True，所以不会返回。
        # 
        print(f"启动{task.type}任务: project_id={project.id}")
        celery_task = process_task_analysis_streaming.delay(project.id, stage.stage_type, task.type)
        celery_task_id = celery_task.id
        
        # 返回任务信息
        return Response({
            'task_id': task.id,  # 数据库中的任务ID
            'task_name': task.get_type_display(),
            'stream_id': celery_task_id,  # 用于获取流式输出的ID (与Celery任务ID相同)
            'status': task.status,
            'message': '任务已启动',
            'dependent_task': [dep.get_type_display() for dep in task.dependencies.all()]
        })
    
    @extend_schema(
        tags=['task-stream'],
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
    @action(detail=True, methods=['GET'], url_path='stream-status/(?P<stream_id>[^/.]+)')
    def get_stream_status(self, request, project_pk=None, stage_pk=None, pk=None, stream_id=None):
        """
        获取任务分析状态 
        (完成检查~)
        """
        # 在以下的使用过程中，我实际只使用到了stream_id， UUID能保障唯一性，也与RedisManager使用stream_id为键一致。

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
        tags=['task-stream'],
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
    @action(detail=True, methods=['GET'], url_path='stream-chunks/(?P<stream_id>[^/.]+)')
    def get_stream_chunks(self, request, project_pk=None, stage_pk=None, pk=None, stream_id=None):
        """
        流式获取流内容
        (完成检查~)
        """

        # 在以下的使用过程中，我实际只使用到了stream_id， UUID能保障唯一性，也与RedisManager使用stream_id为键一致。

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
        tags=['task-stream'],
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
    @action(detail=True, methods=['GET'], url_path='stream-result/(?P<stream_id>[^/.]+)')
    def get_stream_result(self, request, project_pk=None, stage_pk=None, pk=None, stream_id=None):
        """
        获取完整分析结果
        (完成检查~)
        """
        # 在以下的使用过程中，我实际只使用到了stream_id， UUID能保障唯一性，也与RedisManager使用stream_id为键一致。

        if not stream_id:
            return Response(
                {"detail": "缺少流ID参数"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 获取所有块
        redis_manager = RedisManager()
        chunks = redis_manager.get_stream_chunks(stream_id)

        print(f"Redis输出的 流式数据块（完整内容）: {chunks}")
        
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
