import axiosInstance from '../../../../_api/axios_instance';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type { 
    FileUploadTaskDetail,
    FileUploadTaskUpdate,
} from '@/_types/projects_dt_stru/projectTasks_interface';




//------------- 针对TASK的处理 -------------

export const UploadFileApi = {

  // 获取项目阶段下的文件上传任务
  // axiosInstance.get(`/projects/${projectId}/stages/${stageType}/file_upload/`)
  getFileUploadTask: async (projectId: string, stageType: StageType): Promise<FileUploadTaskDetail> => {
    console.log('📤 获取文件上传任务:', { projectId, stageType });
    const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/file_upload/`);
    console.log('📥 获取文件上传任务成功:', response.data);
    return response.data;
  },
  // 更新项目阶段下的文件上传任务
  // axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/file_upload/`, taskData)
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

};





