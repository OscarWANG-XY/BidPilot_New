import axiosInstance from '../axios_instance';
import type { 
  Project,
  CreateProjectRequest,
  UpdateProjectStatusRequest,
  UpdateProjectActiveStageRequest,
  ProjectQueryParams,
} from '@/types/projects_dt_stru/projects_interface';


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

  // 更新项目阶段
  updateProjectActiveStage: async (request: UpdateProjectActiveStageRequest): Promise<Project> => {
    console.log('📤 更新项目阶段:', request);
    const response = await axiosInstance.patch(
      `/projects/${request.id}/update_active_stage/`,
      {
        currentActiveStage: request.currentActiveStage,
        remarks: request.remarks
      }
    );
    console.log('📥 更新项目阶段成功:', response.data);
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
}