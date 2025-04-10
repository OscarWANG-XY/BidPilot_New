from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from ..models import Task
from ..serializers import TaskDetailSerializer, TaskUpdateSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
import logging

logger = logging.getLogger(__name__)

@extend_schema_view(
    retrieve=extend_schema(
        tags=['tasks'],
        summary='获取任务详情',
        description='获取指定任务的详细信息',
        responses={
            200: TaskDetailSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    partial_update=extend_schema(
        tags=['tasks'],
        summary='更新任务信息',
        description='更新指定任务的详细信息',
        request=TaskUpdateSerializer,
        responses={
            200: TaskDetailSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
)
class TaskViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    任务视图集，提供任务的读取和更新功能
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """
        根据请求方法返回不同的序列化器
        """
        if self.request.method in ['PUT', 'PATCH']:
            return TaskUpdateSerializer
        return TaskDetailSerializer

    def get_queryset(self):
        """
        获取查询集，只返回当前用户创建的项目中的任务
        注意：多层嵌套过滤
        由于stage_pk不是id, 而是stage_type, 所以我们需要显性改写get_queryset()
        """
        # 首先过滤出当前用户创建的项目中的任务
        queryset = Task.objects.filter(stage__project__creator=self.request.user)
        
        # 如果提供了项目ID，进一步过滤
        # project_pk是由嵌套路由里 lookup='project' 定义出来的，kwarg就是project_pk 
        project_pk = self.kwargs.get('project_pk')
        if project_pk:
            queryset = queryset.filter(stage__project_id=project_pk)
            
        # 如果提供了阶段ID，继续过滤
        # stage_pk是由嵌套路由里 lookup='stage' 定义出来的，kwarg就是stage_pk 
        stage_pk = self.kwargs.get('stage_pk')
        if stage_pk:
            # 注意下面是用 stage__stage_type 而不是 stage__id
            queryset = queryset.filter(stage__stage_type=stage_pk)
            
        return queryset
    

    def get_object(self):
        """
        根据项目任务类型获取任务对象，而不是使用任务ID
        注意：这里的get_object() 不能并入到get_queryset()中, 因为我们需要改写最终的pk查找是task_type, 而不是task_id
        所以无论如何这个get_object() 不能省略，如果省略了，那么默认在get_queryset()之上继续按task_id查找，这个不是我们要的。 
        """
        task_type = self.kwargs['pk']  # 在URL中，任务类型会作为pk参数传入
        
        queryset = self.get_queryset()
        obj = get_object_or_404(
            queryset,
            type=task_type  # 在这里进行了改写
        )
        return obj
    
    # 通过以上的get_queryset() 和get_object()的改写，我们最终找到了对应类型的task对象。 
    # 找到这个对象以后，我们就可以开始展开一下的视图函数的操作了。 
    # 


    def partial_update(self, request, *args, **kwargs):
        """
        更新任务
        """
        task = self.get_object()
        serializer = self.get_serializer(
            task, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            # 返回更新后的任务详情
            return Response(TaskDetailSerializer(task).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)