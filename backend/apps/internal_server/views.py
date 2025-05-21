from rest_framework import viewsets, mixins, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.projects.models import (
    Project
)
from apps.internal_server.serializers import (
    ProjectInternalSerializer,
    TaskInternalSerializer
)
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
import logging


logger = logging.getLogger(__name__)

# 使用GenericViewSet，而不是ModelViewSet，这样就只暴露自定义的方法，而不会由默认的CURD的方法。
class ProjectInternalViewSet(viewsets.GenericViewSet):
    """项目内部视图集"""
    queryset = Project.objects.all()
    serializer_class = ProjectInternalSerializer
    permission_classes = []

    @action(detail=True, methods=['get'], permission_classes=[])
    def get_tender_file_url(self, request, pk=None):
        """ 获取项目招标文件提取信息 """
        project = self.get_object()
        
        # 获取与项目关联的文件记录
        from apps.files.models import FileRecord
        files = FileRecord.objects.filter(project=project)
        
        if not files.exists():
            return Response({"detail": "该项目没有关联的招标文件"}, status=status.HTTP_404_NOT_FOUND)
        
        # 生成文件URL列表
        file_urls = []
        for file in files:
            # 获取签名URL，默认有效期为1小时
            presigned_url = file.get_presigned_url()
            if presigned_url:
                file_urls.append({
                    "id": str(file.id),
                    "name": file.name,
                    "type": file.type,
                    "url": presigned_url,
                    "size": file.size,
                    "mime_type": file.mime_type
                })
        
        return Response({"files": file_urls})

    









