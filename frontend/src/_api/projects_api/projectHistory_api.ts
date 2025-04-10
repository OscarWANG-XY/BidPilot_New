import axiosInstance from '../axios_instance';
import type { 
  ChangeHistoryQueryParams,
  ProjectChangeHistory,
  StageChangeHistory,
  TaskChangeHistory
} from '@/_types/projects_dt_stru/projectHistory_interface';



// ================================ changeHistoryApi 模块 ===================================
export const changeHistoryApi = {
    // 获取项目变更历史列表
    getProjectChangeHistory: async (params?: ChangeHistoryQueryParams): Promise<ProjectChangeHistory[]> => {
      console.log('📤 获取项目变更历史', params);
      const response = await axiosInstance.get('/projects/projects/change-history/', { params });
      console.log('📥 获取项目变更历史成功:', response.data);
      return response.data;
    },
  
    // 获取单个项目变更历史详情
    getProjectChangeHistoryById: async (historyId: string): Promise<ProjectChangeHistory> => {
      console.log('📤 获取单个项目变更历史:', historyId);
      const response = await axiosInstance.get(`/projects/projects/change-history/${historyId}/`);
      console.log('📥 获取单个项目变更历史成功:', response.data);
      return response.data;
    },
  
    // 获取阶段变更历史列表
    getStageChangeHistory: async (params?: ChangeHistoryQueryParams): Promise<StageChangeHistory[]> => {
      console.log('📤 获取阶段变更历史:', params);
      const response = await axiosInstance.get('/projects/stages/change-history/', { params });
      console.log('📥 获取阶段变更历史成功:', response.data);
      return response.data;
    },
  
    // 获取单个阶段变更历史详情
    getStageChangeHistoryById: async (historyId: string): Promise<StageChangeHistory> => {
      console.log('📤 获取单个阶段变更历史:', historyId);
      const response = await axiosInstance.get(`/projects/stages/change-history/${historyId}/`);
      console.log('📥 获取单个阶段变更历史成功:', response.data);
      return response.data;
    },
  
    // 获取任务变更历史列表
    getTaskChangeHistory: async (params?: ChangeHistoryQueryParams): Promise<TaskChangeHistory[]> => {
      console.log('📤 获取任务变更历史:', params);
      const response = await axiosInstance.get('/projects/tasks/change-history/', { params });
      console.log('📥 获取任务变更历史成功:', response.data);
      return response.data;
    },
  
    // 获取单个任务变更历史详情
    getTaskChangeHistoryById: async (historyId: string): Promise<TaskChangeHistory> => {
      console.log('📤 获取单个任务变更历史:', historyId);
      const response = await axiosInstance.get(`/projects/tasks/change-history/${historyId}/`);
      console.log('📥 获取单个任务变更历史成功:', response.data);
      return response.data;
    }
  };