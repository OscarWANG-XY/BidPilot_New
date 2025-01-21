import { createContext, ReactNode, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  LoginMethod,
  CaptchaLoginForm,
  PasswordLoginForm,
  WechatLoginRequest,
  WechatBindPhoneForm,
  RegisterForm,
  ForgotPasswordForm,
  AuthResponse,
  WechatLoginResponse,
} from '@/types/auth_dt_stru';
import {
  requestCaptcha,
  login,
  bindPhoneAfterWechatLogin,
  registerUser,
  forgotPassword,
} from '@/api/auth_api'
import { UserResponse } from '@/types/user_dt_stru';
import { getCurrentUser} from '@/api/user_api';

// 定义 AuthContextType 类型
interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestCaptcha: (phone: string, type: 'login' | 'register' | 'resetPassword') => Promise<void>;
  login: (
    method: LoginMethod,
    credentials: CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest,
  ) => Promise<AuthResponse | WechatLoginResponse>;
  bindPhone: (form: WechatBindPhoneForm) => Promise<AuthResponse>;
  register: (form: RegisterForm) => Promise<AuthResponse>;
  logout: () => void;
  forgotPassword: (form: ForgotPasswordForm) => Promise<void>;
}

// 创建 AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider 组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 获取当前用户信息
  const { data: user, isLoading } = useQuery<UserResponse | null>({
    queryKey: ['auth-user'],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 分钟缓存
    initialData: null,
  });

  // 请求验证码 mutation
  const requestCaptchaMutation = useMutation({
    mutationFn: (params: { phone: string; type: 'login' | 'register' | 'resetPassword' }) =>
      requestCaptcha({ phone: params.phone, type: params.type }),
  });

  // 登录 mutation
  const loginMutation = useMutation({
    mutationFn: (params: {
      method: LoginMethod;
      credentials: CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest;
    }) => login(params.method, params.credentials),
    onSuccess: (data) => {
      if ('token' in data) {
        // 密码登录或验证码登录成功
        localStorage.setItem('token', data.token);
        queryClient.setQueryData(['auth-user'], data.user);
        navigate({ to: '/' });
      } else {
        // 微信登录成功，返回 WechatLoginResponse
        return data;
      }
    },
  });

  // 绑定手机号 mutation
  const bindPhoneMutation = useMutation({
    mutationFn: bindPhoneAfterWechatLogin,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['auth-user'], data.user);
      navigate({ to: '/' });
    },
  });

  // 注册 mutation
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['auth-user'], data.user);
      navigate({ to: '/' });
    },
  });

  // 忘记密码 mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
  });

  // 注销方法
  const logout = () => {
    localStorage.removeItem('token');
    queryClient.setQueryData(['auth-user'], null);
    navigate({ to: '/auth/login' });
  };

  // 暴露的上下文值
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    requestCaptcha: (phone: string, type: 'login' | 'register' | 'resetPassword') =>
      requestCaptchaMutation.mutateAsync({ phone, type }),
    login: (method: LoginMethod, credentials: CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest) =>
      loginMutation.mutateAsync({ method, credentials }),
    bindPhone: (form: WechatBindPhoneForm) => bindPhoneMutation.mutateAsync(form),
    register: (form: RegisterForm) => registerMutation.mutateAsync(form),
    logout,
    forgotPassword: (form: ForgotPasswordForm) => forgotPasswordMutation.mutateAsync(form),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 自定义 hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}