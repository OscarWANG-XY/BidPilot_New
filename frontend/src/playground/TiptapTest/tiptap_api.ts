// src/api/testgroundApi.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Define the TestGround type based on your Django model
export interface TipTap {
  id: number;
  name: string;
  description: string;
  tiptap_content: string;
  created_at: string;
  updated_at: string;
}

// Define the input type for creating and updating
export interface TipTapInput {
  name: string;
  description: string;
  tiptap_content: string;
}

// Create an axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions for TipTap
export const tipTapApi = {
  // Get all TipTaps
  getAll: async (): Promise<TipTap[]> => {
    console.log('向后端GET请求，端点为', '/testground/')
    const response = await apiClient.get<TipTap[]>('/testground/');
    console.log('GET返回的数据：', response.data)
    return response.data;
    
  },

  // Get a specific TipTap by ID
  getById: async (id: number): Promise<TipTap> => {
    console.log('向后端GET请求，端点为', `/testground/${id}/`)
    const response = await apiClient.get<TipTap>(`/testground/${id}/`);
    console.log('GETById返回的数据：', response.data)
    return response.data;
  },

  // Create a new TipTap
  create: async (tipTap: TipTapInput): Promise<TipTap> => {
    console.log('向后端POST请求，端点为', '/testground/', '请求体为', tipTap)
    const response = await apiClient.post<TipTap>('/testground/', tipTap);
    console.log('POST请求返回的数据：', response.data)
    return response.data;
  },

  // Update a TipTap
  update: async (id: number, tipTap: TipTapInput): Promise<TipTap> => {
    console.log('向后端PUT请求，端点为', `/testground/${id}/`, '请求体为', tipTap)
    const response = await apiClient.put<TipTap>(`/testground/${id}/`, tipTap);
    console.log('PUT请求返回的数据：', response.data)
    return response.data;
  },

  // Partially update a TipTap
  partialUpdate: async (id: number, tipTap: Partial<TipTapInput>): Promise<TipTap> => {
    console.log('向后端PATCH请求，端点为', `/testground/${id}/`, '请求体为', tipTap)
    const response = await apiClient.patch<TipTap>(`/testground/${id}/`, tipTap);
    console.log('PATCH请求返回的数据：', response.data)
    return response.data;
  },

  // Delete a TipTap
  delete: async (id: number): Promise<void> => {
    console.log('向后端DELETE请求，端点为', `/testground/${id}/`)
    await apiClient.delete(`/testground/${id}/`);
  },
};

