import axiosInstance from '../axios_instance';
import type { StageType } from '@/types/projects_dt_stru/projectStage_interface';
import type { 
    FileUploadTaskDetail,
    FileUploadTaskUpdate,
    DocxExtractionTaskDetail,
    DocxExtractionTaskUpdate,
} from '@/types/projects_dt_stru/projectTasks_interface';




//------------- 针对TASK的处理 -------------

export const TaskApi = {

  // 获取项目阶段下的文件上传任务
  getFileUploadTask: async (projectId: string, stageType: StageType): Promise<FileUploadTaskDetail> => {
    console.log('📤 获取文件上传任务:', { projectId, stageType });
    const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/file_upload/`);
    console.log('📥 获取文件上传任务成功:', response.data);
    return response.data;
  },

  // 更新项目阶段下的文件上传任务
  updateFileUploadTask: async (
    projectId: string, 
    stageType: StageType, 
    taskData: FileUploadTaskUpdate
  ): Promise<FileUploadTaskDetail> => {
    console.log('📤 更新文件上传任务:', { projectId, stageType, taskData });
    const response = await axiosInstance.patch(
      `/projects/${projectId}/stages/${stageType}/file_upload/`, 
      taskData
    );
    console.log('📥 更新文件上传任务成功:', response.data);
    return response.data;
  },

  // 获取项目阶段下的文档提取任务
  getDocxExtractionTask: async (projectId: string, stageType: StageType): Promise<DocxExtractionTaskDetail> => {
    console.log('📤 获取文档提取任务:', { projectId, stageType });
    const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/docx_extraction/`);
    console.log('📥 获取文档提取任务成功:', response.data);
    return response.data;
  },

  // 更新项目阶段下的文档提取任务
  updateDocxExtractionTask: async (
    projectId: string, 
    stageType: StageType, 
    taskData: DocxExtractionTaskUpdate
  ): Promise<DocxExtractionTaskDetail> => {
    console.log('📤 更新文档提取任务:', { projectId, stageType, taskData });
    const response = await axiosInstance.patch(
      `/projects/${projectId}/stages/${stageType}/docx_extraction/`, 
      taskData
    );
    console.log('📥 更新文档提取任务成功:', response.data);
    return response.data;
  },
  
};





