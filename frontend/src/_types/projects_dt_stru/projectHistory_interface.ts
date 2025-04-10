  import { TaskType } from './projectTasks_interface';
  
  // ============================== 历史记录模型 ==============================
  
  export interface ChangeHistory {
    id: string;
    operationId: string;
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
    changedAt: Date;
    changedBy: {
      id: string;
      phone: string;
      role: string;
    };
    remarks: string;
  }
  
  // 项目变更历史记录
  export interface ProjectChangeHistory extends ChangeHistory {
    project: string;
  }
  
  // 阶段变更历史记录
  export interface StageChangeHistory extends ChangeHistory {
    project: string;
    stage: string;
  }
  
  // 任务变更历史记录
  export interface TaskChangeHistory extends ChangeHistory {
    project: string;
    stage: string;
    task: string;
    taskType: TaskType;
    isComplexField: boolean;
    changeSummary: string | null;
  }
  
  // 查询参数接口
  export interface ChangeHistoryQueryParams {
    project?: string;
    stage?: string;
    task?: string;
    fieldName?: string;
    operationId?: string;
    search?: string;
    ordering?: string;
  }
  