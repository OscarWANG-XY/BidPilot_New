// src/api/auth_api.ts

// 导入 axios 库，用于发送 HTTP 请求
import axios from 'axios';

// 导入与认证相关的类型定义
import {
  LoginMethod,           // 登录方法的枚举类型（如验证码登录、密码登录、微信登录）
  CaptchaLoginForm,      // 验证码登录表单数据类型
  PasswordLoginForm,     // 密码登录表单数据类型
  AuthResponse,          // 认证成功后的响应数据类型
  CaptchaRequest,        // 请求验证码的数据类型
  WechatLoginRequest,    // 微信登录请求数据类型
  WechatLoginResponse,   // 微信登录响应数据类型
  WechatBindPhoneForm,   // 微信登录后绑定手机号的数据类型
  ForgotPasswordForm,    // 忘记密码表单数据类型
  RegisterForm,          // 用户注册表单数据类型
} from '@/types/auth_dt_stru';

// 导入与错误相关的类型定义
import {
  ApiError,             // 通用 API 错误类型
  CaptchaError,         // 验证码请求错误类型
  LoginError,           // 登录错误类型
  WechatLoginError,     // 微信登录错误类型
  RegisterError,        // 用户注册错误类型
} from '@/types/error_dt_stru';

// 定义 API 的基础 URL，这里使用的是本地开发服务器的默认端口
//const API_BASE_URL = 'http://localhost:3000'; // json-server 默认端口
const API_BASE_URL = '/api'; // Django 后端端口

// 所有的端点都应该以斜杠结尾
const endpoints = {
  captcha: `${API_BASE_URL}/auth/captcha/`,
  passwordLogin: `${API_BASE_URL}/auth/login/password/`,
  captchaLogin: `${API_BASE_URL}/auth/login/captcha/`,
  wechatLogin: `${API_BASE_URL}/auth/login/wechat/`,
  register: `${API_BASE_URL}/auth/register/`,
  forgotPassword: `${API_BASE_URL}/auth/password/reset/`,
  wechatBindPhone: `${API_BASE_URL}/auth/wechat/bind/`,
  logout: `${API_BASE_URL}/auth/logout/`,
};

/**
 * ========================= 请求验证码 done check! =========================
 * 与后端连接 测试完成 
 * @param data - 验证码请求数据，类型为 CaptchaRequest
 * @throws 如果请求失败，抛出 CaptchaError 或通用错误信息
 */
export const requestCaptcha = async (data: CaptchaRequest): Promise<void> => {
  try {
    // ******  添加控制台日志 
    console.log('[API] requestCaptcha 请求验证码的端点：', endpoints.captcha);
    console.log('[API] requestCaptcha 请求验证码的数据：', data);

    // 发送 POST 请求到 /auth/captcha 端点，请求验证码
    const response = await axios.post(endpoints.captcha, data);
    
    // ******  添加控制台日志  
    console.log('[API] requestCaptcha 验证码请求发送成功，服务器响应：', response.data);

  } catch (error) {
    // 如果请求失败，检查是否是 Axios 错误
    if (axios.isAxiosError(error) && error.response) {
      // 抛出服务器返回的错误信息，类型为 CaptchaError
      throw error.response.data as CaptchaError;
    }
    // 如果是其他错误，抛出通用错误信息
    throw new Error('Failed to request captcha');
  }
};



/**
 * ========================= 统一登录方法，支持验证码登录、密码登录和微信登录 （部分测试通过） =========================
 * 测试中
 * @param method - 登录方法，类型为 LoginMethod 枚举
 * @param credentials - 登录凭证，类型为 CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest
 * @returns 返回登录成功的响应数据，类型为 AuthResponse 或 WechatLoginResponse
 * @throws 如果登录失败，抛出 LoginError 或 WechatLoginError 或通用错误信息
 */
export const login = async (
    method: LoginMethod,
    credentials: CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest,
  ): Promise<AuthResponse | WechatLoginResponse> => {
    try {
      let endpoint = ''; // 初始化登录端点
      console.log('[API]准备登录的方法识别：', method);
      console.log('[API]准备登录的凭证：', credentials);
      // 根据登录方法选择对应的端点
      switch (method) {
        case LoginMethod.CAPTCHA:
          endpoint = endpoints.captchaLogin; // 验证码登录端点
          break;
        case LoginMethod.PASSWORD:
          endpoint = endpoints.passwordLogin; // 密码登录端点
          break;
        case LoginMethod.WECHAT:
          endpoint = endpoints.wechatLogin; // 微信登录端点
          break;
        default:
          throw new Error('Invalid login method'); // 如果登录方法无效，抛出错误
      }

    // ******  添加控制台日志 
    console.log('[API]login 登录的端点：', endpoint);
    console.log('[API]login 登录的凭证：', credentials);

    // 发送 POST 请求到对应的登录端点
    const response = await axios.post(endpoint, credentials);

    // ******  添加控制台日志 
    console.log('[API]login 登录发送成功，服务器响应：', response.data);

    // 如果是微信登录，返回 WechatLoginResponse 类型的数据
    if (method === LoginMethod.WECHAT) {
      return response.data as WechatLoginResponse;
    }

    // 其他登录方式返回 AuthResponse 类型的数据
    return response.data as AuthResponse;
  } catch (error) {
    // 如果请求失败，检查是否是 Axios 错误
    if (axios.isAxiosError(error) && error.response) {
      // 抛出服务器返回的错误信息，类型为 LoginError 或 WechatLoginError
      throw error.response.data as LoginError | WechatLoginError;
    }
    // 如果是其他错误，抛出通用错误信息
    throw new Error('Failed to login');
  }
};
  

