// src/types/error.ts

// 通用错误响应
export interface ApiError {
    statusCode: number; // HTTP 状态码
    message: string; // 错误信息
    error?: string; // 错误类型
    details?: any; // 错误详情
  }
  
  // 验证码错误
  export interface CaptchaError extends ApiError {
    error: 'CAPTCHA_ERROR';
    details: {
      retryAfter: number; // 重试等待时间（秒）
    };
  }
  
  // 登录错误
  export interface LoginError extends ApiError {
    error: 'LOGIN_ERROR';
    details: {
      remainingAttempts: number; // 剩余尝试次数
    };
  }
  
  // 注册错误
  export interface RegisterError extends ApiError {
    error: 'REGISTER_ERROR';
    details: {
      field: 'phone' | 'captcha' | 'password'; // 错误字段
    };
  }
  
  // 微信登录错误
  export interface WechatLoginError extends ApiError {
    error: 'WECHAT_LOGIN_ERROR';
    details: {
      reason: 'invalid_code' | 'user_not_found'; // 错误原因
    };
  }