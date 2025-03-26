from rest_framework import viewsets, mixins, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from ..models import (
    Project, ProjectStage, Task,
    StageChangeHistory, TaskChangeHistory,
    ProjectStatus, TaskType, TaskStatus
)
from ..serializers import (
    ProjectStageDetailSerializer, ProjectStageUpdateSerializer,
    TaskListSerializer,
    FileUploadTaskDetailSerializer, FileUploadTaskUpdateSerializer,
    DocxExtractionTaskDetailSerializer, DocxExtractionTaskUpdateSerializer,
    StageChangeHistorySerializer, TaskChangeHistorySerializer
)
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
from .streaming_views import StreamingViewMixin
import logging

logger = logging.getLogger(__name__)

@extend_schema_view(
    retrieve=extend_schema(
        tags=['project-stages'],
        summary='获取项目阶段详情',
        description='获取指定项目阶段的详细信息',
        responses={
            200: ProjectStageDetailSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    partial_update=extend_schema(
        tags=['project-stages'],
        summary='更新项目阶段,包括其任务状态',
        description='更新指定项目阶段的详细信息,包括其任务状态',
        request=ProjectStageUpdateSerializer,
        responses={
            200: ProjectStageDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    file_upload=extend_schema(
        tags=['project-stages'],
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
        methods=['GET', 'PATCH']
    ),
    docx_extraction=extend_schema(
        tags=['project-stages'],
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
        methods=['GET', 'PATCH']
    ),  
)
class ProjectStageViewSet(StreamingViewMixin,
                          mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin, # 目前还用不到update, 注意不存在partial_update mixin
                          viewsets.GenericViewSet):
    """
    项目阶段视图集，只提供了项目阶段的读取和更新功能
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """
        根据请求方法返回不同的序列化器
        - GET 请求使用 ProjectStageDetailSerializer 展示详细信息
        - PUT/PATCH 请求使用 ProjectStageUpdateSerializer 处理更新
        """
        if self.request.method in ['PUT', 'PATCH']:
            return ProjectStageUpdateSerializer
        return ProjectStageDetailSerializer

    
    def get_queryset(self):
        """
        获取查询集，只返回当前用户创建的特定项目的阶段
        """
        queryset = ProjectStage.objects.filter(project__creator=self.request.user)
    
        # 如果是嵌套路由，通过project_pk进一步过滤
        project_pk = self.kwargs.get('project_pk')
        if project_pk:
            queryset = queryset.filter(project_id=project_pk)
    
        return queryset

    # 当处理详情类操作时（如 retrieve、update、partial_update、destroy），
    # 框架会调用视图集的 get_object() 方法来获取要操作的单个对象。
    # get_object() 是基于get_queryset() 进行构建的
    # 由于get_queryset() 已经到了project_pk查询，所以get_object()就不需要再使用project_pk
    def get_object(self):
        """
        根据项目ID和阶段类型获取阶段对象，而不是使用阶段ID
        """
        #project_pk = self.kwargs['project_pk']
        stage_type = self.kwargs['pk']  # 在URL中，阶段类型会作为pk参数传入
        
        queryset = self.get_queryset()
        obj = get_object_or_404(
            queryset,
            stage_type=stage_type
        )
        return obj

    def partial_update(self, request, *args, **kwargs):
        """
        更新项目阶段，包括其任务状态
        """
        stage = self.get_object()
        serializer = self.get_serializer(
            stage, 
            data=request.data, 
            partial=True,
            context={'request': request}
            )

        if serializer.is_valid():
            serializer.save()
            # Return the updated stage with full details
            return Response(ProjectStageDetailSerializer(stage).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['get'])
    def tasks(self, request, project_pk=None, pk=None):
        """获取项目阶段下的所有任务"""
        stage = self.get_object()
        tasks = stage.tasks.all()
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)



    @action(detail=True, methods=['get', 'patch'])
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


    @action(detail=True, methods=['get', 'patch'])
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

