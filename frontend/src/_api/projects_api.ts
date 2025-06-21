import axiosInstance from './axios_instance';
import { TenderFile } from '@/components/projects/Components/FileUpload/schema';
import type { 
  Project,
  CreateProjectRequest,
  UpdateProjectStatusRequest,
  ProjectQueryParams,
} from '@/_types/projects_dt_stru/projects_interface';



export interface CheckTenderFileExistResponse {
  field: string;
  exists: boolean;
  hasValue: boolean;
  fieldType: string;
  projectId: string;
}


// ================================ projectsAPI 模块 =================================== 
export const projectsApi = {
  // 创建新项目
  createProject: async (project: CreateProjectRequest): Promise<Project> => {
    console.log('📤 创建新项目:', project);
    const response = await axiosInstance.post('/projects/', project);
    console.log('📥 创建新项目成功:', response.data);
    return response.data;
  },

  // 获取项目列表（支持过滤、搜索和排序）
  getAllProjects: async (params?: ProjectQueryParams): Promise<Project[]> => {
    console.log('📤 获取所有项目:', params);
    const response = await axiosInstance.get('/projects/', { params });
    console.log('📥 获取所有项目成功:', response.data);
    return response.data;
  },

  // 获取单个项目详情
  getProjectById: async (projectId: string): Promise<Project> => {
    console.log('📤 获取单个项目:', projectId);
    const response = await axiosInstance.get(`/projects/${projectId}/`);
    console.log('📥 获取单个项目成功:', response.data);
    return response.data;
  },


  // 更新项目信息
  updateProject: async (projectId: string, projectData: Partial<Project>): Promise<Project> => {
    console.log('📤 更新项目:', { projectId, projectData });
    const response = await axiosInstance.patch(`/projects/${projectId}/`, projectData);
    console.log('📥 更新项目成功:', response.data);
    return response.data;
  },

  // 更新项目状态 
  updateProjectStatus: async (request: UpdateProjectStatusRequest): Promise<Project> => {
      console.log('📤 更新项目状态:', request);
      const response = await axiosInstance.patch(
        `/projects/${request.id}/update_status/`,
        {
          status: request.status,
          remarks: request.remarks
        }
      );
      console.log('📥 更新项目状态成功:', response.data);
      return response.data;
    },

  // 删除项目
  deleteProject: async (projectId: string): Promise<void> => {
    console.log('📤 删除项目:', projectId);
    await axiosInstance.delete(`/projects/${projectId}/`);
    console.log('✅ 删除项目成功:', projectId);
  },

  // ================================ 招标文件处理 API ===================================

  // 获取招标文件信息
  getTenderFile: async (projectId: string): Promise<TenderFile> => {
    console.log('📤 获取招标文件信息:', projectId);
    const response = await axiosInstance.get(`/projects/${projectId}/tender_file/`);
    console.log('📥 获取招标文件信息成功:', response.data);
    return response.data;
  },


      // 简化的下载招标文件API - 参考files应用的简单处理方式
  downloadTenderFile: async (projectId: string, fileName: string): Promise<string> => {
    console.log('📤 获取招标文件下载链接:', { projectId, fileName });
    
    try {
      // 获取文件信息和预签名URL
      const fileInfo = await projectsApi.getTenderFile(projectId);
      const downloadUrl = fileInfo.presignedUrl || fileInfo.url;
      
      if (!downloadUrl || typeof downloadUrl !== 'string') {
        throw new Error('无法获取文件下载链接');
      }

      console.log('✅ 获取下载链接成功:', downloadUrl.substring(0, 50) + '...');
      return downloadUrl;
      
    } catch (error) {
      console.error('❌ 获取招标文件下载链接失败:', error);
      throw new Error(`获取下载链接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  // 上传招标文件
  uploadTenderFile: async (projectId: string, file: File): Promise<TenderFile> => {
    console.log('📤 上传招标文件:', { projectId, fileName: file.name, fileSize: file.size });
    
    // 验证文件大小 (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('文件大小超过限制(100MB)');
    }

    // 验证文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('只支持PDF和Word文档');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(
      `/projects/${projectId}/tender_file/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log('📥 上传招标文件成功:', response.data);
    return response.data;
  },

  // 删除招标文件
  deleteTenderFile: async (projectId: string): Promise<void> => {
    console.log('📤 删除招标文件:', projectId);
    await axiosInstance.delete(`/projects/${projectId}/tender_file/`);
    console.log('✅ 删除招标文件成功:', projectId);
  },


  checkTenderFileExist: async (projectId: string, field: string): Promise<CheckTenderFileExistResponse> => {
    console.log('📤 检查招标文件是否存在:', { projectId, field });
    const response = await axiosInstance.get(`/projects/${projectId}/check_exist/`, { params: { field } });
    console.log('📥 检查招标文件是否存在成功:', response.data);
    return response.data;
  },

}