import axios from 'axios'

// 定义接口
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  username: string
}

export interface User {
  id: number
  email: string
  username: string
}

export interface AuthResponse {
  user: User
  token: string
}

// 创建axios实例
const authApi = axios.create({
  baseURL: 'http://localhost:3000', // json-server默认端口
})

export const auth = {
  // 登录
  async login(credentials: LoginCredentials) {
    const { data } = await authApi.post<AuthResponse>('/auth/login', credentials)
    return data
  },

  // 注册
  async register(credentials: RegisterCredentials) {
    const { data } = await authApi.post<AuthResponse>('/auth/register', credentials)
    return data
  },

  // 获取当前用户信息
  async getCurrentUser() {
    const token = localStorage.getItem('token')
    if (!token) return null

    const { data } = await authApi.get<User>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return data
  },

  // 登出
  async logout() {
    localStorage.removeItem('token')
  },
}
