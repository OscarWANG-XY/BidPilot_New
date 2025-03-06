import axiosInstance from './axios_instance';
import type { 
  Project,
  ProjectHistory,
  CreateProjectRequest,
  UpdateProjectStageRequest,
  ProjectType,
  StageType,
  ProjectOverviewResponse,
  UpdateProjectStatusRequest
} from '@/types/projects_dt_stru';

// 查询参数接口（使用驼峰命名）
interface ProjectQueryParams {
  currentStage?: StageType;
  projectType?: ProjectType;
  isUrgent?: boolean;
  search?: string;
  ordering?: string;
}

// ================================ projectsAPI 模块 =================================== 
export const projectsApi = {
  // 获取项目列表（支持过滤、搜索和排序）
  getAllProjects: async (params?: ProjectQueryParams): Promise<Project[]> => {
    console.log('📤 [projects_api.ts] 获取所有项目:', params);
    const response = await axiosInstance.get('/projects/', { params });
    console.log('📥 [projects_api.ts] 获取所有项目成功:', response.data);
    return response.data;
  },

  // 获取单个项目详情
  getProjectById: async (projectId: string): Promise<Project> => {
    console.log('📤 [projects_api.ts] 获取单个项目:', projectId);
    const response = await axiosInstance.get(`/projects/${projectId}/`);
    console.log('📥 [projects_api.ts] 获取单个项目成功:', response.data);
    return response.data;
  },

  // 创建新项目
  createProject: async (project: CreateProjectRequest): Promise<Project> => {
    console.log('📤 [projects_api.ts] 创建新项目:', project);
    const response = await axiosInstance.post('/projects/', project);
    console.log('📥 [projects_api.ts] 创建新项目成功:', response.data);
    return response.data;
  },

  // 更新项目信息
  updateProject: async (projectId: string, projectData: Partial<Project>): Promise<Project> => {
    console.log('📤 [projects_api.ts] 更新项目:', { projectId, projectData });
    const response = await axiosInstance.patch(`/projects/${projectId}/`, projectData);
    console.log('📥 [projects_api.ts] 更新项目成功:', response.data);
    return response.data;
  },

  // 更新项目阶段
  updateProjectStage: async (request: UpdateProjectStageRequest): Promise<Project> => {
    console.log('📤 [projects_api.ts] 更新项目阶段:', request);
    const response = await axiosInstance.patch(
      `/projects/${request.id}/update_stage/`,
      {
        stage: request.stage,
        remarks: request.remarks
      }
    );
    console.log('📥 [projects_api.ts] 更新项目阶段成功:', response.data);
    return response.data;
  },

  // 获取项目历史记录
  getProjectHistory: async (projectId: string): Promise<ProjectHistory[]> => {
    console.log('📤 [projects_api.ts] 获取项目历史:', projectId);
    const response = await axiosInstance.get(`/projects/${projectId}/histories/`);
    console.log('📥 [projects_api.ts] 获取项目历史成功:', response.data);
    return response.data;
  },

  // 删除项目
  deleteProject: async (projectId: string): Promise<void> => {
    console.log('📤 [projects_api.ts] 删除项目:', projectId);
    await axiosInstance.delete(`/projects/${projectId}/`);
    console.log('✅ [projects_api.ts] 删除项目成功:', projectId);
  },

  // 获取项目阶段概览
  getProjectOverview: async (projectId: string): Promise<ProjectOverviewResponse> => {
    console.log('📤 [projects_api.ts] 获取项目阶段概览:', projectId);
    const response = await axiosInstance.get(`/projects/${projectId}/overview/`);
    console.log('📥 [projects_api.ts] 获取项目阶段概览成功:', response.data);
    return response.data;
  },

  // 更新项目状态 (修改为使用 UpdateProjectStatusRequest 类型)
  updateProjectStatus: async (request: UpdateProjectStatusRequest): Promise<Project> => {
    console.log('📤 [projects_api.ts] 更新项目状态:', request);
    const response = await axiosInstance.patch(
      `/projects/${request.id}/update_status/`,
      {
        status: request.status,
        remarks: request.remarks
      }
    );
    console.log('📥 [projects_api.ts] 更新项目状态成功:', response.data);
    return response.data;
  }
};
