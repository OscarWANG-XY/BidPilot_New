import axiosInstance from '../axios_instance';
import type { 
  ProjectStage,
  StageType,
} from '@/types/projects_dt_stru/projectStage_interface';


// ================================ ProjectStage API 模块 =================================== 
export const projectStageApi = {
  // 获取项目阶段详情 (通过项目ID和阶段类型)
  getProjectStage: async (projectId: string, stageType: StageType): Promise<ProjectStage> => {
    console.log('📤 获取项目阶段:', { projectId, stageType });
    const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/`);
    console.log('📥 获取项目阶段成功:', response.data);
    return response.data;
  },

  // 更新项目阶段 (包括任务状态更新)
  updateProjectStage: async (projectId: string, stageType: StageType, stageData: any): Promise<ProjectStage> => {
    console.log('📤 更新项目阶段:', { projectId, stageType, stageData });
    const response = await axiosInstance.patch(
      `/projects/${projectId}/stages/${stageType}/`,
      stageData
    );
    console.log('📥 更新项目阶段成功:', response.data);
    return response.data;
  },

}

