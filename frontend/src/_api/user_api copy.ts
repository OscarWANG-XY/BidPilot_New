// src/api/user_api.ts

// 导入axios库，用于发送HTTP请求
import axios from 'axios';

// 导入自定义类型定义
// UserResponse: 表示从API返回的用户信息的数据结构
// UserUpdateInput: 表示更新用户信息时所需的输入数据结构
import { UserResponse, UserUpdateInput } from '@/_types/user_dt_stru';

// 导入自定义错误类型
// ApiError: 表示API返回的错误信息的数据结构
import { ApiError } from '@/_types/error_dt_stru';


/**
 * =获取当前用户信息
 * 这是一个异步函数，返回一个Promise，解析为UserResponse类型的数据
 * @returns {Promise<UserResponse>} - 返回当前用户的信息
 * @throws {ApiError} - 如果请求失败且API返回了错误信息，则抛出ApiError
 * @throws {Error} - 如果请求失败且没有明确的API错误信息，则抛出通用的错误信息
 */
export const getCurrentUser = async (): Promise<UserResponse> => {
  try {
    // 使用axios发送GET请求，获取当前用户信息
    // 请求的URL为 `${API_BASE_URL}/users/me`, 根据当前认证的用户返回用户信息
    const response = await axios.get(`/api/users/me`);

    // 如果请求成功，返回响应数据，并将其类型断言为UserResponse
    return response.data as UserResponse;
  } catch (error) {
    // 如果请求失败，捕获错误
    if (axios.isAxiosError(error) && error.response) {
      // 如果是axios的错误，并且有响应数据，抛出API返回的错误信息
      throw error.response.data as ApiError;
    }
    // 如果不是axios的错误，或者没有明确的API错误信息，抛出通用的错误信息
    throw new Error('Failed to fetch current user');
  }
};

/**
 * ========================= 更新用户信息 done check! =========================
 * 这是一个异步函数，返回一个Promise，解析为UserResponse类型的数据
 * @param {string} userId - 需要更新的用户的ID
 * @param {UserUpdateInput} data - 更新用户信息所需的输入数据
 * @returns {Promise<UserResponse>} - 返回更新后的用户信息
 * @throws {ApiError} - 如果请求失败且API返回了错误信息，则抛出ApiError
 * @throws {Error} - 如果请求失败且没有明确的API错误信息，则抛出通用的错误信息
 */
export const updateUser = async (userId: string, data: UserUpdateInput): Promise<UserResponse> => {
  try {
    // 使用axios发送PUT请求，更新指定用户的信息
    // 请求的URL为 `${API_BASE_URL}/users/${userId}`，请求体为data
    const response = await axios.put(`/api/users/${userId}`, data);

    // 如果请求成功，返回响应数据，并将其类型断言为UserResponse
    return response.data as UserResponse;
  } catch (error) {
    // 如果请求失败，捕获错误
    if (axios.isAxiosError(error) && error.response) {
      // 如果是axios的错误，并且有响应数据，抛出API返回的错误信息
      throw error.response.data as ApiError;
    }
    // 如果不是axios的错误，或者没有明确的API错误信息，抛出通用的错误信息
    throw new Error('Failed to update user');
  }
};