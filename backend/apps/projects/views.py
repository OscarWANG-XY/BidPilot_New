from rest_framework import viewsets, mixins, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from .models import (
    Project, ProjectStage, 
    BaseTask,TenderFileUploadTask,DocxExtractionTask, DocxTreeBuildTask, 
    ProjectChangeHistory, StageChangeHistory, TaskChangeHistory,
    ProjectStatus
)
from .serializers import (
    ProjectListSerializer, ProjectDetailSerializer, ProjectCreateSerializer, ProjectUpdateSerializer, ProjectStatusUpdateSerializer, ProjectActiveStageUpdateSerializer,
    ProjectStageDetailSerializer, ProjectStageUpdateSerializer,
    BaseTaskListSerializer, BaseTaskDetailSerializer, BaseTaskUpdateSerializer,
    TenderFileUploadTaskListSerializer, TenderFileUploadTaskDetailSerializer, TenderFileUploadTaskUpdateSerializer,
    DocxExtractionTaskListSerializer, DocxExtractionTaskDetailSerializer, DocxExtractionTaskUpdateSerializer,
    DocxTreeBuildTaskListSerializer, DocxTreeBuildTaskDetailSerializer, DocxTreeBuildTaskUpdateSerializer,
    ProjectChangeHistorySerializer, StageChangeHistorySerializer, TaskChangeHistorySerializer
    
)
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
import logging

logger = logging.getLogger(__name__)

logger.info(f"运行views.py")

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
    update_active_stage=extend_schema(
        tags=['projects'],
        summary='更新项目当前活动阶段',
        description='更新指定项目当前活动阶段',
        request=ProjectActiveStageUpdateSerializer,
        responses={
            200: ProjectDetailSerializer,
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
    filterset_fields = ['current_active_stage', 'project_type', 'is_urgent']
    # 搜索字段 - 使用统一的search参数，不存在命名转换
    search_fields = ['project_name', 'tenderee', 'bidder']

    # 移除 ordering_fields 映射，直接使用模型字段名
    ordering_fields = [
        'project_name','project_type','tenderee','bidder',
        'current_active_stage','is_urgent','bid_deadline',
        'create_time','last_update_time'
    ]
    ordering = ['-create_time']


    def get_queryset(self):
        """
        获取查询集，只返回当前用户创建的项目
        """
        return Project.objects.filter(creator=self.request.user)

    def get_serializer_class(self):
        """ 根据不同的操作返回不同的序列化器 """
        if self.action == 'create':
            return ProjectCreateSerializer
        elif self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['update', 'partial_update']:
            return ProjectUpdateSerializer
        elif self.action == 'update_active_stage':
            return ProjectActiveStageUpdateSerializer
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

    @action(detail=True, methods=['patch'])
    def update_active_stage(self, request, pk=None):
        """ 更新项目当前活动阶段 """
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
    upload_task=extend_schema(
        tags=['project-stages'],
        summary='获取指定项目阶段的招标文件上传任务',
        description='获取指定项目阶段的招标文件上传任务',
        request={
            'GET': None,  # GET 请求不需要请求体
            'PUT': TenderFileUploadTaskUpdateSerializer,
            'PATCH': TenderFileUploadTaskUpdateSerializer,
        },
        responses={
            200: TenderFileUploadTaskDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        },
        methods=['GET', 'PUT', 'PATCH']
    ),
    extraction_task=extend_schema(
        tags=['project-stages'],
        summary='获取指定项目阶段的文档提取任务',
        description='获取指定项目阶段的文档提取任务',
        request={
            'GET': None,  # GET 请求不需要请求体
            'PUT': DocxExtractionTaskUpdateSerializer,
            'PATCH': DocxExtractionTaskUpdateSerializer,
        },
        responses={
            200: DocxExtractionTaskDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        },
        methods=['GET', 'PUT', 'PATCH']
    ),  
    tree_build_task=extend_schema(
        tags=['project-stages'],
        summary='获取指定项目阶段的文档树构建任务',
        description='获取指定项目阶段的文档树构建任务',
        request={
            'GET': None,  # GET 请求不需要请求体
            'PUT': DocxTreeBuildTaskUpdateSerializer,
            'PATCH': DocxTreeBuildTaskUpdateSerializer,
        },
        responses={
            200: DocxTreeBuildTaskDetailSerializer,
            400: OpenApiTypes.OBJECT,   
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        },
        methods=['GET', 'PUT', 'PATCH']
    )
)
class ProjectStageViewSet(mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin,  # 目前还用不到update, 注意不存在partial_update mixin
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


    # 自定义方法：获取项目阶段下的任务列表
    @action(detail=True, methods=['get', 'put', 'patch'])
    def upload_task(self, request, project_pk=None, pk=None):
        """ 获取项目阶段下的任务列表 """
        stage = self.get_object()

        # 获取该阶段的 招标文件上传 任务
        try:
            task = TenderFileUploadTask.objects.get(stage=stage)
        except TenderFileUploadTask.DoesNotExist:
            return Response({"detail": "招标文件上传任务不存在"}, status=status.HTTP_404_NOT_FOUND)
        if request.method == 'GET':
            serializer = TenderFileUploadTaskDetailSerializer(task)
            return Response(serializer.data)
        
        serializer = TenderFileUploadTaskUpdateSerializer(
            task, 
            data=request.data, 
            partial=True,
            context={'request': request}
            )
        if serializer.is_valid():
            serializer.save()
            return Response(TenderFileUploadTaskDetailSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    @action(detail=True, methods=['get', 'put', 'patch'])
    def extraction_task(self, request, project_pk=None, pk=None):
        """获取或更新阶段的文档提取任务"""
        stage = self.get_object()
        
        # 获取该阶段的文档提取任务
        try:
            task = DocxExtractionTask.objects.get(stage=stage)
        except DocxExtractionTask.DoesNotExist:
            # 如果任务不存在，可以选择创建一个或返回404
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


    @action(detail=True, methods=['get', 'put', 'patch'])
    def tree_build_task(self, request, project_pk=None, pk=None):
        """获取或更新阶段的文档树构建任务"""
        stage = self.get_object()
        
        # 获取该阶段的文档提取任务
        try:
            task = DocxTreeBuildTask.objects.get(stage=stage)
        except DocxTreeBuildTask.DoesNotExist:
            # 如果任务不存在，可以选择创建一个或返回404
            return Response({"detail": "此阶段没有文档树构建任务"}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'GET':
            serializer = DocxTreeBuildTaskDetailSerializer(task)
            return Response(serializer.data)
        
        # 处理更新请求
        serializer = DocxTreeBuildTaskUpdateSerializer(
            task, 
            data=request.data, 
            partial=request.method == 'PATCH',
            context={'request': request}
            )
        if serializer.is_valid():
            serializer.save()
            return Response(DocxTreeBuildTaskDetailSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



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
        #return ProjectChangeHistory.objects.filter(project__creator=self.request.user)
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