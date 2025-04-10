import axiosInstance from './axios_instance';  // 更新导入路径，使用新的axios实例
import { FileRecord } from '@/_types/files_dt_stru';

const API_BASE_URL = ''; // Django 后端端口

// 所有的端点都应该以斜杠结尾
const endpoints = {
  getFiles: `${API_BASE_URL}/files/`,
  uploadFiles: `${API_BASE_URL}/files/`,
  deleteFiles: `${API_BASE_URL}/files/`,   //+ ${fileId}
  getFileDetail: `${API_BASE_URL}/files/`,   //+ ${fileId}
  updateFileDetail: `${API_BASE_URL}/files/`,   //+ ${fileId}
};

// 通用错误处理函数
const handleError = (operation: string, error: unknown) => {
  console.error(`❌ 文件操作失败 [${operation}]:`, error);
  throw error instanceof Error ? error : new Error(`${operation} 失败`);
};

// ================================ 文件 API  ============================================ 
export const fileApi = {

  // ----------- 获取所有文件 API.getAllFiles -------------
  getAllFiles: async (projectId?: string): Promise<FileRecord[]> => {
    console.log('🔍 开始获取文件列表', projectId ? `项目ID: ${projectId}` : "全局模式");
    try {
      // 不带 presigned 参数，默认不生成预签名URL
      // 添加项目ID作为查询参数
      const url = projectId 
        ? `${endpoints.getFiles}?project_id=${projectId}` 
        : endpoints.getFiles;
      const { data } = await axiosInstance.get<FileRecord[]>(url);
      console.log(`✅ 获取到 ${data.length} 个文件`);
      return data;
    } catch (error) {
      return handleError('获取文件列表', error);
    }
  },

  // ----------- 上传文件 API.upload (done check)-------------
  // 上传文件的API， 返回的Promise解析值为 FileRecord类型
  uploadFile: async (file: File, projectId?: string): Promise<FileRecord> => {
    console.log(`📤 上传文件: ${file.name} (${file.size} bytes)`,
      projectId ? `项目ID: ${projectId}` : "全局模式"
    );

    try {
      // 1. 上传文件
      // 采用FormData数据格式，HTML5 API，支持文件文件和表单数据一起发送
      const formData = new FormData();
      formData.append('file', file);
      // 添加额外的必要字段
      formData.append('name', file.name);
      formData.append('type', 'OTHER');  // 或根据文件类型动态设置

      // 如果有项目ID，添加到表单数据中
      if (projectId) {
        formData.append('project_id', projectId);
      }
      
      const response = await axiosInstance.post(endpoints.uploadFiles, formData);
      
      console.log(`✅ 文件上传成功: ${response.data.name}`);
      return response.data;
    } catch (error) {
      return handleError('文件上传', error);
    }
  },

  // ----------- 删除文件 API.deleteFile(done check!) -------------
  // 删除文件的API， 返回的Promise解析值为 void类型
  deleteFile: async (fileId: string): Promise<void> => {
    console.log(`🗑️ 删除文件: ${fileId}`);    
    
    try {
      await axiosInstance.delete(`${endpoints.deleteFiles}${fileId}/`);
      console.log(`✅ 文件删除成功`);
    } catch (error) {
      return handleError('删除文件', error);
    }
  },

  // 获取单个文件详情
  // presigned 参数用于控制是否返回预签名URL, 在后端的serializers.py中, get_url方法中使用
  getFileDetail: async (fileId: string, presigned: boolean = false): Promise<FileRecord> => {
    console.log(`🔍 获取文件详情: ${fileId}`);
    
    try {
      const { data } = await axiosInstance.get(`${endpoints.getFileDetail}${fileId}/?presigned=${presigned}`);
      console.log(`✅ 获取到文件: ${data.name}`);

      return data;
    } catch (error) {
      return handleError('获取文件详情', error);
    }
  },

  // 更新文件信息
  updateFile: async (fileId: string, updateData: Partial<FileRecord>): Promise<FileRecord> => {
    console.log(`📝 更新文件: ${fileId}`);
    
    try {
      const { data } = await axiosInstance.put(`${endpoints.updateFileDetail}${fileId}/`, updateData);
      console.log('✅ [files_api.ts] 文件信息更新成功:', {
        fileId: data.id,
        fileName: data.name,
        updatedFields: Object.keys(updateData)
      });
      return data;
    } catch (error) {
      return handleError('更新文件信息', error);
    }
  }

};
