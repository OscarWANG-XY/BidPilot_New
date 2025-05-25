// 原有的 Django API
//import axiosInstance from '@/_api/axios_instance';
// 新增的 FastAPI API
import fastApiInstance from '@/_api/axios_instance_fa';
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
    ): Promise<Type_DocxExtractionTaskDetail> => {
        // 路径可能需要根据 FastAPI 的路由结构调整
        const response = await fastApiInstance.patch(`/projects/${projectId}/start-docx-extraction/`);
        console.log('📥 [FastAPI] 手动启动文档提取成功:', response.data);
        return response.data;
    },

    getDocxExtractionTask: async (projectId: string): Promise<Type_DocxExtractionTaskDetail> => {
        console.log('📤 [FastAPI] 获取文档提取任务:', { projectId});
        const response = await fastApiInstance.get(`/projects/${projectId}/docx-extraction/`);
        console.log('📥 [FastAPI] 获取文档提取任务成功:', response.data);
        return response.data;
    },

    updateDocxExtractionTask: async (
        projectId: string, 
        taskData: Type_DocxExtractionTaskUpdate
    ): Promise<Type_DocxExtractionTaskDetail> => {
        console.log('📤 [FastAPI] 更新文档提取任务:', { projectId, taskData });
        const response = await fastApiInstance.patch(
            `/projects/${projectId}/docx-extraction/`, 
            taskData
        );
        console.log('📥 [FastAPI] 更新文档提取任务成功:', response.data);
        return response.data;
    },
};

