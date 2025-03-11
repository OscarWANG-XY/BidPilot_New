import axiosInstance from './axios_instance';
import type { 
  Project,
  ProjectHistory,
  CreateProjectRequest,
  ProjectType,
  ProjectStage,
  StageType,
  UpdateProjectStatusRequest,
  UpdateProjectActiveStageRequest,
  TenderFileUploadTask,
  DocxExtractionTask,
  DocxTreeBuildTask,
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
  
  // 获取项目历史记录
  getProjectHistory: async (projectId: string): Promise<ProjectHistory[]> => {
    console.log('📤 获取项目历史:', projectId);
    const response = await axiosInstance.get(`/projects/${projectId}/histories/`);
    console.log('📥 获取项目历史成功:', response.data);
    return response.data;
  },

  // 删除项目
  deleteProject: async (projectId: string): Promise<void> => {
    console.log('📤 删除项目:', projectId);
    await axiosInstance.delete(`/projects/${projectId}/`);
    console.log('✅ 删除项目成功:', projectId);
  },


// ================================ ProjectStage API 模块 =================================== 
  // 获取项目阶段详情 (通过项目ID和阶段类型)
  getProjectStage: async (projectId: string, stageType: StageType): Promise<ProjectStage> => {
    console.log('📤 获取项目阶段:', { projectId, stageType });
    const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/`);
    console.log('📥 获取项目阶段成功:', response.data);
    return response.data;
  },

//------------- 针对TASK的处理 -------------
  
 // 获取项目阶段下的文档提取任务
 getUploadTask: async (projectId: string, stageType: StageType): Promise<TenderFileUploadTask> => {
  console.log('📤 招标文件上传任务:', { projectId, stageType });
  const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/upload_task/`);
  console.log('📥 获取招标文件上传任务成功:', response.data);
  return response.data;
 },

 // 更新项目阶段下的文档提取任务
 updateUploadTask: async (projectId: string, stageType: StageType, taskData: Partial<TenderFileUploadTask>): Promise<TenderFileUploadTask> => {
  console.log('📤 更新招标文件上传任务:', { projectId, stageType, taskData });
  const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/upload_task/`, taskData);
  console.log('📥 更新招标文件上传任务成功:', response.data);
  return response.data;
 },

 // 获取项目阶段下的文档提取任务
 getExtractionTask: async (projectId: string, stageType: StageType): Promise<DocxExtractionTask> => {
  console.log('📤 文档提取任务:', { projectId, stageType });
  const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/extraction_task/`);
  console.log('📥 获取文档提取任务成功:', response.data);
  return response.data;
 },

 // 更新项目阶段下的文档提取任务
 updateExtractionTask: async (projectId: string, stageType: StageType, taskData: Partial<DocxExtractionTask>): Promise<DocxExtractionTask> => {
  console.log('📤 更新文档提取任务:', { projectId, stageType, taskData });
  const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/extraction_task/`, taskData);
  console.log('📥 更新文档提取任务成功:', response.data);
  return response.data;
 },

 // 获取项目阶段下的文档树构建任务
 getTreeBuildTask: async (projectId: string, stageType: StageType): Promise<DocxTreeBuildTask> => {
  console.log('📤 文档树构建任务:', { projectId, stageType });
  const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/tree_build_task/`);
  console.log('📥 获取文档树构建任务成功:', response.data);
  return response.data;
 },

 // 更新项目阶段下的文档树构建任务
 updateTreeBuildTask: async (projectId: string, stageType: StageType, taskData: Partial<DocxTreeBuildTask>): Promise<DocxTreeBuildTask> => {
  console.log('📤 更新文档树构建任务:', { projectId, stageType, taskData });
  const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tree_build_task/`, taskData);
  console.log('📥 更新文档树构建任务成功:', response.data);
  return response.data;
 },

};


