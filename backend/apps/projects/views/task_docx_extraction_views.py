from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import (Task, TaskType, TaskStatus, TaskLockStatus)
from ..serializers import DocxExtractionTaskDetailSerializer, DocxExtractionTaskUpdateSerializer, DocxExtractionStartSerializer 
from drf_spectacular.utils import extend_schema, OpenApiTypes
import logging

logger = logging.getLogger(__name__)

class DocxExtractionViewMixin:
    """文档内容提取视图混入类，提供文档内容提取相关的方法"""

    @extend_schema(
        tags=['task-docx-extraction'],
        summary='获取指定项目阶段的文档提取任务',
        description='获取指定项目阶段的文档提取任务',
        request={
            'GET': None,  # GET 请求不需要请求体
            'PATCH': DocxExtractionTaskUpdateSerializer,
        },
        responses={
            200: DocxExtractionTaskDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        },
    )
    @action(detail=True, methods=['get', 'patch'], url_path='docx_extraction')
    def docx_extraction(self, request, project_pk=None, pk=None):
        """获取或更新阶段的文档提取任务"""
        stage = self.get_object()
        
        # 获取该阶段的文档提取任务
        try:
            task = Task.objects.get(stage=stage, type=TaskType.DOCX_EXTRACTION_TASK)
        except Task.DoesNotExist:
            return Response({"detail": "此阶段没有文档提取任务"}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'GET':
            serializer = DocxExtractionTaskDetailSerializer(task)
            return Response(serializer.data)
        
        # 处理更新请求
        serializer = DocxExtractionTaskUpdateSerializer(
            task, 
            data=request.data, 
            partial=request.method == 'PATCH',
            context={'request': request}
            )
        if serializer.is_valid():
            serializer.save()
            return Response(DocxExtractionTaskDetailSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        tags=['task-docx-extraction'],
        summary='手动启动文档提取任务',
        description='将文档提取任务状态设置为活动状态，开始处理',
        request=DocxExtractionTaskUpdateSerializer,
        responses={
            200: DocxExtractionTaskDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        },
    )
    @action(detail=True, methods=['patch'], url_path='start_docx_extraction')
    def start_docx_extraction(self, request, project_pk=None, pk=None):
        """手动启动文档提取任务"""
        stage = self.get_object()
        
        # 获取该阶段的文档提取任务
        try:
            task = Task.objects.get(stage=stage, type=TaskType.DOCX_EXTRACTION_TASK)
        except Task.DoesNotExist:
            return Response({"detail": "此阶段没有文档提取任务"}, status=status.HTTP_404_NOT_FOUND)
        
        # 获取项目
        project = stage.project
        
        # 更新任务状态为活动状态
        serializer = DocxExtractionStartSerializer(
            task, 
            data={
                "status": TaskStatus.ACTIVE,
                "lock_status": TaskLockStatus.UNLOCKED
            },
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # 保存任务状态（获取的是最新的任务实例，从searlizer.save()保存后返回的，这里都是最新的字段）
            task_instance = serializer.save() 
            
            # 直接启动异步文档提取任务
            try:
                from ..tasks import process_docx_extraction
                # 传递任务ID，用于后续通知
                process_docx_extraction.delay(project.id)
                logger.info(f"已启动异步文档提取任务，project_id={project.id}")
            except Exception as e:
                logger.error(f"启动文档提取任务失败: {str(e)}")
                # 发生错误时，将任务标记为失败
                task_instance.status = TaskStatus.FAILED #这里使用的都是最新的task实例
                task_instance.save()  #再新的task实例的基础上进行保存
                return Response(
                    {"detail": f"启动文档提取任务失败: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # 返回任务ID，前端用于订阅事件
            response_data = DocxExtractionTaskDetailSerializer(task_instance).data
            #设置用于前端订阅的通道，前端EventSource API需要连接到 /events/?channel=docx-extraction 端点
            response_data['event_channel'] = f'docx-extraction'   
            return Response(response_data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

    
    