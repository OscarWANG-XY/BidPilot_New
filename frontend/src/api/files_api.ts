import axios from 'axios';
import { FileRecord } from '@/types/files_dt_stru';

const JSON_SERVER_API_URL = 'http://localhost:3000';  // 业务数据服务
const FILE_SERVER_API_URL = 'http://localhost:3001';  // 文件上传服务


// --------------- 添加请求拦截器 --------------- 
axios.interceptors.request.use(function (config) {
  if (config.data instanceof FormData) {
    const file = config.data.get('file') as File;
    console.log('Axios request interceptor - filename:', file.name);
  }
  return config;
});



// ================================ 文件 API  ============================================ 
export const fileApi = {




  // ----------- 获取所有文件 API.getAllFiles -------------
  getAllFiles: async (): Promise<FileRecord[]> => {
    const url = `${JSON_SERVER_API_URL}/files`;
    try {
      const { data } = await axios.get<FileRecord[]>(url);
      console.log('Fetched all files:', data);
      return data;
    } catch (error) {
      console.error('Error fetching all files:', error);
      throw error;
    }
  },



  // ----------- 上传文件 API.upload (done check)-------------
  uploadFile: async (file: File): Promise<FileRecord> => {
    try {
      // 1. 上传文件
      // 上传前，先用FormData进行数据的格式标准化。 
      // 注意： FormData，不是自定义的数据类型，而是HTML5新增的API，用于表单数据序列化，可以方便地将文件和表单数据一起发送, 主要支持文件上传
      // FormData 对象的append方法，用于添加键值对，第一个参数是键，第二个参数是file对象，第三个参数是file.name(可选)
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await axios.post(`${FILE_SERVER_API_URL}/upload`, formData);
      
      // 2. 将文件信息保存到 json-server
      const fileRecord = await axios.post(`${JSON_SERVER_API_URL}/files`, {
        ...uploadResponse.data,  // 使用上传服务器返回的数据
        name: file.name, //为了处理json-server不能正确处理文件名的问题。
        status: 'NONE',
        createdAt: new Date().toISOString(),
        // ... 其他业务相关字段
      });

      return fileRecord.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      // 如果上传失败，可能需要清理已上传的文件
      throw new Error('文件上传失败');
    }
  },



  
  // ----------- 删除文件 API.deleteFile -------------
  deleteFile: async (fileId: string): Promise<void> => {
    try {
      // 删除所有相关的文件-项目关联
      const { data: links } = await axios.get(
        `${JSON_SERVER_API_URL}/file-project-links?fileId=${fileId}`
      );
      
      await Promise.all(
        links.map((link: { id: string }) =>
          axios.delete(`${JSON_SERVER_API_URL}/file-project-links/${link.id}`)
        )
      );

      await axios.delete(`${JSON_SERVER_API_URL}/files/${fileId}`);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
};
