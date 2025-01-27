import { UserResponse } from "./user_dt_stru";
// src/types/auth.ts

// 登录方式枚举
export enum LoginMethod {
    PASSWORD = 'password', // 密码登录
    CAPTCHA = 'captcha', // 验证码登录
    WECHAT = 'wechat', // 微信扫码登录
  }
  
  // 验证码登录表单
  export interface CaptchaLoginForm {
    phone: string; // 手机号
    captcha: string; // 验证码
    agreeToTerms: boolean; // 是否同意协议和隐私政策
  }
  
  // 密码登录表单
  export interface PasswordLoginForm {
    phoneOrEmail: string; // 手机号或邮箱
    password: string; // 密码
    agreeToTerms: boolean; // 是否同意协议和隐私政策
  }
  
  // 注册表单
  export interface RegisterForm {
    phone: string; // 手机号
    captcha: string; // 验证码
    password: string; // 密码
    confirmPassword: string; // 确认密码
    agreeToTerms: boolean; // 是否同意协议和隐私政策
  }
  
  // 忘记密码表单
  export interface ForgotPasswordForm {
    phone: string; // 手机号
    captcha: string; // 验证码
    newPassword: string; // 新密码
    confirmPassword: string; // 确认密码
  }
  
  // 微信扫码登录后绑定手机号表单
  export interface WechatBindPhoneForm {
    phone: string; // 手机号
    captcha: string; // 验证码
  }
  
  // 登录响应
  export interface AuthResponse {
    token: string;
    refreshToken: string;  // 确保这里使用的是 refreshToken 而不是 refresh_token
    user: UserResponse;
  }
  
  // 验证码请求
  export interface CaptchaRequest {
    phone: string; // 手机号
    type: 'login' | 'register' | 'resetPassword'; // 验证码类型
  }
  
  // 微信扫码登录请求
  export interface WechatLoginRequest {
    code: string; // 微信授权码
  }
  
  // 微信扫码登录响应
  export interface WechatLoginResponse {
    tempToken: string; // 临时令牌，用于绑定手机号
    wechatUserInfo?: {
      nickname: string; // 微信昵称
      avatar: string; // 微信头像
    };
  }