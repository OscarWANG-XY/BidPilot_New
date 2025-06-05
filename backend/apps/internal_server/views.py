from rest_framework import viewsets, mixins, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.projects.models import (
    Project
)
from apps.internal_server.serializers import (
    ProjectInternalSerializer,
    TaskInternalSerializer,
    StructuringAgentStorageSerializer
)
from apps.internal_server.models import StructuringAgentStorage
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiTypes
import logging


logger = logging.getLogger(__name__)

# 使用GenericViewSet，而不是ModelViewSet，这样就只暴露自定义的方法，而不会由默认的CURD的方法。
class ProjectInternalViewSet(viewsets.GenericViewSet):
    """项目内部视图集"""
    queryset = Project.objects.all()
    serializer_class = ProjectInternalSerializer
    permission_classes = []

    def _get_or_create_storage(self, project):
        """获取或创建StructuringAgentStorage实例"""
        storage, created = StructuringAgentStorage.objects.get_or_create(
            project=project
        )
        if created:
            logger.info(f"为项目 {project.id} 创建了新的StructuringAgentStorage")
        return storage

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

    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[])
    def agent_state_history(self, request, pk=None):
        """获取或保存Agent状态历史"""
        project = self.get_object()
        storage = self._get_or_create_storage(project)
        
        if request.method == 'GET':
            return Response({
                "agent_state_history": storage.agent_state_history
            })
        
        elif request.method == 'POST':
            agent_state_history_data = request.data
            storage.agent_state_history = agent_state_history_data
            storage.save()
            logger.debug(f"成功保存agent状态历史，项目ID: {project.id}")
            return Response({
                "message": "Sucesss",
                "stored_agent_state_history": storage.agent_state_history
            })
        
        elif request.method == 'DELETE':
            storage.agent_state_history = None
            storage.save()
            logger.debug(f"成功删除agent状态历史，项目ID: {project.id}")
            return Response({
                "message": "Success"
            })

    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[])
    def agent_messages_history(self, request, pk=None):
        """获取或保存Agent消息"""
        project = self.get_object()
        storage = self._get_or_create_storage(project)
        
        if request.method == 'GET':
            return Response({
                "agent_message_history": storage.agent_message_history
            })
        
        elif request.method == 'POST':
            agent_message_data = request.data
            storage.agent_message_history = agent_message_data
            storage.save()
            logger.debug(f"成功保存agent消息，项目ID: {project.id}")
            return Response({
                "message": "Success",
                "stored_agent_message_history": storage.agent_message_history
            })
        
        elif request.method == 'DELETE':
            storage.agent_message_history = None
            storage.save()
            logger.debug(f"成功删除agent消息，项目ID: {project.id}")
            return Response({
                "message": "Success"
            })

    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[], url_path='documents/(?P<doc_name>[^/.]+)')
    def documents(self, request, pk=None, doc_name=None):
        """统一处理文档内容的获取、保存和删除"""
        project = self.get_object()
        storage = self._get_or_create_storage(project)
        
        # 验证文档类型
        valid_doc_types = ['raw_document', 
                           'h1_document', 
                           'h2h3_document', 
                           'intro_document', 
                           'final_document',
                           'review_suggestions',
                           # planning 阶段新增的文档
                           'chapters_md'
                           ]
        
        # 对于POST请求，doc_type可能来自请求体
        if request.method == 'POST' and not doc_name:
            doc_name = request.data.get('doc_name')
        
        if doc_name not in valid_doc_types:
            return Response(
                {"error": f"不支持的文档类型: {doc_name}，支持的类型: {', '.join(valid_doc_types)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 文档字段映射
        doc_field_map = {
            'raw_document': 'raw_document',
            'h1_document': 'h1_document', 
            'h2h3_document': 'h2h3_document',
            'intro_document': 'intro_document',
            'final_document': 'final_document',
            'review_suggestions':"review_suggestions",
            # planning 阶段新增的文档
            'chapters_md': 'chapters_md'
        }
        
        field_name = doc_field_map[doc_name]
        
        if request.method == 'GET':
            content = getattr(storage, field_name, None)
            return Response({"content": content})
        
        elif request.method == 'POST':
            content = request.data.get('content')
            if content is None:
                return Response(
                    {"error": "content参数是必需的"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            setattr(storage, field_name, content)
            storage.save()
            logger.debug(f"成功保存文档，项目ID: {project.id}, 文档类型: {doc_name}")
            
            return Response({
                "message": f"{doc_name} 文档保存成功"
            })
        
        elif request.method == 'DELETE':
            setattr(storage, field_name, None)
            storage.save()
            logger.debug(f"成功删除文档，项目ID: {project.id}, 文档类型: {doc_name}")
            
            return Response({
                "message": f"{doc_name} 文档删除成功"
            })


    
    
    









