import axiosInstance from '../../../_api/axios_instance';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type { 
  TaskType, 
//  TaskStatus 
} from '@/_types/projects_dt_stru/projectTasks_interface';


// 任务状态枚举 - 与后端对齐
export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',   
  CONFIGURING = 'CONFIGURING',             
  PROCESSING = 'PROCESSING',   // 替换ANALYZING, ACTIVE
  REVIEWING = 'REVIEWING',              
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ------------- 定义接口 -------------

// 任务查询接口 - 对应 TaskDetailSerializer
export interface Type_TaskDetail {
  // 基本信息
  id: string;                  
  name: string;                
  type: TaskType;              
  status: TaskStatus;
  // 配置数据       
  context?: string;            
  prompt?: string;             
  relatedCompanyInfo?: string;        
  // 结果数据
  streamingResult?: string;   //只读    
  //originalResult?: string;    不再增加originalResult, 结果的编辑直接在finalResult中进行。 
  finalResult?: string;
  // 统计数据
  taskStartedAt?: string;      //只读
  taskCompletedAt?: string;    //只读
  analysisDuration?: number;   //只读
  inTokens?: number;     //只读
  outTokens?: number;    //只读
  totalTokens?: number;  //只读
  errorMessage?: string; //只读
}

// 文档提取任务更新接口 - 对应 DocxExtractionTaskUpdateSerializer
export interface Type_TaskUpdate {         
  status: TaskStatus;          
  docxTiptap?: string;         
  context?: string;            
  prompt?: string;             
  companyInfo?: string;         
  finalResult?: string;
}
  

//------------- 针对TASK的处理 -------------
export const TaskApi = {

    // 手动启动文档提取， 不需要专门发送status数据，只需要有请求到后端特定的端口即可。
    startTask: async (
        projectId: string, 
        stageType: StageType, 
    ): Promise<Type_TaskDetail> => {
        const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/start_docx_extraction/`);
        console.log('📥 手动启动文档提取成功:', response.data);
        return response.data;
    },


    // 获取项目阶段下的文档提取任务
    getTask: async (projectId: string, stageType: StageType): Promise<Type_TaskDetail> => {
        console.log('📤 获取文档提取任务:', { projectId, stageType });
        const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/docx_extraction/`);
        console.log('📥 获取文档提取任务成功:', response.data);
        return response.data;
    },

    // 更新项目阶段下的文档提取任务
    updateTask: async (
        projectId: string, 
        stageType: StageType, 
        taskData: Type_TaskUpdate
    ): Promise<Type_TaskDetail> => {
        console.log('📤 更新文档提取任务:', { projectId, stageType, taskData });
        const response = await axiosInstance.patch(
        `/projects/${projectId}/stages/${stageType}/docx_extraction/`, 
        taskData
        );
        console.log('📥 更新文档提取任务成功:', response.data);
        return response.data;
    },
  }
