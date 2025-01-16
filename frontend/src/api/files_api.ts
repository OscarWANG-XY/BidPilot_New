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
  // 上传文件的API， 返回的Promise解析值为 FileRecord类型
  uploadFile: async (file: File): Promise<FileRecord> => {
    try {
      // 1. 上传文件
      // 上传前，先用FormData进行数据的格式标准化。 
      // 注意： FormData，不是自定义的数据类型，而是HTML5新增的API，用于表单数据序列化，可以方便地将文件和表单数据一起发送, 主要支持文件上传
      // FormData 对象的append方法，用于添加键值对，第一个参数是键，第二个参数是file对象，第三个参数是file.name(可选)
      const formData = new FormData();
      formData.append('file', file);
      //                     await让程序暂停，直到axios.post异步操作完成返回解析值promise给uploadResponse
      // upload端点名需要和upload-server/server.js中的端点名一致
      const uploadResponse = await axios.post(`${FILE_SERVER_API_URL}/upload`, formData);


      // 2. 将文件信息保存到 json-server
      //                     await让程序暂停，直到axios.post异步操作完成返回解析值promise给fileRecord 
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

  
  
  // ----------- 删除文件 API.deleteFile(done check!) -------------
  // 删除文件的API， 返回的Promise解析值为 void类型
  deleteFile: async (fileId: string): Promise<void> => {
    try {
      
      // 1. 删除文件服务器的文件实体， 需要获取文件路径来定位删除
      // 由于我们需要通过先从json-server获得文件信息，所以json-server的信息删除需要放到之后
      // promise响应对象中，包含data, status, statusText, headers, config, request 
      // data:fileInfo 表示将范围的promise的data解析值赋值给fileInfo 
      const { data: fileInfo } = await axios.get(`${JSON_SERVER_API_URL}/files/${fileId}`);
      console.log('fileInfo:', fileInfo);
      // 从 URL 中提取文件名
      const fileName = fileInfo.url.split('/uploads/').pop();
      console.log('fileName:', fileName);

      // 注意，虽然fileName正确提取了，当通过axios传递到文件服务器时HTTP协议会自动对URL编码，
      //所以在服务器端需要用decodeURIComponent解码
      await axios.delete(`${FILE_SERVER_API_URL}/uploads/${fileName}`);


      // 2. 删除json-server的文件记录
      // 删除文件fileId, 返回的Promise解析值为 void类型, await让程序暂停等删除完成
      await axios.delete(`${JSON_SERVER_API_URL}/files/${fileId}`);




      // 删除文件后，删除文件-项目关联
      //await axios.delete(`${JSON_SERVER_API_URL}/file-project-links?fileId=${fileId}`);


    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

};
