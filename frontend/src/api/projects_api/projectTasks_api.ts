import axiosInstance from '../axios_instance';
import type { StageType } from '@/types/projects_dt_stru/projectStage_interface';
import type { DocxExtractionTask } from '@/types/projects_dt_stru/projectTasks_interface';




//------------- 针对TASK的处理 -------------

export const TaskApi = {
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


};


