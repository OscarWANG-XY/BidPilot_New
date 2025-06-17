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









