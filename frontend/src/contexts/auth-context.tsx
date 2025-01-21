import { createContext, ReactNode, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { auth, User, LoginCredentials, RegisterCredentials, AuthResponse } from '@/api/auth'
import { useNavigate } from '@tanstack/react-router'


// 定义AuthContextType类型（接口），描述上下文中包含的状态和方法 
interface AuthContextType {
  user: User | null | undefined
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<AuthResponse>
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>
  logout: () => Promise<void>
}

// 创建认证的上下文
const AuthContext = createContext<AuthContextType | null>(null)


//========================= 提供认证上下文的组件 ==========================
//  AuthProvider 组件是上下文的提供者，包裹在应用的组件树中，允许子组件访问上下文的值
export function AuthProvider({ children }: { children: ReactNode }) {

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // 使用useQuery获取当前用户信息
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: auth.getCurrentUser,
  })

  // 登录mutation
  const loginMutation = useMutation({
    mutationFn: auth.login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token)
      queryClient.setQueryData(['auth-user'], data.user)
      navigate({ to: '/' })
    },
  })

  // 注册mutation
  const registerMutation = useMutation({
    mutationFn: auth.register,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token)
      queryClient.setQueryData(['auth-user'], data.user)
      navigate({ to: '/' })
    },
  })

  // 登出mutation
  const logoutMutation = useMutation({
    mutationFn: auth.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth-user'], null)
      navigate({ to: '/auth/login' })
    },
  })

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


// 自定义hook
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
  }