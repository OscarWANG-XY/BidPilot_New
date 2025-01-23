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
    queryKey: ['auth-user'], // 缓存的唯一标识符
    queryFn: getCurrentUser, // 获取用户数据的函数
    staleTime: 1000 * 60 * 5, // 数据缓存的有效时间（5 分钟）
    initialData: null, // 初始数据为 null
  });

  
  // 定义请求验证码的 mutation
  const requestCaptchaMutation = useMutation({
    mutationFn: (params: { phone: string; type: 'login' | 'register' | 'resetPassword' }) =>
      requestCaptcha({ phone: params.phone, type: params.type }), // 调用 API 请求验证码
  });

  // -------------------  定义登录的 mutation （测试通过）  -------------------  
  console.log('AuthContext 识别的登录方式：', LoginMethod);
  const loginMutation = useMutation({
    mutationFn: (params: {
      method: LoginMethod;
      credentials: CaptchaLoginForm | PasswordLoginForm | WechatLoginRequest;
    }) => login(params.method, params.credentials), // 调用 API 进行登录
    onSuccess: (data) => {
      if ('token' in data) {
        // 如果是密码登录或验证码登录成功
        localStorage.setItem('token', data.token); // 将 token 存储到 localStorage
        queryClient.setQueryData(['auth-user'], data.user); // 更新用户数据
        navigate({ to: '/' }); // 导航到首页
      } else {
        // 如果是微信登录成功，返回 WechatLoginResponse
        return data;
      }
    },
  });

  // 定义绑定手机号的 mutation
  const bindPhoneMutation = useMutation({
    mutationFn: bindPhoneAfterWechatLogin, // 调用 API 绑定手机号
    onSuccess: (data) => {
      localStorage.setItem('token', data.token); // 将 token 存储到 localStorage
      queryClient.setQueryData(['auth-user'], data.user); // 更新用户数据
      navigate({ to: '/' }); // 导航到首页
    },
  });

  // -------------------  定义注册的 mutation （测试通过）  -------------------  
  const registerMutation = useMutation({
    mutationFn: registerUser, // 调用 API 进行注册
    onSuccess: (data) => {
      localStorage.setItem('token', data.token); // 将 token 存储到 localStorage
      queryClient.setQueryData(['auth-user'], data.user); // 更新用户数据
      navigate({ to: '/' }); // 导航到首页
    },
  });

  // 定义忘记密码的 mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword, // 调用 API 处理忘记密码
  });

  // -------------------  定义注销方法（测试通过）  -------------------  
  const logout = () => {
    localStorage.removeItem('token'); // 清除 localStorage 中的 token
    queryClient.setQueryData(['auth-user'], null); // 将用户数据设置为 null
    queryClient.invalidateQueries({ queryKey: ['auth-user'] }); // 强制刷新用户数据查询
    navigate({ to: '/auth/login' }); // 导航到登录页面
  };


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
    logout, // 注销
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