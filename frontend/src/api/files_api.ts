import axios from 'axios';

// BaseEntity类型: id, createdAt, createdBy, updatedAt?, updatedBy?, version
// FileRecord类型: name, url?, size, type, mimeType?, status, visibility, processingStatus, processingProgress?, errorMessage?, accessControl?, metadata?, remarks?
import { FileRecord } from '@/types/files_dt_stru';

const API_BASE_URL = '/api'; // Django 后端端口

// 所有的端点都应该以斜杠结尾
const endpoints = {
  files: `${API_BASE_URL}/files/`,
};



// --------------- 添加请求拦截器 --------------- 
axios.interceptors.request.use(function (config) {
    console.log('🔍 Request details:', {
        fullUrl: `${config.baseURL || ''}${config.url}`,
        method: config.method,
        headers: config.headers,
    });
    
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 添加响应拦截器 - 处理token过期问题
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 如果是401错误且不是刷新token的请求
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // 从localStorage获取refresh token
                const refreshToken = localStorage.getItem('refreshToken');
                
                if (!refreshToken) {
                    // 如果没有refresh token，重定向到登录页
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // 调用刷新token的API
                const response = await axios.post('/api/token/refresh/', {
                    refresh: refreshToken
                });

                // 更新localStorage中的token
                const { access } = response.data;
                localStorage.setItem('token', access);

                // 更新原始请求的Authorization header
                originalRequest.headers.Authorization = `Bearer ${access}`;

                // 重试原始请求
                return axios(originalRequest);
            } catch (refreshError) {
                // 如果刷新token失败，清除所有token并重定向到登录页
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);



// ================================ 文件 API  ============================================ 
export const fileApi = {


  // ----------- 获取所有文件 API.getAllFiles -------------
  getAllFiles: async (): Promise<FileRecord[]> => {
  
    const token = localStorage.getItem('token');
    console.log('[files_api.ts] Current token:', token);
    console.log('[files_api.ts] Authorization header:', `Bearer ${token}`);
    console.log('🔍 [files_api.ts] 开始获取文件列表...');
    try {
      console.log('🔍 [files_api.ts] 获取所有文件的端点:', endpoints.files);
      const { data } = await axios.get<FileRecord[]>(endpoints.files);
      console.log('✅ [files_api.ts] 文件列表获取成功:', {
        count: data.length,
        files: data.map(f => ({ id: f.id, name: f.name }))
      });
      return data;
    } catch (error) {
      console.error('❌ [files_api.ts] 获取文件列表失败:', {
        error,
        headers: (error as any)?.config?.headers,  // 添加请求头信息
        status: (error as any)?.response?.status,
        responseData: (error as any)?.response?.data
      });
      throw error;
    }
  },



  // ----------- 上传文件 API.upload (done check)-------------
  // 上传文件的API， 返回的Promise解析值为 FileRecord类型
  uploadFile: async (file: File): Promise<FileRecord> => {
    console.log('📤 [files_api.ts] 开始上传文件:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    try {
      // 1. 上传文件
      // 上传前，先用FormData进行数据的格式标准化。 
      // 注意： FormData，不是自定义的数据类型，而是HTML5新增的API，用于表单数据序列化，可以方便地将文件和表单数据一起发送, 主要支持文件上传
      // FormData 对象的append方法，用于添加键值对，第一个参数是键，第二个参数是file对象，第三个参数是file.name(可选)
      const formData = new FormData();
      formData.append('file', file);
      // 添加额外的必要字段
      formData.append('name', file.name);
      formData.append('type', 'OTHER');  // 或根据文件类型动态设置

      console.log('🚀 [files_api.ts] 发送文件到上传服务器', endpoints.files);

      // 查看 FormData 内容
      console.log('🚀 [files_api.ts] 发送的表单数据:');
      formData.forEach((value, key) => {
        console.log(`${key}:`, value);
      });
      
      const response = await axios.post(endpoints.files, formData);
      
      console.log('✅ [files_api.ts] 文件上传成功:', {
        fileId: response.data.id,
        fileName: response.data.name,
        url: response.data.url
      });
      return response.data;
    } catch (error) {
      console.error('❌ [files_api.ts] 文件上传失败:', {
        fileName: file.name,
        error,
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status,
        message: error instanceof Error ? error.message : '未知错误'
      });
      throw new Error('文件上传失败');
    }
  },


  
  // ----------- 删除文件 API.deleteFile(done check!) -------------
  // 删除文件的API， 返回的Promise解析值为 void类型
  deleteFile: async (fileId: string): Promise<void> => {
    console.log('🗑️ [files_api.ts] 开始删除文件:', { fileId });    
    
    try {
      await axios.delete(`${endpoints.files}${fileId}/`);
      console.log('✅ [files_api.ts] 文件删除成功:', { fileId });
    } catch (error) {
      console.error('❌ [files_api.ts] 删除文件失败:', {
        fileId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data,
        message: error instanceof Error ? error.message : '未知错误'
      });
      throw error;
    }
  },

  // 获取单个文件详情
  getFileDetail: async (fileId: string, presigned: boolean = false): Promise<FileRecord> => {
    console.log('🔍 [files_api.ts] 获取文件详情:', { fileId, presigned });
    
    try {
      const { data } = await axios.get(`${endpoints.files}${fileId}/?presigned=${presigned}`);
      console.log('✅ [files_api.ts] 文件详情获取成功:', {
        fileId: data.id,
        fileName: data.name,
        url: data.url
      });
      return data;
    } catch (error) {
      console.error('❌ [files_api.ts] 获取文件详情失败:', {
        fileId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data,
        message: error instanceof Error ? error.message : '未知错误'
      });
      throw error;
    }
  },

  // 更新文件信息
  updateFile: async (fileId: string, updateData: Partial<FileRecord>): Promise<FileRecord> => {
    console.log('📝 [files_api.ts] 开始更新文件信息:', {
      fileId,
      updateData
    });
    
    try {
      const { data } = await axios.put(`${endpoints.files}${fileId}/`, updateData);
      console.log('✅ [files_api.ts] 文件信息更新成功:', {
        fileId: data.id,
        fileName: data.name,
        updatedFields: Object.keys(updateData)
      });
      return data;
    } catch (error) {
      console.error('❌ [files_api.ts] 更新文件信息失败:', {
        fileId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data,
        message: error instanceof Error ? error.message : '未知错误'
      });
      throw error;
    }
  }

};
