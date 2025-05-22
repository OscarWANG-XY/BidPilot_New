// 原有的 Django API
//import axiosInstance from '@/_api/axios_instance';
// 新增的 FastAPI API
import fastApiInstance from '@/_api/axios_instance_fa';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type { TaskType, TaskStatus, TaskLockStatus } from '@/_types/projects_dt_stru/projectTasks_interface';

// ------------- 定义接口 -------------
export interface Type_DocxExtractionTaskDetail {
    id: string;
    name: string;
    type: TaskType;
    status: TaskStatus;
    lockStatus: TaskLockStatus;
    docxTiptap: string;
}

export interface Type_DocxExtractionTaskUpdate {
    status: TaskStatus;
    lockStatus: TaskLockStatus;
    docxTiptap: string;
}

// ------------- FastAPI API (新增) -------------
export const DocxExtractionFastApi = {
    startDocxExtraction: async (
        projectId: string, 
        stageType: StageType, 
    ): Promise<Type_DocxExtractionTaskDetail> => {
        // 路径可能需要根据 FastAPI 的路由结构调整
        const response = await fastApiInstance.patch(`/projects/${projectId}/stages/${stageType}/start-docx-extraction/`);
        console.log('📥 [FastAPI] 手动启动文档提取成功:', response.data);
        return response.data;
    },

    getDocxExtractionTask: async (projectId: string, stageType: StageType): Promise<Type_DocxExtractionTaskDetail> => {
        console.log('📤 [FastAPI] 获取文档提取任务:', { projectId, stageType });
        const response = await fastApiInstance.get(`/projects/${projectId}/stages/${stageType}/docx-extraction/`);
        console.log('📥 [FastAPI] 获取文档提取任务成功:', response.data);
        return response.data;
    },

    updateDocxExtractionTask: async (
        projectId: string, 
        stageType: StageType, 
        taskData: Type_DocxExtractionTaskUpdate
    ): Promise<Type_DocxExtractionTaskDetail> => {
        console.log('📤 [FastAPI] 更新文档提取任务:', { projectId, stageType, taskData });
        const response = await fastApiInstance.patch(
            `/projects/${projectId}/stages/${stageType}/docx-extraction/`, 
            taskData
        );
        console.log('📥 [FastAPI] 更新文档提取任务成功:', response.data);
        return response.data;
    },
};

