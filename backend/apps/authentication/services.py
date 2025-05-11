import random
import logging
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, VerificationCode
from .sms_service import TencentSmsService
# 确保 logger 名称与 notebooks/django_setup.py 中的名称匹配
logger = logging.getLogger('apps.authentication')

class AuthService:
    """认证服务类"""

    # -----------  生成JWT令牌 done test   -------------
    @staticmethod
    def generate_tokens(user):
        """生成JWT令牌"""
        refresh = RefreshToken.for_user(user)

        logger.info("生成令牌：", 
                    "access_token: ", str(refresh.access_token),
                    "refresh_token: ", str(refresh),
                    "user: ", user)

        return {
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': user
        }

    # -----------  密码登录 done test   -------------
    @staticmethod
    def login_with_password(phone_or_email: str, password: str):
        """密码登录"""
        logger.info("=== 密码登录过程 service.py/login_with_password ===")
        logger.info("登录参数:")
        logger.info("- 手机号/邮箱: %s", phone_or_email)
        logger.info("- 密码长度: %d", len(password))

        # 判断是手机号还是邮箱
        field = 'phone' if phone_or_email.isdigit() else 'email'
        credentials = {field: phone_or_email, 'password': password}
        
        user = authenticate(**credentials)
        if not user:
            logger.error("认证失败：用户名或密码错误")
            raise ValueError('用户名或密码错误')
        
        logger.info("用户认证成功: %s", user.phone if hasattr(user, 'phone') else user.email)
        return AuthService.generate_tokens(user)


    # -----------  生成验证码 done test partially TODO  -------------
    @staticmethod
    def generate_captcha(phone: str, type: str):
        """生成验证码"""
        logger.info("=== 生成验证码过程 service.py/generate_captcha ===")
        logger.info("验证码生成参数:")
        logger.info("- 手机号: %s", phone)
        logger.info("- 验证码类型: %s", type)

        # 检查是否频繁发送
        cache_key = f'captcha_limit_{phone}'
        if cache.get(cache_key):
            logger.error("验证码发送过于频繁")
            raise ValueError('请求过于频繁，请稍后再试')

        # 生成6位数验证码
        code = ''.join(random.choices('0123456789', k=6))
        logger.info("生成的验证码: %s", code)
        
        # 保存验证码
        verification = VerificationCode.objects.create(
            phone=phone,
            code=code,
            type=type,
            expires_at=timezone.now() + timedelta(minutes=5)
        )
        logger.info("验证码保存成功，过期时间: %s", verification.expires_at)

        # 设置发送限制
        cache.set(cache_key, True, 60)
        logger.info("设置发送限制: 60秒")
        
        try:
            # 调用腾讯云短信服务发送验证码
            result = TencentSmsService.send_verification_code(phone, code)
            logger.info("验证码发送成功，结果: %s", result)
            return True
        except ValueError as e:
            logger.error("验证码发送失败: %s", str(e))
            raise ValueError(f'验证码发送失败: {str(e)}')
        
        return True


    # -----------  验证验证码 done test   -------------
    @staticmethod
    def verify_captcha(phone: str, code: str, type: str):
        """验证验证码"""
        logger.info("=== 验证码验证过程 service.py/verify_captcha ===")
        logger.info("输入参数:")
        logger.info("- 手机号: %s", phone)
        logger.info("- 验证码: %s", code)
        logger.info("- 类型: %s", type)
        
        verification = VerificationCode.objects.filter(
            phone=phone,
            type=type,
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at').first()

        logger.info(f"\n数据库查询结果:")
        if verification:
            logger.info(f"- 找到验证码记录")
            logger.info(f"- 数据库验证码: {verification.code}")
            logger.info(f"- 数据库类型: {verification.type}")
            logger.info(f"- 是否已使用: {verification.is_used}")
            logger.info(f"- 过期时间: {verification.expires_at}")
        else:
            logger.info("- 未找到有效的验证码记录")

        if not verification:
            raise ValueError('验证码已过期或不存在')
        
        if verification.code != code:
            logger.info(f"\n验证码不匹配:")
            logger.info(f"- 输入的验证码: {code}")
            logger.info(f"- 数据库验证码: {verification.code}")
            raise ValueError('验证码错误')
        
        verification.is_used = True
        verification.save()
        logger.info("\n验证成功，验证码已标记为已使用")
        return True


    # -----------  验证码登录 done test   -------------
    # 请注意，由于我们使用了get_or_create方法，如果用户不存在，会自动创建一个新用户。
    # 因此，如果用户不存在，会自动创建一个新用户， 验证码登录即注册（具有注册功能）
    @staticmethod
    def login_with_captcha(phone: str, code: str):
        """验证码登录"""
        logger.info("=== 验证码登录过程 service.py/login_with_captcha ===")
        logger.info("登录参数:")
        logger.info("- 手机号: %s", phone)
        logger.info("- 验证码: %s", code)

        if not AuthService.verify_captcha(phone, code, 'login'):
            logger.error("验证码验证失败")
            raise ValueError('验证码验证失败')
        
        # 获取或创建用户
        user, created = User.objects.get_or_create(phone=phone)
        logger.info("用户%s: %s", "创建" if created else "获取", user.phone)
        
        return AuthService.generate_tokens(user)


    @staticmethod
    def register_user(phone: str, password: str, captcha: str):
        """用户注册"""
        logger.info("=== 用户注册过程 service.py/register_user ===")
        logger.info("注册参数:")
        logger.info("- 手机号: %s", phone)
        logger.info("- 验证码: %s", captcha)
        logger.info("- 密码长度: %d", len(password))

        try:
            # 验证验证码
            if not captcha:
                raise ValueError('验证码不能为空')
            
            if not AuthService.verify_captcha(phone, captcha, 'register'):
                raise ValueError('验证码验证失败')
            
            # 检查用户是否已存在
            if User.objects.filter(phone=phone).exists():
                raise ValueError('该手机号已注册')
            
            # 创建用户
            user = User.objects.create_user(phone=phone, password=password)

            logger.info("用户创建成功: %s", user.phone)
            logger.info("传递完整用户对象到给到 generate_tokens 方法", user)
            return AuthService.generate_tokens(user)
        

        except Exception as e:
            logger.error("注册过程出错: %s", str(e))
            raise


    # -----------  密码重置 done test   -------------
    @staticmethod
    def reset_password(phone: str, new_password: str, captcha: str):
        """重置密码
        注意：new_password 已经在序列化器层面验证过两次输入是否一致
        """
        logger.info("=== 密码重置过程 service.py/reset_password ===")
        logger.info("重置参数:")
        logger.info("- 手机号: %s", phone)
        logger.info("- 验证码: %s", captcha)
        logger.info("- 新密码长度: %d", len(new_password))

        # 验证验证码
        if not AuthService.verify_captcha(phone, captcha, 'resetPassword'):
            logger.error("验证码验证失败")
            raise ValueError('验证码验证失败')
        
        # 更新密码
        user = User.objects.filter(phone=phone).first()
        if not user:
            logger.error("用户不存在: %s", phone)
            raise ValueError('用户不存在')
        
        user.set_password(new_password)
        user.save()
        logger.info("密码重置成功: %s", user.phone)
        return True




    @staticmethod
    def handle_wechat_login(code: str):
        """处理微信登录"""
        logger.info("=== 微信登录过程 service.py/handle_wechat_login ===")
        logger.info("登录参数:")
        logger.info("- 微信code: %s", code)
        # TODO: 调用微信API获取用户信息
        # 这里需要实现微信登录的具体逻辑
        pass

    @staticmethod
    def bind_wechat_phone(phone: str, captcha: str, temp_token: str):
        """绑定微信手机号"""
        logger.info("=== 微信绑定手机号过程 service.py/bind_wechat_phone ===")
        logger.info("绑定参数:")
        logger.info("- 手机号: %s", phone)
        logger.info("- 验证码: %s", captcha)
        logger.info("- 临时令牌: %s", temp_token)
        # TODO: 实现微信手机号绑定逻辑
        pass 