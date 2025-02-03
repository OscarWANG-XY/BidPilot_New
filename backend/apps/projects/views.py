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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['current_stage', 'project_type', 'is_urgent']
    search_fields = ['project_code', 'project_name', 'tenderee', 'bidder']
    ordering_fields = ['create_time', 'bid_deadline', 'last_update_time']
    ordering = ['-create_time']  # 默认按创建时间倒序

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
        response = super().list(request, *args, **kwargs)
        logger.info(f"查询集返回 {len(response.data)} 个项目")
        return response

    def create(self, request, *args, **kwargs):
        """创建新项目"""
        logger.info(f"创建新项目， 录入数据: {request.data}")
        response = super().create(request, *args, **kwargs)
        logger.info(f"创建新项目成功， 返回项目ID: {response.data.get('id')}")
        return response

    def retrieve(self, request, *args, **kwargs):
        """获取单个项目详情"""
        logger.info(f"获取单个项目详情， 项目ID: {kwargs.get('pk')}")
        response = super().retrieve(request, *args, **kwargs)
        logger.info(f"查询集返回项目: {response.data.get('project_code')}")
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
            logger.info(f"更新项目状态成功， 项目ID: {project.id}, 状态: {request.data.get('stage')}")
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

    def perform_create(self, serializer):
        """
        创建项目时自动设置创建者
        """
        logger.info(f"创建新项目， 设置创建者: {self.request.user.username}")
        serializer.save()
        logger.info("创建新项目成功")

    def update(self, request, *args, **kwargs):
        """更新项目信息"""
        logger.info(f"更新项目信息， 项目ID: {kwargs.get('pk')}, 录入数据: {request.data}")
        response = super().update(request, *args, **kwargs)
        logger.info(f"更新项目信息成功， 项目ID: {kwargs.get('pk')}")
        return response

    def destroy(self, request, *args, **kwargs):
        """
        删除项目时的自定义逻辑
        """
        project = self.get_object()
        logger.info(f"尝试删除项目: {project.id} (当前状态: {project.current_stage})")
        
        if project.current_stage not in [Project.ProjectStage.DRAFT, Project.ProjectStage.CANCELLED]:
            logger.warning(f"无法删除项目 {project.id} - 无效状态: {project.current_stage}")
            return Response(
                {"detail": "只能删除草稿或已取消的项目"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        logger.info(f"删除项目: {project.id}")
        response = super().destroy(request, *args, **kwargs)
        logger.info(f"删除项目成功: {project.id}")
        return response
