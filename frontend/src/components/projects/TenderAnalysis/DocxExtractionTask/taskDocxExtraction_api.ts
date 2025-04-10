import axiosInstance from '../../../../_api/axios_instance';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type { TaskType, TaskStatus, TaskLockStatus } from '@/_types/projects_dt_stru/projectTasks_interface';





// ------------- 定义接口 -------------

  // 文档提取任务查询接口 - 对应 DocxExtractionTaskDetailSerializer
  export interface Type_DocxExtractionTaskDetail {
    id: string;
    name: string;
    type: TaskType;
    status: TaskStatus;
    lockStatus: TaskLockStatus;
    docxTiptap: string;
  }
  
  // 文档提取任务更新接口 - 对应 DocxExtractionTaskUpdateSerializer
  export interface Type_DocxExtractionTaskUpdate {
    status: TaskStatus;
    lockStatus: TaskLockStatus;
    docxTiptap: string;
  }
  


//------------- 针对TASK的处理 -------------
export const DocxExtractionApi = {

    // 手动启动文档提取， 不需要专门发送status数据，只需要有请求到后端特定的端口即可。
    startDocxExtraction: async (
        projectId: string, 
        stageType: StageType, 
    ): Promise<Type_DocxExtractionTaskDetail> => {
        const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/start_docx_extraction/`);
        console.log('📥 手动启动文档提取成功:', response.data);
        return response.data;
    },


    // 获取项目阶段下的文档提取任务
    getDocxExtractionTask: async (projectId: string, stageType: StageType): Promise<Type_DocxExtractionTaskDetail> => {
        console.log('📤 获取文档提取任务:', { projectId, stageType });
        const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/docx_extraction/`);
        console.log('📥 获取文档提取任务成功:', response.data);
        return response.data;
    },

    // 更新项目阶段下的文档提取任务
    updateDocxExtractionTask: async (
        projectId: string, 
        stageType: StageType, 
        taskData: Type_DocxExtractionTaskUpdate
    ): Promise<Type_DocxExtractionTaskDetail> => {
        console.log('📤 更新文档提取任务:', { projectId, stageType, taskData });
        const response = await axiosInstance.patch(
        `/projects/${projectId}/stages/${stageType}/docx_extraction/`, 
        taskData
        );
        console.log('📥 更新文档提取任务成功:', response.data);
        return response.data;
    },
  
};