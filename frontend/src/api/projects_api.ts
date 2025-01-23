import axios from 'axios';  // 用于发送HTTP请求
import { 
  // ProjectBasicInfo类型: id, name, code, tenderee, bidder, projectType, industry, expectedBudget, createTime, updateTime, deadline
  // Project类型(extended on ProjectBasicInfo): status, currentPhase, phases, progress, attachment?, lastModifiedBy, createBy, remarks?
  Project,  

  // CreateProjectRequest类型: name, code, tenderee, bidder, projectType, industry, expectedBudget, deadline, remarks?
  CreateProjectRequest,  // 创建项目请求数据类型

  // UpdateProjectStatusRequest类型: projectId, status, remarks?
  UpdateProjectStatusRequest,  // 更新项目状态请求数据类型

  // UpdateProjectPhaseRequest类型: projectId, phaseId, status, assignee?, remarks?
  UpdateProjectPhaseRequest  // 更新项目阶段请求数据类型
} from '@/types/projects_dt_stru';  // 引入自定义的数据类型

const PROJECTS_SERVER_URL = 'http://localhost:3000'; // 项目数据服务端口


// --------------- 添加请求拦截器 --------------- 
axios.interceptors.request.use(function (config) {
  // 从 localStorage 中获取 Token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // 添加 Token 到请求头
  }
  
  return config;
});


// ================================ projectsAPI 模块 =================================== 
export const projectsApi = {
  // ------------- 获取所有项目 -------------
  getAllProjects: async (): Promise<Project[]> => {
    const response = await axios.get(`${PROJECTS_SERVER_URL}/projects`);
    return response.data;
  },

  // ------------- 获取单个项目 -------------
  getProjectById: async (id: string): Promise<Project> => {
    const response = await axios.get(`${PROJECTS_SERVER_URL}/projects/${id}`);
    return response.data;
  },

  // ------------- 创建新项目 （done check!）-------------
  // 创建项目传给服务器，服务器会自动生成id， 这个id通常是自增数字或UUID 
  createProject: async (project: CreateProjectRequest): Promise<Project> => {
    const response = await axios.post(`${PROJECTS_SERVER_URL}/projects`, {
      ...project,
      status: 'DRAFT',   // 每个项目阶段初建立的默认状态 
      currentPhase: 'INITIATION',  // 每个项目初建时都从初始化阶段开始
      phases: [],   //项目各阶段的过程信息的记录，跳到新的阶段后，前阶段的信息会被存储在这里。 
      progress: 0,  // 使用阶段权重进行计算 （需要建立阶段权重计算代码）
      createTime: new Date(),
      updateTime: new Date(),
      lastModifiedBy: 'system', // 这里应该使用实际的用户信息, 暂时先使用system
      createBy: 'system'  // 这里应该使用实际的用户信息, 暂时先使用system
    });
    return response.data;
  },

  // ------------- 更新项目 -------------
  updateProject: async (id: string, project: Partial<Project>): Promise<Project> => {
    const response = await axios.patch(`${PROJECTS_SERVER_URL}/projects/${id}`, {
      ...project,
      updateTime: new Date()
    });
    return response.data;
  },

  // ------------- 更新项目状态 -------------
  updateProjectStatus: async (request: UpdateProjectStatusRequest): Promise<Project> => {
    const response = await axios.patch(`${PROJECTS_SERVER_URL}/projects/${request.projectId}`, {
      status: request.status,
      remarks: request.remarks,
      updateTime: new Date()
    });
    return response.data;
  },

  // ------------- 更新项目阶段 -------------
  updateProjectPhase: async (request: UpdateProjectPhaseRequest): Promise<Project> => {
    const response = await axios.patch(`${PROJECTS_SERVER_URL}/projects/${request.projectId}`, {
      phases: request.phaseId,
      updateTime: new Date()
    });
    return response.data;
  },

  // ------------- 删除项目 -------------
  deleteProject: async (id: string): Promise<void> => {
    await axios.delete(`${PROJECTS_SERVER_URL}/projects/${id}`);
  }
};
