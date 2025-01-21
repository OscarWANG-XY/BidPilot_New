// src/api/auth_api.ts

import axios from 'axios';
import {
  LoginMethod,
  CaptchaLoginForm,
  PasswordLoginForm,
  AuthResponse,
  CaptchaRequest,
  WechatLoginRequest,
  WechatLoginResponse,
  WechatBindPhoneForm,
  ForgotPasswordForm,
  RegisterForm,
} from '@/types/auth_dt_stru';
import {
  ApiError,
  CaptchaError,
  LoginError,
  WechatLoginError,
  RegisterError,
} from '@/types/error_dt_stru';

const API_BASE_URL = 'http://localhost:3000' // json-server默认端口

// 获取验证码
export const requestCaptcha = async (data: CaptchaRequest): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/auth/captcha`, data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as CaptchaError;
      }
      throw new Error('Failed to request captcha');
    }
  };
  
  // 统一登录方法
  export const login = async (
    method: LoginMethod,
    credentials: CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest,
  ): Promise<AuthResponse | WechatLoginResponse> => {
    try {
      let endpoint = '';
      switch (method) {
        case LoginMethod.CAPTCHA:
          endpoint = `${API_BASE_URL}/auth/login/captcha`;
          break;
        case LoginMethod.PASSWORD:
          endpoint = `${API_BASE_URL}/auth/login/password`;
          break;
        case LoginMethod.WECHAT:
          endpoint = `${API_BASE_URL}/auth/login/wechat`;
          break;
        default:
          throw new Error('Invalid login method');
      }
      const response = await axios.post(endpoint, credentials);
  
      // 如果是微信登录，返回 WechatLoginResponse
      if (method === LoginMethod.WECHAT) {
        return response.data as WechatLoginResponse;
      }
  
      // 其他登录方式返回 AuthResponse
      return response.data as AuthResponse;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as LoginError | WechatLoginError;
      }
      throw new Error('Failed to login');
    }
  };
  
  // 微信扫码登录后绑定手机号
  export const bindPhoneAfterWechatLogin = async (form: WechatBindPhoneForm): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/wechat/bind-phone`, form);
      return response.data as AuthResponse;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to bind phone after WeChat login');
    }
  };
  
  // 忘记密码
  export const forgotPassword = async (form: ForgotPasswordForm): Promise<void> => {
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, form);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as ApiError;
      }
      throw new Error('Failed to reset password');
    }
  };
  
  // 用户注册
  export const registerUser = async (form: RegisterForm): Promise<AuthResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, form);
      return response.data as AuthResponse;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data as RegisterError;
      }
      throw new Error('Failed to register user');
    }
  };