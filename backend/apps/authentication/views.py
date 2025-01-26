from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.exceptions import ValidationError
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .serializers import (
    UserCreateSerializer, 
    LoginSerializer,
    CaptchaLoginSerializer,
    CaptchaRequestSerializer,
    PasswordResetSerializer,
    WechatLoginSerializer,
    WechatBindPhoneSerializer,
    TokenSerializer,
    UserSerializer
)
from .services import AuthService
import logging
# 确保 logger 名称与 notebooks/django_setup.py 中的名称匹配
logger = logging.getLogger('apps.authentication')  


# ------------------- 用户注册视图 done test! ------------------
@extend_schema_view(
    post=extend_schema(
        tags=['auth'],
        summary='用户注册',
        description='使用手机号、密码和验证码注册新用户',
        request=UserCreateSerializer,
        responses={
            201: TokenSerializer,
            400: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'user': {
                        'id': 'uuid',
                        'phone': '13800138000',
                        'email': None,
                        'username': None,
                        'role': 'user'
                    }
                }
            )
        ]
    )
)
class RegisterView(APIView):
    """用户注册视图"""
    permission_classes = [AllowAny]

    def post(self, request):
        logger.info("=== 收到用户注册请求 views.py/RegisterView ===")
        logger.info("收到的注册请求数据: %s", request.data)
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            logger.info("序列化器验证通过，验证后的数据: %s", serializer.validated_data)
            try:
                result = AuthService.register_user(
                    phone=serializer.validated_data['phone'],
                    password=serializer.validated_data['password'],
                    captcha=serializer.validated_data.get('captcha')  # 使用 get 方法
                )
                return Response(TokenSerializer(result).data, status=status.HTTP_201_CREATED)
            except ValueError as e:
                logger.error("注册服务错误: %s", str(e))  # 修正 logger 格式
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        logger.info("序列化器验证错误: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ------------------- 密码登录视图 done test! ------------------
@extend_schema_view(
    post=extend_schema(
        tags=['auth'],
        summary='密码登录',
        description='使用手机号/邮箱和密码登录',
        request=LoginSerializer,
        responses={
            200: TokenSerializer,
            401: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'user': {
                        'id': 'uuid',
                        'phone': '13800138000',
                        'email': 'user@example.com',
                        'username': 'username',
                        'role': 'user'
                    }
                }
            )
        ]
    )
)
class LoginView(APIView):
    """密码登录视图"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = AuthService.login_with_password(
                    phone_or_email=serializer.validated_data['phone_or_email'],
                    password=serializer.validated_data['password']
                )
                return Response(TokenSerializer(result).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ------------------- 验证码登录视图 done test! ------------------
@extend_schema_view(
    post=extend_schema(
        tags=['auth'],
        summary='验证码登录',
        description='使用手机号和验证码登录',
        request=CaptchaLoginSerializer,
        responses={
            200: TokenSerializer,
            401: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'user': {
                        'id': 'uuid',
                        'phone': '13800138000',
                        'email': None,
                        'username': None,
                        'role': 'user'
                    }
                }
            )
        ]
    )
)
class CaptchaLoginView(APIView):
    """验证码登录视图"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CaptchaLoginSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = AuthService.login_with_captcha(
                    phone=serializer.validated_data['phone'],
                    code=serializer.validated_data['captcha']
                )
                return Response(TokenSerializer(result).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ------------------- 请求验证码视图 done test! ------------------
@extend_schema_view(
    post=extend_schema(
        tags=['auth'],
        summary='请求验证码',
        description='获取手机验证码，支持注册、登录、重置密码等场景',
        request=CaptchaRequestSerializer,
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={'message': '验证码已发送'}
            ),
            OpenApiExample(
                'Error Response',
                value={'error': '请求过于频繁，请稍后再试'}
            )
        ]
    )
)
class CaptchaRequestView(APIView):
    """请求验证码视图"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CaptchaRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                AuthService.generate_captcha(
                    phone=serializer.validated_data['phone'],
                    type=serializer.validated_data['type']
                )
                return Response({'message': '验证码已发送'})
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------- 重置密码视图 done test! ------------------
@extend_schema_view(
    post=extend_schema(
        tags=['auth'],
        summary='重置密码',
        description='使用手机号和验证码重置密码',
        request=PasswordResetSerializer,
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={'message': '密码重置成功'}
            ),
            OpenApiExample(
                'Error Response',
                value={'error': '验证码验证失败'}
            )
        ]
    )
)
class PasswordResetView(APIView):
    """密码重置视图"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            try:
                AuthService.reset_password(
                    phone=serializer.validated_data['phone'],
                    new_password=serializer.validated_data['new_password'],
                    captcha=serializer.validated_data['captcha']
                )
                return Response({'message': '密码重置成功'})
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ------------------- 微信登录视图 TODO ------------------
@extend_schema_view(
    post=extend_schema(
        tags=['auth'],
        summary='微信登录',
        description='使用微信授权码登录',
        request=WechatLoginSerializer,
        responses={
            200: TokenSerializer,
            400: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'user': {
                        'id': 'uuid',
                        'phone': '13800138000',
                        'email': None,
                        'username': None,
                        'role': 'user'
                    }
                }
            )
        ]
    )
)
class WechatLoginView(APIView):
    """微信登录视图"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = WechatLoginSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = AuthService.handle_wechat_login(
                    code=serializer.validated_data['code']
                )
                return Response(result)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ------------------- 微信绑定手机号视图 TODO ------------------
@extend_schema_view(
    post=extend_schema(
        tags=['auth'],
        summary='微信绑定手机号',
        description='将微信账号与手机号绑定',
        request=WechatBindPhoneSerializer,
        responses={
            200: TokenSerializer,
            400: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value={
                    'access_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'refresh_token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1...',
                    'user': {
                        'id': 'uuid',
                        'phone': '13800138000',
                        'email': None,
                        'username': None,
                        'role': 'user'
                    }
                }
            )
        ]
    )
)
class WechatBindPhoneView(APIView):
    """微信绑定手机号视图"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = WechatBindPhoneSerializer(data=request.data)
        if serializer.is_valid():
            try:
                result = AuthService.bind_wechat_phone(
                    phone=serializer.validated_data['phone'],
                    captcha=serializer.validated_data['captcha'],
                    temp_token=serializer.validated_data['temp_token']
                )
                return Response(TokenSerializer(result).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ------------------- 用户信息视图 done test! ------------------
@extend_schema_view(
    get=extend_schema(
        tags=['auth'],
        summary='获取用户信息',
        description='获取当前登录用户的详细信息',
        responses={
            200: UserSerializer,
            401: OpenApiTypes.OBJECT
        }
    ),
    put=extend_schema(
        tags=['auth'],
        summary='更新用户信息',
        description='更新当前登录用户的信息',
        request=UserSerializer,
        responses={
            200: UserSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT
        }
    )
)
class UserProfileView(APIView):
    """用户信息视图"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
