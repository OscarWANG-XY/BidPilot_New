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
# 前后端整合调试通过
class UserCreateSerializer(serializers.ModelSerializer):
    """用户创建序列化器 - 用于注册"""
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    confirmPassword = serializers.CharField(
        write_only=True, 
        style={'input_type': 'password'}, 
        error_messages={
            'required': '请输入确认密码'
        }
    )
    agreeToTerms = serializers.BooleanField(
        write_only=True, 
        error_messages={
            'required': '请同意服务条款和隐私政策'
        }
    )
    captcha = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['phone', 'password', 'confirmPassword', 'captcha', 'agreeToTerms']

    def validate(self, data):
        # 验证两次密码是否一致
        if data.get('password') != data.get('confirmPassword'):
            raise serializers.ValidationError({
                "confirmPassword": "两次输入的密码不一致"
            })
        # 验证是否同意条款
        if not data.get('agreeToTerms'):
            raise serializers.ValidationError({
                "agreeToTerms": "必须同意服务条款和隐私政策"
            })
        return data

    def create(self, validated_data):
        # 移除不需要保存到数据库的字段
        validated_data.pop('confirmPassword', None)
        validated_data.pop('agreeToTerms', None)
        validated_data.pop('captcha', None)
        password = validated_data.pop('password', None)

        # 使用 create_user 方法创建用户
        user = User.objects.create_user(
            phone=validated_data['phone'],
            password=password
        )
        return user



# -----------  登录序列化器 done test   -------------
class PasswordLoginSerializer(serializers.Serializer):
    """登录序列化器 - 支持手机号/邮箱 + 密码登录"""
    phoneOrEmail = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'})
    agreeToTerms = serializers.BooleanField()



# -----------  验证码登录序列化器 done test   -------------
class CaptchaLoginSerializer(serializers.Serializer):
    """验证码登录序列化器"""
    phone = serializers.CharField()
    captcha = serializers.CharField()
    agreeToTerms = serializers.BooleanField()


# -----------  验证码请求序列化器 done test   -------------
# 前后端整合测试通过
class CaptchaRequestSerializer(serializers.Serializer):
    """验证码请求序列化器"""
    phone = serializers.CharField()
    type = serializers.ChoiceField(choices=['login', 'register', 'resetPassword'])



# -----------  密码重置序列化器 done test   -------------
class PasswordResetSerializer(serializers.Serializer):
    """密码重置序列化器"""
    phone = serializers.CharField()
    captcha = serializers.CharField()
    newPassword = serializers.CharField(style={'input_type': 'password'})
    confirmPassword = serializers.CharField(style={'input_type': 'password'})

    def validate(self, data):
        """验证两次输入的密码是否一致"""
        if data.get('newPassword') != data.get('confirmPassword'):
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
# 前后端整合测试通过
class TokenSerializer(serializers.Serializer):
    """令牌序列化器"""
    token = serializers.CharField(source='access_token')
    refreshToken = serializers.CharField(source='refresh_token')
    user = UserSerializer()

    class Meta:
        fields = ['token', 'refreshToken', 'user'] 