// src/api/user_api.ts

import axios from 'axios';
import { UserResponse, UserUpdateInput } from '@/types/user_dt_stru';
import { ApiError } from '@/types/error_dt_stru';

const API_BASE_URL = 'https://your-api-endpoint.com/api';

// 获取当前用户信息
export const getCurrentUser = async (): Promise<UserResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/me`);
    return response.data as UserResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as ApiError;
    }
    throw new Error('Failed to fetch current user');
  }
};

// 更新用户信息
export const updateUser = async (userId: string, data: UserUpdateInput): Promise<UserResponse> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/${userId}`, data);
    return response.data as UserResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data as ApiError;
    }
    throw new Error('Failed to update user');
  }
};