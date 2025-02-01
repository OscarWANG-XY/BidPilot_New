import axiosInstance from './auth_api';  // 使用配置好的 axios 实例
import { FileRecord } from '@/types/files_dt_stru';

const API_BASE_URL = ''; // Django 后端端口

// 所有的端点都应该以斜杠结尾
const endpoints = {
  getFiles: `${API_BASE_URL}/files/`,
  uploadFiles: `${API_BASE_URL}/files/`,
  deleteFiles: `${API_BASE_URL}/files/`,   //+ ${fileId}
  getFileDetail: `${API_BASE_URL}/files/`,   //+ ${fileId}
  updateFileDetail: `${API_BASE_URL}/files/`,   //+ ${fileId}
};


// ================================ 文件 API  ============================================ 
export const fileApi = {


  // ----------- 获取所有文件 API.getAllFiles -------------
  getAllFiles: async (): Promise<FileRecord[]> => {
  
    const token = localStorage.getItem('token');
    console.log('[files_api.ts] Current token:', token);
    console.log('[files_api.ts] Authorization header:', `Bearer ${token}`);
    console.log('🔍 [files_api.ts] 开始获取文件列表...');
    try {
      console.log('🔍 [files_api.ts] 获取所有文件的端点:', endpoints.getFiles);
      const { data } = await axiosInstance.get<FileRecord[]>(endpoints.getFiles);
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
      // 采用FormData数据格式，HTML5 API，支持文件文件和表单数据一起发送
      const formData = new FormData();
      formData.append('file', file);
      // 添加额外的必要字段
      formData.append('name', file.name);
      formData.append('type', 'OTHER');  // 或根据文件类型动态设置

      console.log('🚀 [files_api.ts] 发送文件到上传服务器', endpoints.uploadFiles);

      // 查看 FormData 内容
      console.log('🚀 [files_api.ts] 发送的表单数据:');
      formData.forEach((value, key) => {
        console.log(`${key}:`, value);
      });
      
      const response = await axiosInstance.post(endpoints.uploadFiles, formData);
      
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
      await axiosInstance.delete(`${endpoints.deleteFiles}${fileId}/`);
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
  // presigned 参数用于控制是否返回预签名URL, 在后端的serializers.py中, get_url方法中使用
  getFileDetail: async (fileId: string, presigned: boolean = false): Promise<FileRecord> => {
    console.log('🔍 [files_api.ts] 获取文件详情:', { fileId, presigned });
    
    try {
      const { data } = await axiosInstance.get(`${endpoints.getFileDetail}${fileId}/?presigned=${presigned}`);
      console.log('✅ [files_api.ts] 文件详情获取成功:', {
        fileId: data.id,
        fileName: data.name,
        url: data.url,
        mimeType: data.mime_type
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
      const { data } = await axiosInstance.put(`${endpoints.updateFileDetail}${fileId}/`, updateData);
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
