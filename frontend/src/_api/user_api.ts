// src/api/user_api.ts

// 导入配置好的 axios 实例
import axiosInstance from './axios_instance';

// 导入自定义类型定义
// UserResponse: 表示从API返回的用户信息的数据结构
// UserUpdateInput: 表示更新用户信息时所需的输入数据结构
import { UserResponse, UserUpdateInput } from '@/_types/user_dt_stru';

// 导入自定义错误类型
// ApiError: 表示API返回的错误信息的数据结构
import { ApiError } from '@/_types/error_dt_stru';

import { AxiosError } from 'axios';

/**
 * 统一的错误处理函数
 * @param error - 捕获的错误
 * @param operation - 操作名称，用于错误日志
 * @throws {ApiError} - API 错误
 * @throws {Error} - 通用错误
 */
const handleApiError = (error: unknown, operation: string): never => {
  console.error(`❌ [user_api.ts] ${operation} 失败:`, error);
  
  if (error instanceof AxiosError && error.response?.data) {
    console.error(`❌ [user_api.ts] ${operation} API错误响应:`, error.response.data);
    throw error.response.data as ApiError;
  }
  
  throw new Error(`Failed to ${operation}`);
};

/**
 * =获取当前用户信息
 * 这是一个异步函数，返回一个Promise，解析为UserResponse类型的数据
 * @returns {Promise<UserResponse>} - 返回当前用户的信息
 * @throws {ApiError} - 如果请求失败且API返回了错误信息
 * @throws {Error} - 如果请求失败且没有明确的API错误信息
 */
export const getCurrentUser = async (): Promise<UserResponse> => {
  try {
    console.log('🔍 [user_api.ts] 开始获取当前用户信息');
    const response = await axiosInstance.get(`/auth/profile/`);
    console.log('✅ [user_api.ts] 获取用户信息成功:', response.data);
    return response.data as UserResponse;
  } catch (error) {
    return handleApiError(error, 'fetch current user');
  }
};

/**
 * ========================= 更新用户信息 done check! =========================
 * 这是一个异步函数，返回一个Promise，解析为UserResponse类型的数据
 * @param {string} userId - 需要更新的用户的ID
 * @param {UserUpdateInput} data - 更新用户信息所需的输入数据
 * @returns {Promise<UserResponse>} - 返回更新后的用户信息
 * @throws {ApiError} - 如果请求失败且API返回了错误信息
 * @throws {Error} - 如果请求失败且没有明确的API错误信息
 */
export const updateUser = async (userId: string, data: UserUpdateInput): Promise<UserResponse> => {
  try {
    console.log('🔍 [user_api.ts] 开始更新用户信息:', { userId, data });
    const response = await axiosInstance.put(`/auth/profile/`, data);
    console.log('✅ [user_api.ts] 更新用户信息成功:', response.data);
    return response.data as UserResponse;
  } catch (error) {
    return handleApiError(error, 'update user');
  }
};