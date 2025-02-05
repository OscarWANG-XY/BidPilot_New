from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FileRecord, FileProjectLink
from apps.projects.serializers import ProjectListSerializer
from apps.projects.models import Project
from django.core.cache import cache

# 获取 Django 项目中自定义的用户模型
# Django 允许自定义 User 模型，而 get_user_model() 可以动态获取当前项目使用的用户模型
User = get_user_model()

# 用户序列化器，用于序列化 User 模型
class UserSerializer(serializers.ModelSerializer):
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
    
    owner = UserSerializer(read_only=True)
    read_users = UserSerializer(many=True, read_only=True)
    write_users = UserSerializer(many=True, read_only=True)
    
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = FileRecord  # 指定序列化的模型
        fields = [
            'id', 'name', 'file', 'size', 'type', 'mime_type',
            'processing_status', 'processing_progress', 'error_message',
            'read_users', 'write_users', 'owner', 'metadata', 'remarks',
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

    class Meta:
        model = FileRecord  # 指定序列化的模型
        fields = [
            'name', 'file', 'size', 'type', 'mime_type',
            'metadata', 'remarks'
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


# ----------  文件与项目的关联（FileProjectLink）序列化器 (前端 <->后端）  -----------------
# 前端传给后端的是file_id和project_id
# 后端返回给前端的是file_record和project
class FileProjectLinkSerializer(serializers.ModelSerializer):
    # 用于创建的 ID 字段
    fileRecordId = serializers.PrimaryKeyRelatedField(
        source='file_record',
        queryset=FileRecord.objects.all(),
        write_only=True
    )
    
    projectId = serializers.PrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all(),
        write_only=True
    )
    
    # 用于返回的完整信息字段
    file_record = FileRecordSerializer(read_only=True)
    project = ProjectListSerializer(read_only=True)    # 使用 ProjectListSerializer
    # 注意，ProjectListSerializer 的名字可能有点误导性。
    # 实际上，它并不是"返回项目列表"的序列化器，而是"用于项目列表中显示单个项目"的序列化器。
    # 它定义了在列表中显示一个项目时需要的字段。
    

    # 其他字段
    link_type = serializers.CharField()
    sort_order = serializers.IntegerField(required=False, allow_null=True)
    is_deleted = serializers.BooleanField()
    
    # BaseModel 继承字段
    created_at = serializers.DateTimeField(read_only=True)
    created_by = serializers.CharField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    updated_by = serializers.CharField(read_only=True)
    version = serializers.IntegerField(read_only=True)

    class Meta:
        model = FileProjectLink
        fields = [
            'id', 'fileRecordId', 'file_record', 
            'projectId', 'project', 'link_type',
            'sort_order', 'is_deleted', 'created_at', 'created_by',
            'updated_at', 'updated_by', 'version'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 
                           'updated_at', 'updated_by', 'version']


