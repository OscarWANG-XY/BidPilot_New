from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import (
    Project, ProjectStage, Task,
    ProjectStatus, TaskType, TaskStatus
)
from ..serializers import (
    FileUploadTaskDetailSerializer, FileUploadTaskUpdateSerializer,
)
from drf_spectacular.utils import extend_schema, OpenApiTypes, OpenApiParameter


class FileUploadViewMixin:
    """文件上传视图混入类，提供文件上传相关的方法"""

    @extend_schema(
        tags=['task-upload-files'],
        summary='更新指定项目阶段的文件上传任务',
        description='更新指定项目阶段的文件上传任务',
        request={
            'GET': None,  # GET 请求不需要请求体
            'PATCH': FileUploadTaskUpdateSerializer,
        },
        responses={
            200: FileUploadTaskDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }, 
    )
    @action(detail=True, methods=['get', 'patch'], url_path='file_upload')
    def file_upload(self, request, project_pk=None, pk=None):
        """获取或更新项目阶段的文件上传任务"""
        stage = self.get_object()
        
        # 获取该阶段的文档提取任务
        try:
            task = Task.objects.get(stage=stage, type=TaskType.UPLOAD_TENDER_FILE)
        except Task.DoesNotExist:
            return Response({"detail": "此阶段没有文件上传任务"}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'GET':
            serializer = FileUploadTaskDetailSerializer(task)
            return Response(serializer.data)
        
        # 处理更新请求
        serializer = FileUploadTaskUpdateSerializer(
            task, 
            data=request.data, 
            partial=request.method == 'PATCH',
            context={'request': request}
            )
        if serializer.is_valid():
            serializer.save()
            return Response(FileUploadTaskDetailSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    