from django.urls import path
from .views import (
    RegisterView,
    PasswordLoginView,
    CaptchaLoginView,
    CaptchaRequestView,
    PasswordResetView,
    WechatLoginView,
    WechatBindPhoneView,
    UserProfileView,
    LogoutView
)

app_name = 'authentication'

urlpatterns = [
    # 用户注册相关
    path('register/', RegisterView.as_view(), name='register'),
    
    # 登录相关
    path('login/password/', PasswordLoginView.as_view(), name='password-login'),
    path('login/captcha/', CaptchaLoginView.as_view(), name='captcha-login'),
    path('login/wechat/', WechatLoginView.as_view(), name='wechat-login'),
    
    # 验证码相关
    path('captcha/', CaptchaRequestView.as_view(), name='request-captcha'),
    
    # 密码重置
    path('password/reset/', PasswordResetView.as_view(), name='password-reset'),
    
    # 微信绑定手机
    path('wechat/bind/', WechatBindPhoneView.as_view(), name='wechat-bind'),
    
    # 用户信息
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    
    # 登出
    path('logout/', LogoutView.as_view(), name='logout'),
] 