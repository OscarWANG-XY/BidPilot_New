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
  //streamingResult?: string;   //只读    
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
  //docxTiptap?: string;         
  context?: string;            
  prompt?: string;             
  relatedCompanyInfo?: string;         
  finalResult?: string;
}
  

//------------- 针对TASK的处理 -------------
export const TaskApi = {

    // 手动启动文档提取， 不需要专门发送status数据，只需要有请求到后端特定的端口即可。
    // patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/start_task/`)
 

    // 获取项目阶段下的文档提取任务
    //get(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/get_task/`)
    getTask: async (projectId: string, stageType: StageType, taskType: TaskType): Promise<Type_TaskDetail> => {
        console.log('📤 获取文档提取任务:', { projectId, stageType });
        const response = await axiosInstance.get(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/`);
        console.log('📥 获取文档提取任务成功:', response.data);
        return response.data;
    },

    // 更新项目阶段下的文档提取任务
    // patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/update_task/`, taskData)
    updateTask: async (
        projectId: string, 
        stageType: StageType, 
        taskType: TaskType,
        taskData: Type_TaskUpdate
    ): Promise<Type_TaskDetail> => {
        console.log('📤 更新文档提取任务:', { projectId, stageType, taskData });
        const response = await axiosInstance.patch(
        `/projects/${projectId}/stages/${stageType}/tasks/${taskType}/update_task/`, 
        taskData
        );
        console.log('📥 更新文档提取任务成功:', response.data);
        return response.data;
    },

    // 加载配置
    // axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/load_config/`)
    loadConfig: async (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType
  ): Promise<Type_TaskDetail> => {
      const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/load_config/`);
      console.log('📥 加载配置成功:', response.data);
      return response.data;
  },

    // 保存配置
    // axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/save_config/`, taskData)
    saveConfig: async (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType,
      taskData: Partial<Type_TaskUpdate>  //在useTasks中，传入了匿名对象 {context, prompt, relatedCompanyInfo}， 这是通过位置与taskData匹配上的。 
  ): Promise<Type_TaskDetail> => {
      const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/save_config/`, taskData);
      console.log('📥 保存配置成功:', response.data);
      return response.data;
  },

    // 开始分析
    // axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/start_analysis/`)
    startAnalysis: async (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType
  ): Promise<Type_TaskDetail> => {
      const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/start_analysis/`);
      console.log('📥 开始分析成功:', response.data);
      return response.data;
  },

    // 开始审核
    // axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/start_review/`)
    startReview: async (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType
  ): Promise<Type_TaskDetail> => {
      const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/start_review/`);
      console.log('📥 开始审核成功:', response.data);
      return response.data;
  },

    // 接受结果
    // axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/accept_result/`)
    acceptResult: async (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType
  ): Promise<Type_TaskDetail> => {
      const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/accept_result/`);
      console.log('📥 接受结果成功:', response.data);
      return response.data;
  },

    // 保存编辑结果
    // axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/save_edited_result/`, taskData)
    saveEditedResult: async (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType,
      taskData: Partial<Type_TaskUpdate>
  ): Promise<Type_TaskDetail> => {
      const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/save_edited_result/`, taskData);
      console.log('📥 保存编辑结果成功:', response.data);
      return response.data;
  },

    // 重置任务
    // axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/reset_task/`)
    resetTask: async (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType
  ): Promise<Type_TaskDetail> => {
      const response = await axiosInstance.patch(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/reset_task/`);
      console.log('📥 重置任务成功:', response.data);
      return response.data;
  },



  }

  
