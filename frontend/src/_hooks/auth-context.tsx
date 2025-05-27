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
} from '@/_types/auth_dt_stru';
import {
  requestCaptcha,
  login,
  bindPhoneAfterWechatLogin,
  registerUser,
  forgotPassword,
  logout,
} from '@/_api/auth_api/auth_api'
import { UserResponse } from '@/_types/user_dt_stru';
import { getCurrentUser} from '@/_api/auth_api/user_api';

const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken'
} as const;

// 定义 AuthContextType 类型，用于描述AuthContext对象的结构
interface AuthContextType {
    user: UserResponse | null; // 当前用户信息
    isAuthenticated: boolean; // 用户是否已认证
    isLoading: boolean; // 是否正在加载用户数据
    requestCaptcha: (phone: string, type: 'login' | 'register' | 'resetPassword') => Promise<void>; // 请求验证码
    login: (
      method: LoginMethod,
      credentials: CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest,
    ) => Promise<AuthResponse | WechatLoginResponse>; // 登录方法
    bindPhone: (form: WechatBindPhoneForm) => Promise<AuthResponse>; // 绑定手机号
    register: (form: RegisterForm) => Promise<AuthResponse>; // 注册方法
    logout: () => void; // 注销方法
    forgotPassword: (form: ForgotPasswordForm) => Promise<void>; // 忘记密码方法
  }

// 创建 AuthContext，初始值为 null
const AuthContext = createContext<AuthContextType | null>(null);

