from rest_framework import viewsets, mixins, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from ..models import (
    ProjectChangeHistory, StageChangeHistory, TaskChangeHistory,
)
from ..serializers import (
    ProjectChangeHistorySerializer, StageChangeHistorySerializer, TaskChangeHistorySerializer
    
)
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
import logging

logger = logging.getLogger(__name__)

logger.info(f"运行views.py")



@extend_schema_view(
    list=extend_schema(
        tags=['project-change-history'],
        summary='获取项目变更历史列表',
        description='获取项目的所有变更历史记录列表',
        responses={
            200: ProjectChangeHistorySerializer(many=True),
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['project-change-history'],
        summary='获取项目变更历史详情',
        description='获取特定的项目变更历史记录详情',
        responses={
            200: ProjectChangeHistorySerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class ProjectChangeHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    项目变更历史视图集，只提供只读功能
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectChangeHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'field_name', 'operation_id']
    search_fields = ['field_name', 'old_value', 'new_value', 'remarks']
    ordering_fields = ['changed_at', 'field_name']
    ordering = ['-changed_at']
    
    def get_queryset(self):
        """
        获取查询集，只返回当前用户可访问的项目的变更历史
        """
        queryset = ProjectChangeHistory.objects.filter(project__creator=self.request.user)
        logger.info(f"ProjectChangeHistory queryset count: {queryset.count()}")
        logger.info(f"Current user: {self.request.user}")
        
        # 检查是否有任何记录
        all_records = ProjectChangeHistory.objects.all()
        logger.info(f"Total ProjectChangeHistory records: {all_records.count()}")
        return queryset

@extend_schema_view(
    list=extend_schema(
        tags=['stage-change-history'],
        summary='获取阶段变更历史列表',
        description='获取项目阶段的所有变更历史记录列表',
        responses={
            200: StageChangeHistorySerializer(many=True),
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['stage-change-history'],
        summary='获取阶段变更历史详情',
        description='获取特定的阶段变更历史记录详情',
        responses={
            200: StageChangeHistorySerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class StageChangeHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    阶段变更历史视图集，只提供只读功能
    """
    permission_classes = [IsAuthenticated]
    serializer_class = StageChangeHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'stage', 'field_name', 'operation_id']
    search_fields = ['field_name', 'old_value', 'new_value', 'remarks']
    ordering_fields = ['changed_at', 'field_name']
    ordering = ['-changed_at']
    
    def get_queryset(self):
        """
        获取查询集，只返回当前用户可访问的项目的阶段变更历史
        """
        return StageChangeHistory.objects.filter(project__creator=self.request.user)

@extend_schema_view(
    list=extend_schema(
        tags=['task-change-history'],
        summary='获取任务变更历史列表',
        description='获取项目任务的所有变更历史记录列表',
        responses={
            200: TaskChangeHistorySerializer(many=True),
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['task-change-history'],
        summary='获取任务变更历史详情',
        description='获取特定的任务变更历史记录详情',
        responses={
            200: TaskChangeHistorySerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class TaskChangeHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    任务变更历史视图集，只提供只读功能
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TaskChangeHistorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'stage', 'task', 'task_type', 'field_name', 'operation_id', 'is_complex_field']
    search_fields = ['field_name', 'old_value', 'new_value', 'change_summary', 'remarks']
    ordering_fields = ['changed_at', 'field_name', 'task_type']
    ordering = ['-changed_at']
    
    def get_queryset(self):
        """
        获取查询集，只返回当前用户可访问的项目的任务变更历史
        """
        return TaskChangeHistory.objects.filter(project__creator=self.request.user)