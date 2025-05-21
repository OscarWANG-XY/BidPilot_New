from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
from ..models import Project


@extend_schema_view(
    list=extend_schema(
        tags=['projects'],
        summary='获取项目招标文件列表',
        description='获取指定项目的所有招标文件列表',
        responses={
            200: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class BidlyzerViewSet(viewsets.ModelViewSet):
    """项目招标文件视图集，专供内部服务使用"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """获取查询集"""
        return Project.objects.filter(creator=self.request.user)
    
    def list(self, request, *args, **kwargs):
        """获取项目招标文件URL列表"""
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response({"detail": "必须提供项目ID"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            project = Project.objects.get(id=project_id, creator=request.user)
        except Project.DoesNotExist:
            return Response({"detail": "项目不存在"}, status=status.HTTP_404_NOT_FOUND)
            
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
