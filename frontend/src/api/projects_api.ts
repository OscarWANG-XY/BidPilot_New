import axiosInstance from './auth_api';
import type { 
  Project,
  ProjectHistory,
  CreateProjectRequest,
  UpdateProjectStageRequest,
  ProjectType,
  ProjectStage
} from '@/types/projects_dt_stru';

// 查询参数接口
interface ProjectQueryParams {
  current_stage?: ProjectStage;
  project_type?: ProjectType;
  is_urgent?: boolean;
  search?: string;
  ordering?: string;
}

// 将查询参数转换为URL查询字符串
const buildQueryString = (params?: ProjectQueryParams): string => {
  if (!params) return '';
  
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString());
    }
  });
  
  return queryParams.toString();
};

// ================================ projectsAPI 模块 =================================== 
export const projectsApi = {
  // 获取项目列表（支持过滤、搜索和排序）
  getAllProjects: async (params?: ProjectQueryParams): Promise<Project[]> => {
    console.log('📤 [projects_api.ts] 获取所有项目:', params);
    const queryString = buildQueryString(params);
    const response = await axiosInstance.get(`/projects/${queryString ? `?${queryString}` : ''}`);
    console.log('📥 [projects_api.ts] 获取所有项目成功:', response.data);
    return response.data;
  },

  // 获取单个项目详情
  getProjectById: async (projectId: number): Promise<Project> => {
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
  updateProject: async (projectId: number, projectData: Partial<Project>): Promise<Project> => {
    console.log('📤 [projects_api.ts] 更新项目:', { projectId, projectData });
    const response = await axiosInstance.patch(`/projects/${projectId}/`, projectData);
    console.log('📥 [projects_api.ts] 更新项目成功:', response.data);
    return response.data;
  },

  // 更新项目阶段
  updateProjectStage: async (request: UpdateProjectStageRequest): Promise<Project> => {
    console.log('📤 [projects_api.ts] 更新项目阶段:', request);
    const response = await axiosInstance.patch(
      `/projects/${request.projectId}/update_stage/`,
      {
        stage: request.stage,
        remarks: request.remarks
      }
    );
    console.log('📥 [projects_api.ts] 更新项目阶段成功:', response.data);
    return response.data;
  },

  // 获取项目历史记录
  getProjectHistory: async (projectId: number): Promise<ProjectHistory[]> => {
    console.log('📤 [projects_api.ts] 获取项目历史:', projectId);
    const response = await axiosInstance.get(`/projects/${projectId}/histories/`);
    console.log('📥 [projects_api.ts] 获取项目历史成功:', response.data);
    return response.data;
  },

  // 删除项目
  deleteProject: async (projectId: number): Promise<void> => {
    console.log('📤 [projects_api.ts] 删除项目:', projectId);
    await axiosInstance.delete(`/projects/${projectId}/`);
    console.log('✅ [projects_api.ts] 删除项目成功:', projectId);
  }
};
