from rest_framework import viewsets, mixins, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.projects.models import (
    Project
)
from apps.internal_server.serializers import (
    ProjectInternalSerializer,
    TaskInternalSerializer,
    ProjectAgentStorageSerializer
)
from apps.internal_server.models import ProjectAgentStorage
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
import logging


logger = logging.getLogger(__name__)



class ProjectAgentStorageViewSet(viewsets.GenericViewSet):
    queryset = ProjectAgentStorage.objects.all()
    serializer_class = ProjectAgentStorageSerializer
    permission_classes = []

    @action(detail=True, methods=['get'], permission_classes=[])
    def get_tender_file_url(self, request, pk=None):
        """ 获取项目招标文件提取信息 """
        # 直接根据项目ID获取项目对象，而不是通过get_object()
        try:
            project = Project.objects.get(id=pk)
        except Project.DoesNotExist:
            return Response({"detail": "项目不存在"}, status=status.HTTP_404_NOT_FOUND)
        
        # 获取与项目关联的文件记录
        from apps.files.models import FileRecord
        files = FileRecord.objects.filter(project=project)
        
        if not files.exists():
            return Response({"detail": "该项目没有关联的招标文件"}, status=status.HTTP_404_NOT_FOUND)
        
        # 生成文件URL列表
        tender_file = []
        for file in files:
            # 获取签名URL，默认有效期为1小时
            presigned_url = file.get_presigned_url()
            if presigned_url:
                tender_file.append({
                    "id": str(file.id),
                    "name": file.name,
                    "type": file.type,
                    "url": presigned_url,
                    "size": file.size,
                    "mime_type": file.mime_type
                })
        
        return Response({"tender_file": tender_file})


    def _get_or_create_storage(self, project):
        """获取或创建ProjectAgentStorage实例"""
        storage, created = ProjectAgentStorage.objects.get_or_create(
            project=project
        )
        if created:
            logger.info(f"为项目 {project.id} 创建了新的ProjectAgentStorage")
        return storage
    

    @action(detail=True, methods=['post'], permission_classes=[])
    def save_to_django(self, request, pk=None):
        """保存数据到Django服务"""
        # 直接根据项目ID获取项目对象，而不是通过get_object()
        try:
            project = Project.objects.get(id=pk)
        except Project.DoesNotExist:
            return Response({"detail": "项目不存在"}, status=status.HTTP_404_NOT_FOUND)
        
        storage = self._get_or_create_storage(project)
        data = request.data
        
        # 实际保存数据到storage对象
        for field_name, field_value in data.items():
            if hasattr(storage, field_name):
                setattr(storage, field_name, field_value)
                logger.debug(f"更新字段 {field_name} 为项目 {project.id}")
        
        # 保存到数据库
        storage.save()
        logger.info(f"成功保存数据到Django服务，项目ID: {project.id}")
        
        return Response({"message": "数据保存成功", "updated_fields": list(data.keys())})

    def retrieve(self, request, pk=None):
        """重写retrieve方法，支持字段参数查询"""
        # 直接根据项目ID获取项目对象，而不是通过get_object()
        try:
            project = Project.objects.get(id=pk)
        except Project.DoesNotExist:
            return Response({"detail": "项目不存在"}, status=status.HTTP_404_NOT_FOUND)
        
        # 获取或创建对应的存储记录
        storage = self._get_or_create_storage(project)
        
        fields = request.GET.get('fields')
        if fields:
            # 有fields参数 → 只返回指定字段
            field_list = fields.split(',')
            data = {field: getattr(storage, field, None) 
                    for field in field_list 
                    if hasattr(storage, field)}
            return Response(data)
        
        # 没有fields参数 → 返回所有字段（默认行为）
        serializer = self.get_serializer(storage)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[])
    def clear_storage(self, request, pk=None):
        """清空ProjectAgentStorage数据"""
        # 直接根据项目ID获取项目对象，而不是通过get_object()
        try:
            project = Project.objects.get(id=pk)
        except Project.DoesNotExist:
            return Response({"detail": "项目不存在"}, status=status.HTTP_404_NOT_FOUND)
        
        storage = self._get_or_create_storage(project)
        clear_data = request.data.get('clear')
        
        # 定义可清空的字段（JSON字段）
        clearable_fields = [
            'agent_state_history',
            'agent_message_history', 
            'raw_document',
            'h1_document',
            'h2h3_document',
            'intro_document',
            'final_document',
            'review_suggestions',
            'chapters_md',
            'topic_chapters_map',
            'raw_topic_todos',
            'integrated_topic_todos',
            'draft_bid_document'
        ]
        
        cleared_fields = []
        
        if not clear_data:
            # 没有clear字段 → 返回错误
            return Response({"detail": "缺少clear参数"}, status=status.HTTP_400_BAD_REQUEST)
        
        if clear_data == "all":
            # 清空所有字段
            for field_name in clearable_fields:
                setattr(storage, field_name, None)
                cleared_fields.append(field_name)
            logger.info(f"清空项目 {project.id} 的所有字段")
        
        elif isinstance(clear_data, list):
            # 清空指定字段列表
            for field_name in clear_data:
                if field_name in clearable_fields:
                    setattr(storage, field_name, None)
                    cleared_fields.append(field_name)
                    logger.debug(f"清空项目 {project.id} 的字段 {field_name}")
                else:
                    logger.warning(f"字段 {field_name} 不在可清空字段列表中")
        
        elif isinstance(clear_data, str) and clear_data != "all":
            # 清空单个指定字段
            if clear_data in clearable_fields:
                setattr(storage, clear_data, None)
                cleared_fields.append(clear_data)
                logger.debug(f"清空项目 {project.id} 的字段 {clear_data}")
            else:
                return Response({"detail": f"字段 {clear_data} 不在可清空字段列表中"}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        else:
            return Response({"detail": "clear参数格式不正确，应为'all'、字段名字符串或字段名列表"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # 保存到数据库
        storage.save()
        logger.info(f"成功清空项目 {project.id} 的数据，清空字段: {cleared_fields}")
        
        return Response({
            "message": "数据清空成功", 
            "cleared_fields": cleared_fields,
            "total_cleared": len(cleared_fields)
        })