/**
 * ========================= 微信扫码登录后绑定手机号 done check! =========================
 * @param form - 绑定手机号的表单数据，类型为 WechatBindPhoneForm
 * @returns 返回绑定成功后的认证数据，类型为 AuthResponse
 * @throws 如果绑定失败，抛出 ApiError 或通用错误信息
 */
export const bindPhoneAfterWechatLogin = async (form: WechatBindPhoneForm): Promise<AuthResponse> => {
    try {
      // 添加调试日志
      console.log('[API] bindPhoneAfterWechatLogin 开始绑定手机号请求');
      console.log('[API] bindPhoneAfterWechatLogin 请求的端点：', endpoints.wechatBindPhone);
      console.log('[API] bindPhoneAfterWechatLogin 请求数据：', form);

      const response = await axios.post(endpoints.wechatBindPhone, form);
      
      // 添加成功响应日志
      console.log('[API] bindPhoneAfterWechatLogin 请求成功，服务器响应：', response.data);
      return response.data as AuthResponse;
    } catch (error) {
      // 添加错误日志
      console.error('[API] bindPhoneAfterWechatLogin 请求失败:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[API] bindPhoneAfterWechatLogin 服务器错误响应:', error.response.data);
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to bind phone after WeChat login');
    }
};



/**
 * ========================= 忘记密码 （测试通过） =========================
 * @param form - 忘记密码的表单数据，类型为 ForgotPasswordForm
 * @throws 如果请求失败，抛出 ApiError 或通用错误信息
 */
export const forgotPassword = async (form: ForgotPasswordForm): Promise<void> => {
    try {
      // 添加调试日志
      console.log('[API] forgotPassword 开始重置密码请求');
      console.log('[API] forgotPassword 请求的端点：', endpoints.forgotPassword);
      console.log('[API] forgotPassword 请求数据：', form);

      const response = await axios.post(endpoints.forgotPassword, form);
      
      // 添加成功响应日志
      console.log('[API] forgotPassword 请求成功，服务器响应：', response.data);
    } catch (error) {
      // 添加错误日志
      console.error('[API] forgotPassword 请求失败:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[API] forgotPassword 服务器错误响应:', error.response.data);
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to reset password');
    }
};



/**
 * ========================= 用户注册 （测试通过！） =========================
 * 前后端集成测试通过
 * @param form - 用户注册的表单数据，类型为 RegisterForm
 * @returns 返回注册成功后的认证数据，类型为 AuthResponse
 * @throws 如果注册失败，抛出 RegisterError 或通用错误信息
 */
export const registerUser = async (form: RegisterForm): Promise<AuthResponse> => {
    try {

      // ******  添加控制台日志 
      console.log('[API] registerUser 注册的端点：', endpoints.register);
      console.log('[API] registerUser 发送注册请求的数据：', form);

      // 发送 POST 请求到 /auth/register 端点，请求用户注册
      const response = await axios.post(endpoints.register, form);

      // ******  添加控制台日志  
      console.log('[API] registerUser 注册发送成功，服务器响应：', response.data);

      // 返回注册成功后的认证数据
      return response.data as AuthResponse;


    } catch (error) {
      // 如果请求失败，检查是否是 Axios 错误
      if (axios.isAxiosError(error) && error.response) {
        // 抛出服务器返回的错误信息，类型为 RegisterError
        throw error.response.data as RegisterError;
      }
      // 如果是其他错误，抛出通用错误信息
      throw new Error('Failed to register user');
    }
  };

/**
 * ========================= 用户登出 =========================
 * 前后端集成测试通过
 * @param refreshToken - 需要失效的 refresh token
 * @throws 如果登出失败，抛出 ApiError 或通用错误信息
 */
export const logout = async (refreshToken: string): Promise<void> => {
  try {
    console.log('[API] logout 开始登出请求，请求的端点：', endpoints.logout);
    console.log('[API] logout 发送的 refreshToken：', refreshToken);
    
    const response = await axios.post(endpoints.logout, { refresh_token: refreshToken });
    console.log('[API] logout 请求成功，服务器响应：', response.data);

  } catch (error) {
    console.error('[API] logout 请求失败:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('[API] logout 服务器错误响应:', error.response.data);
      throw error.response.data as ApiError;
    }
    throw new Error('Failed to logout');
  }
};