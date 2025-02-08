from rest_framework import serializers
from .models import ChatSession, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """用户基本信息序列化器"""
    class Meta:
        model = User
        fields = ['id', 'phone','email','role']
        read_only_fields = ['id', 'phone']

class ChatMessageSerializer(serializers.ModelSerializer):
    """聊天消息序列化器"""
    class Meta:
        model = ChatMessage
        fields = [
            'id', 
            'session', 
            'sequence', 
            'content', 
            'role', 
            'created_at'
        ]
        read_only_fields = ['id', 'sequence', 'created_at']

    # 检查传入的值（value）是否在允许的选项中。
    # 这里限定了发消息的role要么AI，要么用户。阻止了为空，或者是其他恶意role类型的情况。
    def validate_role(self, value):
        """验证 role 字段"""
        if value not in dict(ChatMessage.ROLE_CHOICES):
            raise serializers.ValidationError(
                f"Invalid role. Choices are: {dict(ChatMessage.ROLE_CHOICES).keys()}"
            )
        return value

class ChatMessageCreateSerializer(ChatMessageSerializer):
    """
    创建消息时使用的序列化器
    相比ChatMessageSerializer添加了session为只读的限定
    因为创建时，session应该来自后端上下文，而不是用户。
    通过使用这个序列化器，会阻止用户传递session的数据，从而造成session改变。
    """
    
    class Meta(ChatMessageSerializer.Meta):
        read_only_fields = [
            'id', 
            'session', 
            'sequence', 
            'created_at'
        ]


class ChatSessionSerializer(serializers.ModelSerializer):
    """聊天会话序列化器"""
    created_by = UserSerializer(read_only=True)
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    last_message = ChatMessageSerializer(read_only=True)

    class Meta:
        model = ChatSession
        fields = [
            'id', 
            'created_at', 
            'updated_at', 
            'created_by',
            'messages',
            'message_count',
            'last_message'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    # 自动创建关联，会简化输入
    def create(self, validated_data):
        """创建会话时自动关联当前用户"""
        user = self.context['request'].user
        validated_data['created_by'] = user
        return super().create(validated_data)

class ChatSessionListSerializer(ChatSessionSerializer):
    """会话列表序列化器，不包含详细消息"""
    class Meta(ChatSessionSerializer.Meta):
        fields = [
            'id', 
            'created_at', 
            'updated_at', 
            'created_by',
            'message_count',  #在基础序列化器上添加的新字段（在下面方法中赋值）
            'last_message'    #在基础序列化器上添加的新字段（在下面方法中赋值）
        ]

    # 重写to_representation方法，添加消息数量和最后一条消息
    # to_representation是（后端->前端）序列化过程的核心步骤
    # 反序列化过程，不会用到to_representation, 而是用到to_internal_value()
    def to_representation(self, instance):
        """添加消息数量和最后一条消息"""
        representation = super().to_representation(instance)
        # 获取消息数量
        representation['message_count'] = instance.chatmessage_set.count()
        # 获取最后一条消息
        last_message = instance.chatmessage_set.last()
        if last_message:
            representation['last_message'] = ChatMessageSerializer(last_message).data
        return representation