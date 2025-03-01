from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project, ProjectHistory
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    ProjectStageUpdateSerializer,
    ProjectHistorySerializer
)
from drf_spectacular.utils import extend_schema, OpenApiParameter, extend_schema_view, OpenApiTypes, OpenApiExample
import logging

# 获取logger实例
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
    update_stage=extend_schema(
        tags=['projects'],
        summary='更新项目状态',
        description='更新指定项目的状态信息',
        request=ProjectStageUpdateSerializer,
        responses={
            200: ProjectDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    histories=extend_schema(
        tags=['projects'],
        summary='获取项目历史记录',
        description='获取指定项目的所有状态变更历史记录',
        responses={
            200: ProjectHistorySerializer(many=True),
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class ProjectViewSet(viewsets.ModelViewSet):
    """
    项目视图集，提供完整的CRUD功能
    """
    permission_classes = [IsAuthenticated]

    # 过滤器： 使用Django_filters自带的过滤器， 搜索过滤器， 排序过滤器
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # 过滤器字段，DjangoFilterBackend，自动处理字段名映射
    filterset_fields = ['current_stage', 'project_type', 'is_urgent']
    # 搜索字段 - 使用统一的search参数，不存在命名转换
    search_fields = ['project_code', 'project_name', 'tenderee', 'bidder']

    # 移除 ordering_fields 映射，直接使用模型字段名
    ordering_fields = [
        'project_name',
        'project_type',
        'tenderee',
        'bidder',
        'current_stage',
        'is_urgent',
        'bid_deadline',
        'create_time',
        'last_update_time'
    ]
    ordering = ['-create_time']

    def get_queryset(self):
        """
        获取查询集，只返回当前用户创建的项目
        """
        user = self.request.user
        logger.info(f"获取查询集，只返回当前用户创建的项目: {user.username} (ID: {user.id})")
        queryset = Project.objects.filter(creator=user)
        logger.info(f"查询集返回 {queryset.count()} 个项目")
        return queryset

    def get_serializer_class(self):
        """
        根据不同的操作返回不同的序列化器
        """
        logger.info(f"根据不同的操作返回不同的序列化器: {self.action}")
        if self.action == 'create':
            return ProjectCreateSerializer
        elif self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['update', 'partial_update']:
            return ProjectUpdateSerializer
        elif self.action == 'update_stage':
            return ProjectStageUpdateSerializer
        return ProjectDetailSerializer

    def list(self, request, *args, **kwargs):
        """获取项目列表"""
        logger.info(f"获取项目列表， 过滤条件: {request.query_params}")
        
        # 移除不必要的序列化器验证
        response = super().list(request, *args, **kwargs)
        logger.info(f"查询集返回 {len(response.data)} 个项目")
        return response

    def create(self, request, *args, **kwargs):
        """创建新项目"""
        logger.info(f"创建新项目， 录入数据: {request.data}")

        # 添加序列化器验证的详细日志
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"创建项目数据验证失败，错误详情: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        response = super().create(request, *args, **kwargs)
        logger.info(f"创建新项目成功， 返回项目ID: {response.data.get('id')}")
        return response

    def perform_create(self, serializer):
        """
        创建项目时自动设置创建者
        """
        try:
            logger.info(f"创建新项目， 设置创建者: {self.request.user.phone}")
            serializer.save(creator=self.request.user)
            logger.info("创建新项目成功")
        except Exception as e:
            logger.error(f"创建项目时发生错误: {str(e)}")
            raise

    def retrieve(self, request, *args, **kwargs):
        """获取单个项目详情"""
        logger.info(f"获取单个项目详情， 项目ID: {kwargs.get('pk')}")
        
        response = super().retrieve(request, *args, **kwargs)
        logger.info(f"查询集返回项目: {response.data.get('id')}")
        return response

    @action(detail=True, methods=['patch'])
    def update_stage(self, request, pk=None):
        """
        更新项目状态的自定义动作
        """
        project = self.get_object()
        logger.info(f"更新项目状态， 项目ID: {project.id}, 录入数据: {request.data}")
        
        serializer = self.get_serializer(project, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            logger.info(f"更新项目状态成功， 项目ID: {project.id}, 状态: {request.data.get('currentStage')}")
            return Response(ProjectDetailSerializer(project).data)
        
        logger.warning(f"更新项目状态失败， 项目ID: {project.id}, 错误: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True)
    def histories(self, request, pk=None):
        """
        获取项目的状态历史记录
        """
        project = self.get_object()
        logger.info(f"获取项目状态历史记录， 项目ID: {project.id}")
        
        histories = ProjectHistory.objects.filter(project=project)
        serializer = ProjectHistorySerializer(histories, many=True)
        logger.info(f"查询集返回 {len(serializer.data)} 个状态历史记录")
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        """更新项目信息"""
        logger.info(f"更新项目信息， 项目ID: {kwargs.get('pk')}, 录入数据: {request.data}")

        # 添加序列化器验证的详细日志
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            logger.error(f"更新项目数据验证失败，错误详情: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        response = super().update(request, *args, **kwargs)
        logger.info(f"更新项目信息成功， 项目ID: {kwargs.get('pk')}")
        return response

    def destroy(self, request, *args, **kwargs):
        """
        删除项目时的自定义逻辑
        """
        try: 
            project = self.get_object()
            logger.info(f"尝试删除项目: {project.id} (当前状态: {project.current_stage})")
        
            if project.current_stage not in [Project.ProjectStatus.CANCELLED]:
                logger.warning(f"无法删除项目 {project.id} - 无效状态: {project.current_stage}")
                return Response(
                    {"detail": "只能删除已取消的项目"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"删除项目: {project.id}")
            response = super().destroy(request, *args, **kwargs)
            logger.info(f"删除项目成功: {project.id}")
            return response
        except Exception as e:
            logger.error(f"删除项目时发生错误: {str(e)}")
            return Response(
                {"detail": "删除项目时发生错误"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
