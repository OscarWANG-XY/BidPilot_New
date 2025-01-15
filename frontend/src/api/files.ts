import axios from 'axios';
import { TenderFile } from '@/types/project';

const API_URL = 'http://localhost:3000';  // json-server
const UPLOAD_URL = 'http://localhost:3001';  // 文件上传服务器


// 添加请求拦截器
axios.interceptors.request.use(function (config) {
  if (config.data instanceof FormData) {
    const file = config.data.get('file') as File;
    console.log('Axios request interceptor - filename:', file.name);
  }
  return config;
});




export const fileApi = {
  upload: async (file: File, projectId: string): Promise<TenderFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const { data } = await axios.post<TenderFile>(
      `${UPLOAD_URL}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // 将文件信息同步到 json-server
    await axios.post(`${API_URL}/files`, {
      ...data,
      id: data.id,
      fileName: data.fileName,
      fileSize: data.fileSize,
      uploadTime: data.uploadTime,
      status: data.status,
      projectId: data.projectId
    });

    return data;
  },

  getProjectFiles: async (projectId: string): Promise<TenderFile[]> => {
    const url = `${API_URL}/files?projectId=${projectId}`;
    console.log('Fetching project files from URL:', url);

    try {
      const { data } = await axios.get<TenderFile[]>(url);
      console.log('Fetched files data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching project files:', error);
      throw error;
    }
  },

  deleteFile: async (fileId: string): Promise<void> => {
    await axios.delete(`${API_URL}/files/${fileId}`);
  }
};
