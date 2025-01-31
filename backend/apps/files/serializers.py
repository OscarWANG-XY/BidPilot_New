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
    # url的生成通过 以下 get_url() 方法获得
    url = serializers.SerializerMethodField() 

    # 关联字段：文件的所有者，使用 UserSerializer 进行序列化（只读）
    owner = UserSerializer(read_only=True)

    # 关联字段：可读用户列表，使用 UserSerializer 进行序列化（只读）
    read_users = UserSerializer(many=True, read_only=True)

    # 关联字段：可写用户列表，使用 UserSerializer 进行序列化（只读）
    write_users = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = FileRecord  # 指定序列化的模型
        fields = [
            'id', 'name', 'file', 'size', 'type', 'mime_type',
            'processing_status', 'processing_progress', 'error_message',
            'read_users', 'write_users', 'owner', 'metadata', 'remarks',
            'created_at', 'created_by', 'updated_at', 'updated_by',
            'version', 'url'
        ]  # 指定序列化的字段

        # 只读字段，这些字段不会被 API 直接修改
        read_only_fields = ['id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'version']

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

    # 外键字段：返回了整个文件对象的信息，直观避免API额外查询，但相比类似file_id包含更多数据量（只读）
    file_key = FileRecordSerializer(read_only=True)

    # 文件 ID，用户提供文件 ID 进行写入，而不直接传递完整的文件对象
    file_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = FileProjectLink  # 指定序列化的模型
        fields = [
            'id', 'file_key', 'file_id', 'project_id', 'link_type',
            'sort_order', 'is_deleted', 'created_at', 'created_by',
            'updated_at', 'updated_by', 'version'
        ]  # 指定序列化的字段

        # 只读字段
        read_only_fields = ['id', 'created_at', 'created_by', 'updated_at', 'updated_by', 'version']

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
            raise serializers.ValidationError({'file_id': 'File record does not exist'})


