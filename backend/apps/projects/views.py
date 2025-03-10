from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Project, ProjectHistory, ProjectStage, 
    BaseTask, DocxExtractionTask, DocxTreeBuildTask,
    ProjectStatus
)
from .serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    ProjectStageUpdateSerializer,
    ProjectHistorySerializer,
    ProjectStatusUpdateSerializer,
    ProjectOverviewSerializer,
    ProjectStageSerializer,
    BaseTaskSerializer,
    DocxExtractionTaskSerializer,
    DocxTreeBuildTaskSerializer
)
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
import logging

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
    overview=extend_schema(
        tags=['projects'],
        summary='获取项目阶段概览',
        description='获取指定项目的所有阶段概览信息',
        responses={
            200: ProjectOverviewSerializer,
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



    # ------------ 获取查询集，只返回当前用户创建的项目 ------------
    # 前端组件： _02_ProjectList.tsx 组件
    # 前端API： api/projects_api.ts 文件的 getAllProjects 方法 
    # 前端HOOK： hooks/useProjects.ts 文件的 projecsQuery 方法 
    # 后端视图： views.py 文件的 ProjectViewSet 类中的 get_queryset 方法 
    # 后端序列化器： serializers.py 文件的 ProjectListSerializer 类
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
        elif self.action == 'update_stage':
            return ProjectStageUpdateSerializer
        elif self.action == 'update_status':
            return ProjectStatusUpdateSerializer
        elif self.action == 'overview':
            return ProjectOverviewSerializer
        return ProjectDetailSerializer



    # ------------ 创建项目 ------------
    # 前端组件： _01_CreateProject.tsx 组件
    # 前端API： api/projects_api.ts 文件的 CreateProject 方法 
    # 前端HOOK： hooks/useProjects.ts 文件的 createProject 方法 
    # 后端视图： views.py 文件的 ProjectViewSet 类中的 create 方法 
    # 后端序列化器： serializers.py 文件的 ProjectCreateSerializer 类
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
    @action(detail=True, methods=['patch'])
    def update_stage(self, request, pk=None):
        """ 更新项目状态的自定义动作 """
        project = self.get_object()
        serializer = self.get_serializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProjectDetailSerializer(project).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    # 自定义方法：获取项目的状态历史记录
    @action(detail=True)
    def histories(self, request, pk=None):
        """ 获取项目的状态历史记录 """
        project = self.get_object()
        histories = ProjectHistory.objects.filter(project=project)
        serializer = ProjectHistorySerializer(histories, many=True)
        return Response(serializer.data)


    # 自定义方法：更新项目状态（如取消、完成等）
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """ 更新项目状态的自定义动作 """
        project = self.get_object()
        serializer = self.get_serializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProjectDetailSerializer(project).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    # 添加新的自定义方法：获取项目阶段概览
    # 前端组件： _05_ProjectPhasesOverview.tsx 组件
    # 前端API： api/projects_api.ts 文件的 getProjectOverview 方法 
    # 前端HOOK： hooks/useProjects.ts 文件的 getProjectOverviewQuery 方法 
    # 后端视图： views.py 文件的 ProjectViewSet 类中的 get_project_overview 方法 
    # 后端序列化器： serializers.py 文件的 ProjectOverviewSerializer 类
    @action(detail=True)
    def overview(self, request, pk=None):
        """ 获取项目的阶段概览信息 """
        project = self.get_object()
        serializer = self.get_serializer(project)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        tags=['project-stages'],
        summary='获取项目阶段列表',
        description='获取指定项目的所有阶段列表',
        responses={
            200: ProjectStageSerializer(many=True),
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['project-stages'],
        summary='获取项目阶段详情',
        description='获取指定项目阶段的详细信息',
        responses={
            200: ProjectStageSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    update=extend_schema(
        tags=['project-stages'],
        summary='更新项目阶段',
        description='更新指定项目阶段的信息',
        request=ProjectStageSerializer,
        responses={
            200: ProjectStageSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    partial_update=extend_schema(
        tags=['project-stages'],
        summary='部分更新项目阶段',
        description='部分更新指定项目阶段的信息',
        request=ProjectStageSerializer,
        responses={
            200: ProjectStageSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class ProjectStageViewSet(viewsets.ModelViewSet):
    """
    项目阶段视图集，提供项目阶段的CRUD功能
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectStageSerializer
    
    def get_queryset(self):
        """
        获取查询集，只返回当前用户创建的项目的阶段
        """
        return ProjectStage.objects.filter(project__creator=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        禁用直接创建阶段，阶段应该通过项目创建时自动生成
        """
        return Response(
            {"detail": "项目阶段不能直接创建，应通过项目创建时自动生成"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        禁用直接删除阶段
        """
        return Response(
            {"detail": "项目阶段不能直接删除"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )


@extend_schema_view(
    list=extend_schema(
        tags=['tasks'],
        summary='获取任务列表',
        description='获取指定项目阶段的所有任务列表',
        responses={
            200: BaseTaskSerializer(many=True),
            401: OpenApiTypes.OBJECT
        }
    ),
    create=extend_schema(
        tags=['tasks'],
        summary='创建新任务',
        description='创建一个新的任务记录',
        request=BaseTaskSerializer,
        responses={
            201: BaseTaskSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['tasks'],
        summary='获取任务详情',
        description='获取指定任务的详细信息',
        responses={
            200: BaseTaskSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    update=extend_schema(
        tags=['tasks'],
        summary='更新任务信息',
        description='更新指定任务的全部信息',
        request=BaseTaskSerializer,
        responses={
            200: BaseTaskSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    partial_update=extend_schema(
        tags=['tasks'],
        summary='部分更新任务',
        description='部分更新指定任务的信息',
        request=BaseTaskSerializer,
        responses={
            200: BaseTaskSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    destroy=extend_schema(
        tags=['tasks'],
        summary='删除任务',
        description='删除指定的任务',
        responses={
            204: None,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class BaseTaskViewSet(viewsets.ModelViewSet):
    """
    基础任务视图集，提供任务的CRUD功能
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BaseTaskSerializer
    
    def get_queryset(self):
        """
        获取查询集，只返回当前用户创建的项目的任务
        """
        return BaseTask.objects.filter(stage__project__creator=self.request.user)
    
    def perform_create(self, serializer):
        """创建任务时进行额外验证"""
        # 确保用户只能为自己的项目阶段创建任务
        stage_id = self.request.data.get('stage')
        try:
            stage = ProjectStage.objects.get(id=stage_id)
            if stage.project.creator != self.request.user:
                raise PermissionError("您没有权限为此项目阶段创建任务")
            serializer.save()
        except ProjectStage.DoesNotExist:
            raise NotFound("指定的项目阶段不存在")


@extend_schema_view(
    list=extend_schema(
        tags=['document-extraction-tasks'],
        summary='获取文档提取任务列表',
        description='获取指定项目阶段的所有文档提取任务列表',
        responses={
            200: DocxExtractionTaskSerializer(many=True),
            401: OpenApiTypes.OBJECT
        }
    ),
    create=extend_schema(
        tags=['document-extraction-tasks'],
        summary='创建新文档提取任务',
        description='创建一个新的文档提取任务记录',
        request=DocxExtractionTaskSerializer,
        responses={
            201: DocxExtractionTaskSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['document-extraction-tasks'],
        summary='获取文档提取任务详情',
        description='获取指定文档提取任务的详细信息',
        responses={
            200: DocxExtractionTaskSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    update=extend_schema(
        tags=['document-extraction-tasks'],
        summary='更新文档提取任务信息',
        description='更新指定文档提取任务的全部信息',
        request=DocxExtractionTaskSerializer,
        responses={
            200: DocxExtractionTaskSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    partial_update=extend_schema(
        tags=['document-extraction-tasks'],
        summary='部分更新文档提取任务',
        description='部分更新指定文档提取任务的信息',
        request=DocxExtractionTaskSerializer,
        responses={
            200: DocxExtractionTaskSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    destroy=extend_schema(
        tags=['document-extraction-tasks'],
        summary='删除文档提取任务',
        description='删除指定的文档提取任务',
        responses={
            204: None,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class DocxExtractionTaskViewSet(viewsets.ModelViewSet):
    """
    文档提取任务视图集，提供文档提取任务的CRUD功能
    """
    permission_classes = [IsAuthenticated]
    serializer_class = DocxExtractionTaskSerializer
    
    def get_queryset(self):
        """
        获取查询集，只返回当前用户创建的项目的文档提取任务
        """
        return DocxExtractionTask.objects.filter(stage__project__creator=self.request.user)
    
    def perform_create(self, serializer):
        """创建文档提取任务时进行额外验证"""
        # 确保用户只能为自己的项目阶段创建任务
        stage_id = self.request.data.get('stage')
        try:
            stage = ProjectStage.objects.get(id=stage_id)
            if stage.project.creator != self.request.user:
                raise PermissionError("您没有权限为此项目阶段创建文档提取任务")
            serializer.save()
        except ProjectStage.DoesNotExist:
            raise NotFound("指定的项目阶段不存在")


@extend_schema_view(
    list=extend_schema(
        tags=['document-tree-tasks'],
        summary='获取文档树构建任务列表',
        description='获取指定项目阶段的所有文档树构建任务列表',
        responses={
            200: DocxTreeBuildTaskSerializer(many=True),
            401: OpenApiTypes.OBJECT
        }
    ),
    create=extend_schema(
        tags=['document-tree-tasks'],
        summary='创建新文档树构建任务',
        description='创建一个新的文档树构建任务记录',
        request=DocxTreeBuildTaskSerializer,
        responses={
            201: DocxTreeBuildTaskSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['document-tree-tasks'],
        summary='获取文档树构建任务详情',
        description='获取指定文档树构建任务的详细信息',
        responses={
            200: DocxTreeBuildTaskSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    update=extend_schema(
        tags=['document-tree-tasks'],
        summary='更新文档树构建任务信息',
        description='更新指定文档树构建任务的全部信息',
        request=DocxTreeBuildTaskSerializer,
        responses={
            200: DocxTreeBuildTaskSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    partial_update=extend_schema(
        tags=['document-tree-tasks'],
        summary='部分更新文档树构建任务',
        description='部分更新指定文档树构建任务的信息',
        request=DocxTreeBuildTaskSerializer,
        responses={
            200: DocxTreeBuildTaskSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    destroy=extend_schema(
        tags=['document-tree-tasks'],
        summary='删除文档树构建任务',
        description='删除指定的文档树构建任务',
        responses={
            204: None,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class DocxTreeBuildTaskViewSet(viewsets.ModelViewSet):
    """
    文档树构建任务视图集，提供文档树构建任务的CRUD功能
    """
    permission_classes = [IsAuthenticated]
    serializer_class = DocxTreeBuildTaskSerializer
    
    def get_queryset(self):
        """
        获取查询集，只返回当前用户创建的项目的文档树构建任务
        """
        return DocxTreeBuildTask.objects.filter(stage__project__creator=self.request.user)
    
    def perform_create(self, serializer):
        """创建文档树构建任务时进行额外验证"""
        # 确保用户只能为自己的项目阶段创建任务
        stage_id = self.request.data.get('stage')
        try:
            stage = ProjectStage.objects.get(id=stage_id)
            if stage.project.creator != self.request.user:
                raise PermissionError("您没有权限为此项目阶段创建文档树构建任务")
            serializer.save()
        except ProjectStage.DoesNotExist:
            raise NotFound("指定的项目阶段不存在")


@extend_schema_view(
    list=extend_schema(
        tags=['project-histories'],
        summary='获取项目历史记录列表',
        description='获取指定项目的所有历史记录列表',
        responses={
            200: ProjectHistorySerializer(many=True),
            401: OpenApiTypes.OBJECT
        }
    ),
    retrieve=extend_schema(
        tags=['project-histories'],
        summary='获取项目历史记录详情',
        description='获取指定项目历史记录的详细信息',
        responses={
            200: ProjectHistorySerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class ProjectHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    项目历史记录视图集，只提供只读功能
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectHistorySerializer
    
    def get_queryset(self):
        """
        获取查询集，只返回当前用户创建的项目的历史记录
        """
        return ProjectHistory.objects.filter(project__creator=self.request.user)




    