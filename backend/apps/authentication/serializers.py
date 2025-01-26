# 以下序列化器是基于前端数据结构（auth_dt_stru.ts 和 user_dt_stru.ts）构建

from rest_framework import serializers
from .models import User, VerificationCode

class UserSerializer(serializers.ModelSerializer):
    """用户序列化器 - 用于一般场景的用户信息序列化"""
    class Meta:
        model = User
        fields = ['id', 'phone', 'email', 'username', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


# -----------  用户创建序列化器 done test   -------------
class UserCreateSerializer(serializers.ModelSerializer):
    """用户创建序列化器 - 用于注册"""
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    agree_to_terms = serializers.BooleanField(write_only=True)
    captcha = serializers.CharField(write_only=True)  # 添加验证码字段

    class Meta:
        model = User
        fields = ['phone', 'password', 'confirm_password', 'captcha', 'agree_to_terms']

    def validate(self, data):
        # 验证两次密码是否一致
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError("两次输入的密码不一致")
        # 验证是否同意条款
        if not data.get('agree_to_terms'):
            raise serializers.ValidationError("必须同意服务条款和隐私政策")
        return data

    def create(self, validated_data):
        # 移除不需要保存到数据库的字段
        validated_data.pop('confirm_password', None)
        validated_data.pop('agree_to_terms', None)
        validated_data.pop('captcha', None)
        password = validated_data.pop('password', None)

        # 使用 create_user 方法创建用户
        user = User.objects.create_user(
            phone=validated_data['phone'],
            password=password  # password会被create_user方法正确处理
        )
        return user


# -----------  登录序列化器 done test   -------------
class LoginSerializer(serializers.Serializer):
    """登录序列化器 - 支持手机号/邮箱 + 密码登录"""
    phone_or_email = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'})
    agree_to_terms = serializers.BooleanField()

# -----------  验证码登录序列化器 done test   -------------
class CaptchaLoginSerializer(serializers.Serializer):
    """验证码登录序列化器"""
    phone = serializers.CharField()
    captcha = serializers.CharField()
    agree_to_terms = serializers.BooleanField()

# -----------  验证码请求序列化器 done test   -------------
class CaptchaRequestSerializer(serializers.Serializer):
    """验证码请求序列化器"""
    phone = serializers.CharField()
    type = serializers.ChoiceField(choices=['login', 'register', 'resetPassword'])

# -----------  密码重置序列化器 done test   -------------
class PasswordResetSerializer(serializers.Serializer):
    """密码重置序列化器"""
    phone = serializers.CharField()
    captcha = serializers.CharField()
    new_password = serializers.CharField(style={'input_type': 'password'})
    confirm_password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, data):
        """验证两次输入的密码是否一致"""
        if data.get('new_password') != data.get('confirm_password'):
            raise serializers.ValidationError("两次输入的密码不一致")
        return data

# -----------  微信登录序列化器 TODO   -------------
class WechatLoginSerializer(serializers.Serializer):
    """微信登录序列化器"""
    code = serializers.CharField()

# -----------  微信绑定手机号序列化器 TODO   -------------
class WechatBindPhoneSerializer(serializers.Serializer):
    """微信绑定手机号序列化器"""
    phone = serializers.CharField()
    captcha = serializers.CharField()
    temp_token = serializers.CharField()

# ---------- 令牌序列化器 done test   -------------
class TokenSerializer(serializers.Serializer):
    """令牌序列化器"""
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    user = UserSerializer()

    class Meta:
        fields = ['access_token', 'refresh_token', 'user'] 