from rest_framework import serializers
from .models import Project
from django.contrib.auth import get_user_model
import logging
import os
import mimetypes
from django.utils import timezone

logger = logging.getLogger(__name__)
User = get_user_model()


# ============ 基础模型序列化器 (Basic Model Serializers) ============

class ProjectUserBriefSerializer(serializers.ModelSerializer):
    """
    用户简要信息序列化器
    在项目相关API中展示用户的基本信息，只包含id, phone, role的必要信息。
    """

    # 核心信息
    id = serializers.UUIDField(
        read_only=True,   # 必须字段，但不需用户填写
        help_text="用户唯一标识符"
    )
    phone = serializers.CharField(
        read_only=True,   # 必须字段，但不需用户填写
        help_text="用户手机号，作为主要联系方式"
    )
    role = serializers.CharField(
        read_only=True,   # 必须字段，但不需用户填写
        help_text="用户角色，如'user'、'admin'等"
    )
    
    class Meta:
        model = User
        fields = ['id', 'phone', 'role']
        read_only_fields = ['id', 'phone', 'role']





# ============= Project 项目序列化器 =============
class ProjectListSerializer(serializers.ModelSerializer):
    """项目列表序列化器"""
    creator = ProjectUserBriefSerializer(read_only=True)
    project_type_display = serializers.CharField(source='get_project_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'project_type_display', 
                 'status', 'status_display', 
                 'starred', 'tender_file',
                 'creator', 'create_time', 'last_update_time']
        read_only_fields = ['id', 'creator', 'create_time', 'last_update_time',
                           'project_type', 'project_type_display', 
                           'status', 'status_display']

class ProjectDetailSerializer(ProjectListSerializer):
    """项目详情序列化器"""
    tender_file_url = serializers.SerializerMethodField(read_only=True)
    tender_file_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ['tender_file_url', 'tender_file_name']
    
    def get_tender_file_url(self, obj):
        """获取招标文件的预签名URL"""
        if self.context.get('generate_presigned_url'):
            return obj.get_tender_file_presigned_url()
        return obj.tender_file.url if obj.tender_file else None
    
    def get_tender_file_name(self, obj):
        """获取招标文件名称"""
        if obj.tender_file:
            import os
            return os.path.basename(obj.tender_file.name)
        return None


class ProjectCreateSerializer(serializers.ModelSerializer):
    """项目创建序列化器"""
    class Meta:
        model = Project
        fields = ['id', 'project_name', 'tenderee', 'bidder',
                 'project_type', 'starred', 'status']
        read_only_fields = ['id']

    def create(self, validated_data):
        project = Project(**validated_data)
        project.save()  # 这里会触发 model 的 save 方法，自动生成 project_code
        return project
    

class ProjectUpdateSerializer(serializers.ModelSerializer):
    """项目更新序列化器"""
    class Meta:
        model = Project
        fields = ['project_name', 'tenderee', 'bidder', 'project_type',
                 'starred', 'status']

# 专用于前端项目取消，和删除的场景
class ProjectStatusUpdateSerializer(serializers.ModelSerializer):
    """项目状态更新序列化器"""
    remarks = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = Project
        fields = ['status', 'remarks']



# ============= 招标文件序列化器 =============
class TenderFileDetailSerializer(serializers.Serializer):
    """招标文件详情序列化器"""
    # tender_file是一个对象，自带了一些信息，通过以下序列化器得方法获取。
    # 对于私有云存储，需要无法通过url直接访问，需要通过presigned_url进行访问。  
    filename = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()
    path = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    extension = serializers.SerializerMethodField()
    upload_date = serializers.SerializerMethodField()
    presigned_url = serializers.SerializerMethodField()

    def get_filename(self, obj):
        return os.path.basename(obj.tender_file.name) if obj.tender_file else None

    def get_size(self, obj):
        return obj.tender_file.size if obj.tender_file else None

    def get_path(self, obj):
        return obj.tender_file.name if obj.tender_file else None

    def get_url(self, obj):
        return obj.tender_file.url if obj.tender_file else None

    def get_extension(self, obj):
        if obj.tender_file:
            return os.path.splitext(obj.tender_file.name)[1].lower()
        return None

    def get_upload_date(self, obj):
        return obj.last_update_time if obj.tender_file else None

    def get_presigned_url(self, obj):
        return obj.get_tender_file_presigned_url() if obj.tender_file else None