// ========================= AuthProvider 组件，用于提供认证相关的状态和方法 done check! =========================
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient(); // 获取 React Query 的 queryClient
  const navigate = useNavigate(); // 获取路由导航方法

  
  // 使用 useQuery 获取当前用户信息
  const { data: user, isLoading } = useQuery<UserResponse | null>({
    queryKey: ['auth-user'],
    queryFn: async () => {
      console.log('[AuthContext] 开始获取当前用户信息');
      try {
        const userData = await getCurrentUser();
        console.log('[AuthContext] 获取用户信息成功:', userData);
        return userData;
      } catch (error) {
        console.error('[AuthContext] 获取用户信息失败:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    initialData: null,
  });

  
  // ------------------ 定义请求验证码的 mutation  ------------------
  // 与后端连接 测试完成 
  const requestCaptchaMutation = useMutation({
    mutationFn: (params: { phone: string; type: 'login' | 'register' | 'resetPassword' }) => {
      console.log('[AuthContext] 请求验证码 - 开始:', params);
      return requestCaptcha({ phone: params.phone, type: params.type });
    },
    onSuccess: (data) => {
      console.log('[AuthContext] 验证码请求成功:', data);
    },
    onError: (error) => {
      console.error('[AuthContext] 验证码请求失败:', error);
    }
  });

  // -------------------  登录的 mutation （测试通过）  -------------------  
  const loginMutation = useMutation({
    mutationFn: (params: {
      method: LoginMethod;
      credentials: CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest;
    }) => {
      console.log('[AuthContext] 登录请求 - 开始:', {
        method: params.method,
        credentials: { ...params.credentials, password: '***' } // 隐藏密码
      });
      return login(params.method, params.credentials);
    },
    onSuccess: (data) => {
      console.log('[AuthContext] 登录成功, 响应数据:', {
        ...data,
        token: '***', // 隐藏敏感信息
        refreshToken: '***'
      });

      if ('token' in data) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        console.log('[AuthContext] Token 已存储到 localStorage');

        queryClient.setQueryData(['auth-user'], data.user);
        console.log('[AuthContext] 用户数据已更新到缓存');
        
        navigate({ to: '/' });
      }
      return data;
    },
    onError: (error) => {
      console.error('[AuthContext] 登录失败:', error);
    }
  });

  // ------------------ 定义绑定手机号的 mutation  ------------------
  const bindPhoneMutation = useMutation({
    mutationFn: (form: WechatBindPhoneForm) => {
      console.log('[AuthContext] 绑定手机号 - 开始:', { ...form, captcha: '***' });
      return bindPhoneAfterWechatLogin(form);
    },
    onSuccess: (data) => {
      console.log('[AuthContext] 绑定手机号成功:', {
        ...data,
        token: '***'
      });
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['auth-user'], data.user);
      navigate({ to: '/' });
    },
    onError: (error) => {
      console.error('[AuthContext] 绑定手机号失败:', error);
    }
  });

  // -------------------  定义注册的 mutation （测试通过）  -------------------  
  // 与后端连接中
  const registerMutation = useMutation({
    mutationFn: (form: RegisterForm) => {
      console.log('[AuthContext] 注册请求 - 开始:', {
        ...form,
        password: '***',
        captcha: '***'
      });
      return registerUser(form);
    },
    onSuccess: (data) => {
      console.log('[AuthContext] 注册成功:', {
        ...data,
        token: '***',
        refreshToken: '***'
      });
      
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      
      const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      console.log('[AuthContext] Token 存储验证:', {
        hasToken: !!localStorage.getItem(STORAGE_KEYS.TOKEN),
        hasRefreshToken: !!storedRefreshToken
      });
      
      queryClient.setQueryData(['auth-user'], data.user);
      navigate({ to: '/' });
    },
    onError: (error) => {
      console.error('[AuthContext] 注册失败:', error);
    }
  });

  // 定义忘记密码的 mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (form: ForgotPasswordForm) => {
      console.log('[AuthContext] 重置密码 - 开始:', {
        ...form,
        newPassword: '***',
        confirmPassword: '***',
        captcha: '***'
      });
      return forgotPassword(form);
    },
    onSuccess: () => {
      console.log('[AuthContext] 重置密码成功');
    },
    onError: (error) => {
      console.error('[AuthContext] 重置密码失败:', error);
    }
  });

  // -------------------  定义注销方法  -------------------  
  const logoutMutation = useMutation({
    mutationFn: (refreshToken: string) => {
      console.log('[AuthContext] 注销请求 - 开始');
      return logout(refreshToken);
    },
    onSuccess: () => {
      console.log('[AuthContext] 注销成功 - 开始清理本地数据');
      
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      console.log('[AuthContext] localStorage 已清理');
      
      queryClient.setQueryData(['auth-user'], null);
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      console.log('[AuthContext] 用户数据缓存已清理');
      
      setTimeout(() => {
        console.log('[AuthContext] 开始导航到登录页');
        navigate({ to: '/auth/login' });
      }, 1000);
    },
    onError: (error) => {
      console.error('[AuthContext] 注销失败:', error);
      console.log('[AuthContext] 尽管注销失败，仍清理本地数据');
      
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      queryClient.setQueryData(['auth-user'], null);
      
      setTimeout(() => {
        navigate({ to: '/auth/login' });
      }, 1000);
    }
  });

  // 暴露的上下文值，包含用户状态和操作方法
  const value = {
    user, // 当前用户信息
    isAuthenticated: !!user, // 用户是否已认证
    isLoading, // 是否正在加载用户数据
    requestCaptcha: (phone: string, type: 'login' | 'register' | 'resetPassword') =>
      requestCaptchaMutation.mutateAsync({ phone, type }), // 请求验证码
    login: (method: LoginMethod, credentials: CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest) =>
      loginMutation.mutateAsync({ method, credentials }), // 登录
    bindPhone: (form: WechatBindPhoneForm) => bindPhoneMutation.mutateAsync(form), // 绑定手机号
    register: (form: RegisterForm) => registerMutation.mutateAsync(form), // 注册
    logout: () => {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      console.log('[AuthContext] logout 获取的 refreshToken：', refreshToken);
      if (refreshToken) {
        return logoutMutation.mutateAsync(refreshToken);
      } else {
        // 如果没有 refresh_token，直接执行清理操作
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        queryClient.setQueryData(['auth-user'], null);
        setTimeout(() => {
          navigate({ to: '/auth/login' });
        }, 1000);
      }
    },
    forgotPassword: (form: ForgotPasswordForm) => forgotPasswordMutation.mutateAsync(form), // 忘记密码
  };


  // 返回 AuthContext.Provider，将 value 提供给子组件
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 自定义 hook，用于在组件中访问 AuthContext
export function useAuth() {
  const context = useContext(AuthContext); // 获取上下文
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider'); // 如果上下文不存在，抛出错误
  }
  return context; // 返回上下文值
}