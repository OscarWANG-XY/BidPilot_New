// 导入任务相关的接口和类型
import { TaskType, TaskStatus } from './projectTasks_interface';

// ============================== 基础模型 ==============================

  
  // 项目阶段枚举 - 与后端对齐，仅包含后端定义的阶段
  export enum StageType {
    TENDER_ANALYSIS = 'TENDER_ANALYSIS', // 招标文件分析
    BID_WRITING = 'BID_WRITING'          // 投标文件编写
    // 注意：后端注释掉了INITIALIZATION, BID_REVISION, BID_PRODUCTION
  }
  
  // 阶段状态枚举 - 与后端对齐
  export enum StageStatus {
    NOT_STARTED = 'NOT_STARTED',   // 未开始
    IN_PROGRESS = 'IN_PROGRESS',   // 进行中
    COMPLETED = 'COMPLETED',       // 已完成
    BLOCKED = 'BLOCKED'            // 阻塞中
  }
  
  
  // ============================== 项目阶段模型 ==============================
  

  export interface TaskList {
    id: string;
    name: string;                  // 任务名称
    type: TaskType;                // 任务类型
    status: TaskStatus;            // 状态
    taskLevel: number;             // 任务层级
    updatedAt: Date;               // 更新时间
  }


  // 项目阶段接口 - 对齐后端模型
  export interface ProjectStage {
    id: string;
    project: string;                // 项目ID
    stageType: StageType;           // 阶段类型
    name: string;                   // 阶段名称
    stageStatus: StageStatus;       // 阶段状态
    description: string;            // 描述
    progress: number;               // 进度
    createdAt: Date;                // 创建时间
    updatedAt: Date;                // 更新时间
    metadata: Record<string, any>;  // 元数据
    tasks?: TaskList[];                 // 关联任务
  }
  


  