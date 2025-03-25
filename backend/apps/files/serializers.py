from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FileRecord
from apps.projects.serializers import ProjectListSerializer
from apps.projects.models import Project
from django.core.cache import cache

# 获取 Django 项目中自定义的用户模型
# Django 允许自定义 User 模型，而 get_user_model() 可以动态获取当前项目使用的用户模型
User = get_user_model()

# 用户序列化器，用于序列化 User 模型
class FileUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User  # 指定序列化的模型
        fields = ['id', 'phone', 'email', 'role']  # 指定序列化的字段


# ---------- 文件记录（FileRecord）序列化器  - 读取/查询时使用 （后端->前端） ------------
class FileRecordSerializer(serializers.ModelSerializer):
    # 删除所有字段名转换
    created_at = serializers.DateTimeField(read_only=True)
    created_by = serializers.CharField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    updated_by = serializers.CharField(read_only=True)
    
    processing_status = serializers.CharField()
    processing_progress = serializers.IntegerField()
    error_message = serializers.CharField()
    
    mime_type = serializers.CharField()
    
    owner = FileUserSerializer(read_only=True)
    
    # 添加项目ID字段，用于前端显示和关联
    project_id = serializers.PrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all(),
        required=False,
        allow_null=True
    )
    
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = FileRecord  # 指定序列化的模型
        fields = [
            'id', 'name', 'file', 'size', 'type', 'mime_type',
            'processing_status', 'processing_progress', 'error_message',
            'owner', 'metadata', 'remarks', 'project_id',
            'created_at', 'created_by', 'updated_at', 'updated_by',
            'version', 'url'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'version']

    def get_url(self, obj):
        """获取文件的预签名 URL，如果上下文中 generate_presigned=True，则返回预签名 URL"""
        # 1. 从序列化器上下文中检查是否需要生成预签名URL
        if self.context.get('generate_presigned'):  
            # 2. 尝试从缓存获取预签名URL
            cache_key = f'presigned_url_{obj.id}'
            cached_url = cache.get(cache_key)
            if cached_url:
                return cached_url
                
            # 3. 如果缓存不存在，生成新的预签名URL
            url = obj.get_presigned_url()
            if url:
                # 缓存1小时（因为预签名URL通常有效期也是1小时）
                cache.set(cache_key, url, 3600)
            return url
        
        # 4. 如果不需要预签名URL，返回普通的存储URL
        return obj.file.url if obj.file else None


# ----------  用于创建文件记录的序列化器  - 创建时使用  （前端->后端）-------------------
# 区别越FileRecordSerializer，只包含最小必要字段，避免创建时暴露敏感字段
class FileRecordCreateSerializer(serializers.ModelSerializer):
    """用于文件创建的专用序列化器"""

    # 添加项目ID字段，用于关联项目
    project_id = serializers.PrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = FileRecord  # 指定序列化的模型
        fields = [
            'name', 'file', 'size', 'type', 'mime_type',
            'metadata', 'remarks', 'project_id'
        ]  # 指定创建时需要的字段

    def create(self, validated_data):
        """
        在创建文件记录时，自动设置文件的所有者和创建者信息
        """
        request = self.context.get('request')  # 获取请求上下文
        if request and request.user:
            validated_data['owner'] = request.user  # 设定文件所有者
            validated_data['created_by'] = request.user.phone  # 设定创建者用户名
        else:
            raise serializers.ValidationError("认证用户必须提供")
        return super().create(validated_data)  # 调用父类方法创建记录



