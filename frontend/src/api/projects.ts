import axios from 'axios';
import { FileRecord } from '@/types/project';

const API_URL = 'http://localhost:3000';  // json-server
//const UPLOAD_URL = 'http://localhost:3001';  // 文件上传服务器

export const projectApi = {
  // 获取项目相关的文件
  getProjectFiles: async (projectId: string): Promise<File[]> => {
    try {
      const { data: links } = await axios.get(
        `${API_URL}/file-project-links?projectId=${projectId}`
      );
      
      const filePromises = links.map((link: { fileId: string }) =>
        axios.get<TenderFile>(`${API_URL}/files/${link.fileId}`)
      );
      
      const files = await Promise.all(filePromises);
      return files.map(response => response.data);
    } catch (error) {
      console.error('Error fetching project files:', error);
      throw error;
    }
  },

  // 文件与项目关联
  linkFileToProject: async (fileId: string, projectId: string): Promise<void> => {
    try {
      await axios.post(`${API_URL}/file-project-links`, {
        fileId,
        projectId,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error linking file to project:', error);
      throw error;
    }
  },

  // 解除文件与项目的关联
  unlinkFileFromProject: async (fileId: string, projectId: string): Promise<void> => {
    try {
      const { data: links } = await axios.get(
        `${API_URL}/file-project-links?fileId=${fileId}&projectId=${projectId}`
      );
      
      if (links && links.length > 0) {
        await axios.delete(`${API_URL}/file-project-links/${links[0].id}`);
      }
    } catch (error) {
      console.error('Error unlinking file from project:', error);
      throw error;
    }
  },

  // ... 其他项目相关的 API 方法
};
