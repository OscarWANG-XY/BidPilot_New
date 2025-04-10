// src/types/user.ts

// 用户基本信息
export interface User {
    id: string; // 用户唯一标识
    phone: string; // 手机号
    email?: string; // 邮箱（可选）
    username?: string; // 用户名（可选）
    password?: string; // 密码（仅在创建或更新时使用）
    wechatId?: string; // 微信唯一标识
    role: 'user' | 'admin'; // 用户角色
    createdAt: Date; // 创建时间
    updatedAt: Date; // 更新时间
  }
  
  // 用户注册输入
  export interface UserCreateInput {
    phone: string; // 手机号
    password: string; // 密码
    captcha: string; // 验证码
    agreeToTerms: boolean; // 是否同意协议和隐私政策
  }
  
  // 用户更新输入
  export interface UserUpdateInput {
    phone?: string; // 手机号
    email?: string; // 邮箱
    password?: string; // 密码
    wechatId?: string; // 微信唯一标识
  }
  
  // 用户响应
  export interface UserResponse {
    id: string;
    phone: string;
    email?: string;
    username?: string;
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
  }
  
  // 微信用户信息
  export interface WechatUserInfo {
    nickname: string; // 微信昵称
    avatar: string; // 微信头像
  }