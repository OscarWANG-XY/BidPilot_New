from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FileRecord, FileProjectLink

# 获取 Django 项目中自定义的用户模型
# Django 允许自定义 User 模型，而 get_user_model() 可以动态获取当前项目使用的用户模型
User = get_user_model()

# 用户序列化器，用于序列化 User 模型
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User  # 指定序列化的模型
        fields = ['id', 'phone', 'email', 'role']  # 指定序列化的字段


# 文件记录（FileRecord）序列化器  - 读取/查询时使用 
class FileRecordSerializer(serializers.ModelSerializer):
    # 基础字段转换
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    createdBy = serializers.CharField(source='created_by', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    updatedBy = serializers.CharField(source='updated_by', read_only=True)
    
    # 处理状态相关字段转换
    processingStatus = serializers.CharField(source='processing_status')
    processingProgress = serializers.IntegerField(source='processing_progress')
    errorMessage = serializers.CharField(source='error_message')
    
    # 文件相关字段转换
    mimeType = serializers.CharField(source='mime_type')
    
    # 关联字段：文件的所有者，使用 UserSerializer 进行序列化（只读）
    owner = UserSerializer(read_only=True)

    # 关联字段：可读用户列表，使用 UserSerializer 进行序列化（只读）
    readUsers = UserSerializer(source='read_users', many=True, read_only=True)

    # 关联字段：可写用户列表，使用 UserSerializer 进行序列化（只读）
    writeUsers = UserSerializer(source='write_users', many=True, read_only=True)
    
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = FileRecord  # 指定序列化的模型
        fields = [
            'id', 'name', 'file', 'size', 'type', 'mimeType',
            'processingStatus', 'processingProgress', 'errorMessage',
            'readUsers', 'writeUsers', 'owner', 'metadata', 'remarks',
            'createdAt', 'createdBy', 'updatedAt', 'updatedBy',
            'version', 'url'
        ]  # 指定序列化的字段

        # 只读字段，这些字段不会被 API 直接修改
        read_only_fields = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'version']

    def get_url(self, obj):
        """获取文件的预签名 URL，如果请求参数 presigned=true，则返回预签名 URL"""
        request = self.context.get('request')  # 获取请求上下文
        if request and request.query_params.get('presigned') == 'true':  
            return obj.get_presigned_url()  # 调用模型方法生成预签名 URL
        return obj.url  # 默认返回文件的 URL


# 用于创建文件记录的序列化器  - 创建时使用
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


# 文件与项目的关联（FileProjectLink）序列化器
class FileProjectLinkSerializer(serializers.ModelSerializer):
    fileKey = FileRecordSerializer(source='file_key', read_only=True)
    fileId = serializers.UUIDField(source='file_id', write_only=True)
    projectId = serializers.CharField(source='project_id')
    linkType = serializers.CharField(source='link_type')
    sortOrder = serializers.IntegerField(source='sort_order', required=False)
    isDeleted = serializers.BooleanField(source='is_deleted')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    createdBy = serializers.CharField(source='created_by', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    updatedBy = serializers.CharField(source='updated_by', read_only=True)

    class Meta:
        model = FileProjectLink  # 指定序列化的模型
        fields = [
            'id', 'fileKey', 'fileId', 'projectId', 'linkType',
            'sortOrder', 'isDeleted', 'createdAt', 'createdBy',
            'updatedAt', 'updatedBy', 'version'
        ]  # 指定序列化的字段

        # 只读字段
        read_only_fields = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'version']

    def create(self, validated_data):
        """
        处理文件与项目的关联，基于文件 ID 关联到 FileRecord 对象
        """
        file_id = validated_data.pop('file_id')  # 提取文件 ID
        try:
            # 通过文件 ID 查询 FileRecord 对象
            file_record = FileRecord.objects.get(id=file_id)
            # 创建 FileProjectLink 记录，并关联到文件对象
            return FileProjectLink.objects.create(file_key=file_record, **validated_data)
        except FileRecord.DoesNotExist:
            # 如果文件记录不存在，则返回验证错误
            raise serializers.ValidationError({'fileId': 'File record does not exist'})


