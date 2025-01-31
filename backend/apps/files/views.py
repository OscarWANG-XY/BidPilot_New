from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db import models
from .models import FileRecord
from .serializers import FileRecordSerializer, FileRecordCreateSerializer
import mimetypes
import logging
from drf_spectacular.utils import extend_schema, OpenApiParameter, extend_schema_view, OpenApiTypes, OpenApiExample

logger = logging.getLogger(__name__)

@extend_schema_view(
    list=extend_schema(
        tags=['files'],
        summary='获取文件列表',
        description='获取当前用户可访问的所有文件列表，包括：\n1. 用户自己上传的文件\n2. 用户有读取权限的文件\n3. 用户有写入权限的文件',
        responses={
            200: FileRecordSerializer(many=True),
            401: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value=[{
                    'id': 'uuid',
                    'name': 'example.pdf',
                    'size': 1024,
                    'type': 'PDF',
                    'mime_type': 'application/pdf',
                    'processing_status': 'COMPLETED',
                    'url': 'https://storage.example.com/files/example.pdf',
                    'owner': {
                        'id': 'uuid',
                        'phone': '13800138000',
                        'email': 'user@example.com',
                        'role': 'user'
                    }
                }]
            )
        ]
    ),
    create=extend_schema(
        tags=['files'],
        summary='上传文件',
        description='上传新文件并创建文件记录。支持多种文件类型，包括PDF、Word、Excel、图片等。',
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary'},
                    'remarks': {'type': 'string'}
                },
                'required': ['file']
            }
        },
        responses={
            201: FileRecordSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'id': 'uuid',
                    'name': 'example.pdf',
                    'size': 1024,
                    'type': 'PDF',
                    'mime_type': 'application/pdf',
                    'processing_status': 'COMPLETED',
                    'url': 'https://storage.example.com/files/example.pdf',
                    'owner': {
                        'id': 'uuid',
                        'phone': '13800138000',
                        'email': 'user@example.com',
                        'role': 'user'
                    }
                }
            )
        ]
    ),
    retrieve=extend_schema(
        tags=['files'],
        summary='获取文件详情',
        description='获取指定文件的详细信息。可通过 presigned=true 参数获取带签名的临时下载链接。',
        parameters=[
            OpenApiParameter(
                name='presigned',
                type=str,
                location=OpenApiParameter.QUERY,
                description='是否返回预签名URL (true/false)',
                required=False
            )
        ],
        responses={
            200: FileRecordSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    update=extend_schema(
        tags=['files'],
        summary='更新文件信息',
        description='更新文件的元数据信息，如备注等。注意：不能通过此接口更新文件内容。',
        request=FileRecordSerializer,
        responses={
            200: FileRecordSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    ),
    destroy=extend_schema(
        tags=['files'],
        summary='删除文件',
        description='删除指定的文件记录。注意：只有文件所有者才能删除文件。',
        responses={
            204: None,
            401: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT
        }
    )
)
class FileViewSet(viewsets.ModelViewSet):
    """
    文件管理的视图集，提供文件的增删改查（CRUD）操作。
    该视图集继承自 `ModelViewSet`，包含标准的 RESTful API 端点。
    """
    permission_classes = [IsAuthenticated]  # 仅允许已认证用户访问
    parser_classes = (MultiPartParser, FormParser)  # 允许上传多部分表单数据（文件上传）
    http_method_names = ['get', 'post', 'put', 'delete']  # 移除了 'patch'
    
    def get_queryset(self):
        """
        获取当前用户可访问的文件列表。
        可访问的文件包括：
        1. 用户自己上传的文件（owner）
        2. 用户有读取权限的文件（read_users）
        3. 用户有写入权限的文件（write_users）
        """
        user = self.request.user
        return FileRecord.objects.filter(
            models.Q(owner=user) |  # 用户拥有的文件
            models.Q(read_users=user) |  # 用户有读权限的文件
            models.Q(write_users=user)  # 用户有写权限的文件
        ).distinct()  # 去重，确保同一文件不会重复出现

    def get_serializer_class(self):
        """
        根据不同的操作返回不同的序列化器。
        - `create` 操作使用 `FileRecordCreateSerializer`
        - 其他操作使用 `FileRecordSerializer`
        """
        if self.action == 'create':
            return FileRecordCreateSerializer
        return FileRecordSerializer

    def list(self, request, *args, **kwargs):
        """
        获取文件列表。
        GET /api/files/
        """
        logger.info(f"User {request.user.phone} requesting file list")
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        上传文件。
        POST /api/files/
        """
        logger.info(f"用户 {request.user.phone} 正在上传文件")
        # 获取上传的文件对象
        file_obj = request.FILES.get('file')

        logger.info(f"文件为: {file_obj}，文件名: {file_obj.name}，文件大小: {file_obj.size}，文件类型: {file_obj.content_type}")

        if not file_obj:
            logger.warning(f"用户 {request.user.phone} 上传文件失败，没有文件")
            return Response(
                {'error': '没有文件'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"正在处理文件上传: {file_obj.name} (size: {file_obj.size} bytes)")

        # 生成文件基本信息
        file_data = {
            'name': file_obj.name,  # 文件名
            'file': file_obj,  # 文件对象
            'size': file_obj.size,  # 文件大小（字节）
            'mime_type': mimetypes.guess_type(file_obj.name)[0] or 'application/octet-stream',  # MIME 类型
        }

        # 根据文件扩展名分类
        ext = file_obj.name.split('.')[-1].upper() if '.' in file_obj.name else 'OTHER'
        if ext in ['PDF']:
            file_data['type'] = 'PDF'
        elif ext in ['DOC', 'DOCX']:
            file_data['type'] = 'WORD'
        elif ext in ['XLS', 'XLSX']:
            file_data['type'] = 'EXCEL'
        elif ext in ['JPG', 'JPEG', 'PNG', 'GIF']:
            file_data['type'] = 'IMAGE'
        else:
            file_data['type'] = 'OTHER'

        # 使用创建序列化器保存数据
        create_serializer = self.get_serializer(data=file_data)
        create_serializer.is_valid(raise_exception=True)
        instance = self.perform_create(create_serializer)
    
        # 使用完整的序列化器返回响应
        response_serializer = FileRecordSerializer(instance)
        logger.info(f"文件上传成功: {response_serializer.data}")  # 添加日志
        
        return Response(
            response_serializer.data, 
            status=status.HTTP_201_CREATED
        )

    def perform_create(self, serializer):
        """
        执行创建操作时，额外记录创建人信息。
        返回创建的实例以便后续使用。
        """
        logger.info(f"创建新文件记录: {self.request.user.phone}")
        instance = serializer.save(
            created_by=self.request.user.phone,
            owner=self.request.user
        )

        # 添加日志确认文件上传状态
        logger.info(f"文件上传完成，存储位置: {instance.file.name}")
        logger.info(f"文件访问 URL: {instance.file.url}")
        
        return instance  # 返回创建的实例
    

    def perform_update(self, serializer):
        """
        执行更新操作时，额外记录更新人和更新时间。
        """
        logger.info(f"User {self.request.user.phone} updating file {serializer.instance.id}")
        serializer.save(
            updated_by=self.request.user.phone,  # 记录更新人的手机号
            updated_at=timezone.now()  # 记录更新时间
        )


    def destroy(self, request, *args, **kwargs):
        """
        删除文件。
        DELETE /api/files/{id}/
        """
        instance = self.get_object()
        logger.info(f"User {request.user.phone} attempting to delete file {instance.id}")
        
        # 仅允许文件所有者删除文件
        if instance.owner != request.user:
            logger.warning(f"User {request.user.phone} denied permission to delete file {instance.id}")
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # 删除文件记录
        logger.info(f"Deleting file {instance.id}")
        self.perform_destroy(instance)
        
        return Response(status=status.HTTP_204_NO_CONTENT)


