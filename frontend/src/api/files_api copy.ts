import axios from 'axios';

// BaseEntity类型: id, createdAt, createdBy, updatedAt?, updatedBy?, version
// FileRecord类型: name, url?, size, type, mimeType?, status, visibility, processingStatus, processingProgress?, errorMessage?, accessControl?, metadata?, remarks?
import { FileRecord } from '@/types/files_dt_stru';

const API_BASE_URL = '/api'; // Django 后端端口

// 所有的端点都应该以斜杠结尾
const endpoints = {
  files: `${API_BASE_URL}/files/`,
  uploads: `${API_BASE_URL}/uploads/`,
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



// ================================ 文件 API  ============================================ 
export const fileApi = {


  // ----------- 获取所有文件 API.getAllFiles -------------
  getAllFiles: async (): Promise<FileRecord[]> => {
  
    const token = localStorage.getItem('token');
    console.log('Debug - Current token:', token);
    console.log('Debug - Authorization header:', `Bearer ${token}`);
    
    try {
      console.log('🔍 [files_api.ts] 获取所有文件的端点:', endpoints.files);
      const { data } = await axios.get<FileRecord[]>(endpoints.files);
      console.log('✅ [files_api.ts] 文件列表获取成功:', data);
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
      //                     await让程序暂停，直到axios.post异步操作完成返回解析值promise给uploadResponse
      // upload端点名需要和upload-server/server.js中的端点名一致
      console.log('🚀 [files_api.ts] 发送文件到上传服务器', endpoints.files);
      const uploadResponse = await axios.post(endpoints.files, formData);
      console.log('✅ [files_api.ts] 文件上传成功:', uploadResponse.data);

      // 2. 将文件信息保存到 json-server
      //                     await让程序暂停，直到axios.post异步操作完成返回解析值promise给fileRecord 
      console.log('💾 [files_api.ts] 保存文件记录到数据库', endpoints.files);
      const fileRecord = await axios.post(endpoints.files, {
        ...uploadResponse.data,  // 使用上传服务器返回的数据
        name: file.name, //为了处理json-server不能正确处理文件名的问题。
        status: 'NONE',
        createdAt: new Date().toISOString(),
        // ... 其他业务相关字段
      });
      console.log('✨ [files_api.ts] 文件记录创建成功:', {
        id: fileRecord.data.id,
        name: fileRecord.data.name,
        url: fileRecord.data.url
      });


      return fileRecord.data;
    } catch (error) {
      console.error('❌ [files_api.ts] 文件上传失败:', {
        fileName: file.name,
        error,
        response: (error as any)?.response?.data,
        message: error instanceof Error ? error.message : '未知错误'
      });
      // 如果上传失败，可能需要清理已上传的文件
      throw new Error('文件上传失败');
    }
  },


  
  // ----------- 删除文件 API.deleteFile(done check!) -------------
  // 删除文件的API， 返回的Promise解析值为 void类型
  deleteFile: async (fileId: string): Promise<void> => {
    console.log('🗑️ [files_api.ts] 开始删除文件:', fileId);    
    try {

      // 1. 删除文件服务器的文件实体， 需要获取文件路径来定位删除
      // 由于我们需要通过先从json-server获得文件信息，所以json-server的信息删除需要放到之后
      // promise响应对象中，包含data, status, statusText, headers, config, request 
      // data:fileInfo 表示将范围的promise的data解析值赋值给fileInfo 
      console.log('🔍 [files_api.ts] 获取文件信息');
      const { data: fileInfo } = await axios.get(`${endpoints.files}${fileId}`);
      console.log('📄 [files_api.ts] 文件信息获取成功:', fileInfo);
      // 从 URL 中提取文件名
      const fileName = fileInfo.url.split('/uploads/').pop();
      console.log('🎯 [files_api.ts] 提取的文件名:', fileName);

      // 注意，虽然fileName正确提取了，当通过axios传递到文件服务器时HTTP协议会自动对URL编码，
      //所以在服务器端需要用decodeURIComponent解码
      console.log('🗑️ [files_api.ts] 删除文件服务器上的文件');
      await axios.delete(`${endpoints.uploads}${fileName}`);
      console.log('✅ [files_api.ts] 文件实体删除成功');

      // 2. 删除json-server的文件记录
      // 删除文件fileId, 返回的Promise解析值为 void类型, await让程序暂停等删除完成
      console.log('🗑️ [files_api.ts] 删除数据库中的文件记录');
      await axios.delete(`${endpoints.files}${fileId}`);
      console.log('✅ [files_api.ts] 文件记录删除成功');



      // 删除文件后，删除文件-项目关联
      //await axios.delete(`${JSON_SERVER_API_URL}/file-project-links?fileId=${fileId}`);


    } catch (error) {
      console.error('❌ [files_api.ts] 删除文件失败:', {
        fileId,
        error,
        response: (error as any)?.response?.data,
        message: error instanceof Error ? error.message : '未知错误'
      });
      throw error;
    }
  },

};
