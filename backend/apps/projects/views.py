from rest_framework import viewsets, mixins, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .models import (
    Project, ProjectStatus
)
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer, ProjectCreateSerializer, 
    ProjectUpdateSerializer, ProjectStatusUpdateSerializer, 
)
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
import logging
from rest_framework.parsers import MultiPartParser, FormParser
import mimetypes
import os


logger = logging.getLogger(__name__)

@extend_schema_view(
    list=extend_schema(
        tags=['projects'],
        summary='获取项目列表',
        description='获取当前用户创建的所有项目列表',
        responses={
            200: ProjectListSerializer(many=True),
            401: OpenApiTypes.OBJECT
        }
    ),
    create=extend_schema(
        tags=['projects'],
        summary='创建新项目',
        description='创建一个新的项目记录',
        request=ProjectCreateSerializer,
        responses={
            201: ProjectDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['projects'],
        summary='获取项目详情',
        description='获取指定项目的详细信息',
        responses={
            200: ProjectDetailSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    update=extend_schema(
        tags=['projects'],
        summary='更新项目信息',
        description='更新指定项目的全部信息',
        request=ProjectUpdateSerializer,
        responses={
            200: ProjectDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    partial_update=extend_schema(
        tags=['projects'],
        summary='部分更新项目',
        description='部分更新指定项目的信息',
        request=ProjectUpdateSerializer,
        responses={
            200: ProjectDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    destroy=extend_schema(
        tags=['projects'],
        summary='删除项目',
        description='删除指定的项目。注意：只能删除草稿或已取消状态的项目。',
        responses={
            204: None,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    update_status=extend_schema(
        tags=['projects'],
        summary='更新项目状态',
        description='更新指定项目的状态（如取消、完成等）',
        request=ProjectStatusUpdateSerializer,
        responses={
            200: ProjectDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    upload_tender_file=extend_schema(
        tags=['projects'],
        summary='上传招标文件',
        description='为指定项目上传招标文件',
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary'}
                },
                'required': ['file']
            }
        },
        responses={
            200: ProjectDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    delete_tender_file=extend_schema(
        tags=['projects'],
        summary='删除招标文件',
        description='删除指定项目的招标文件',
        responses={
            200: ProjectDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    get_tender_file=extend_schema(
        tags=['projects'],
        summary='获取招标文件信息',
        description='获取指定项目的招标文件信息，包含预签名URL',
        responses={
            200: ProjectDetailSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class ProjectViewSet(viewsets.ModelViewSet):
    """项目视图集"""
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)  # 添加文件解析器

    # 过滤器： 使用Django_filters自带的过滤器， 搜索过滤器， 排序过滤器
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # 过滤器字段，DjangoFilterBackend，自动处理字段名映射
    filterset_fields = ['project_type', 'starred']
    # 搜索字段 - 使用统一的search参数，不存在命名转换
    search_fields = ['project_name', 'tenderee', 'bidder']

    # 移除 ordering_fields 映射，直接使用模型字段名
    ordering_fields = [
        'project_name','project_type','tenderee','bidder',
        'starred','create_time','last_update_time'
    ]
    ordering = ['-create_time']
    
    def get_queryset(self):
        """获取查询集"""
        return Project.objects.filter(creator=self.request.user)
    
    def get_serializer_class(self):
        """ 根据不同的操作返回不同的序列化器 """
        if self.action == 'create':
            return ProjectCreateSerializer
        elif self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['update', 'partial_update']:
            return ProjectUpdateSerializer
        elif self.action == 'update_status':
            return ProjectStatusUpdateSerializer
        return ProjectDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """重写创建方法，添加调试信息"""
        logger.info(f"创建项目请求数据: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        logger.info(f"序列化器: {serializer.__class__.__name__}")
        
        if serializer.is_valid():
            logger.info(f"验证后的数据: {serializer.validated_data}")
            try:
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            except Exception as e:
                logger.error(f"创建项目时发生错误: {str(e)}", exc_info=True)
                raise
        else:
            logger.info(f"验证错误: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        """创建项目时自动设置创建者"""
        logger.info("执行 perform_create")
        try:
            instance = serializer.save(creator=self.request.user)
            logger.info(f"项目已创建: {instance.id}")
        except Exception as e:
            logger.error(f"保存项目时发生错误: {str(e)}", exc_info=True)
            raise
    
    # 改造方法： 修改删除的控制条件 - 只能删除已取消的项目 
    def destroy(self, request, *args, **kwargs):
        """ 删除项目时的自定义逻辑 """ 
        project = self.get_object()

        if project.status not in [ProjectStatus.CANCELLED]:
            return Response(
                {"detail": "只能删除已取消的项目"},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


    # 自定义方法：更新项目状态
    # 通过@action装饰器，drf自动为update_status方法构造了路由路径 /api/projects/{pk}/update_status/
    # detail=True，指定该动作是基于单个项目对象的
    # methods=['patch']，指定该动作只支持前端PATCH请求
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """ 更新项目状态的自定义动作 """
        project = self.get_object()
        serializer = self.get_serializer(
            project, 
            data=request.data, 
            partial=True,
            context={'request': request}
            )
        if serializer.is_valid():
            serializer.save()
            return Response(ProjectDetailSerializer(project).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        """重写retrieve方法，支持生成预签名URL"""
        instance = self.get_object()
        context = {
            'request': request,
            'generate_presigned_url': request.query_params.get('presigned') == 'true'
        }
        serializer = self.get_serializer(instance, context=context)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_tender_file(self, request, pk=None):
        """上传招标文件"""
        project = self.get_object()
        
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response(
                {'error': '没有文件'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 添加文件大小限制 (100MB)
        max_size = 100 * 1024 * 1024
        if file_obj.size > max_size:
            return Response(
                {'error': '文件大小超过限制(100MB)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 检查文件类型（可选）
        allowed_types = ['application/pdf', 'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if file_obj.content_type not in allowed_types:
            return Response(
                {'error': '只支持PDF和Word文档'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 删除旧文件（如果存在）
            if project.tender_file:
                project.delete_tender_file()
            
            # 保存新文件
            project.tender_file = file_obj
            project.save(update_fields=['tender_file'])
            
            logger.info(f"招标文件上传成功: project_id={project.id}, filename={file_obj.name}")
            
            # 返回更新后的项目信息
            context = {'request': request, 'generate_presigned_url': True}
            serializer = ProjectDetailSerializer(project, context=context)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"招标文件上传失败: project_id={project.id}, error={str(e)}")
            return Response(
                {'error': '文件上传失败'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['delete'])
    def delete_tender_file(self, request, pk=None):
        """删除招标文件"""
        project = self.get_object()
        
        if not project.tender_file:
            return Response(
                {'error': '项目没有招标文件'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            success = project.delete_tender_file()
            if success:
                logger.info(f"招标文件删除成功: project_id={project.id}")
                context = {'request': request}
                serializer = ProjectDetailSerializer(project, context=context)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': '文件删除失败'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            logger.error(f"招标文件删除失败: project_id={project.id}, error={str(e)}")
            return Response(
                {'error': '文件删除失败'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def get_tender_file(self, request, pk=None):
        """获取招标文件信息"""
        project = self.get_object()
        
        if not project.tender_file:
            return Response(
                {'error': '项目没有招标文件'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        context = {
            'request': request,
            'generate_presigned_url': True  # 总是生成预签名URL
        }
        serializer = ProjectDetailSerializer(project, context=context)
        return Response(serializer.data)


