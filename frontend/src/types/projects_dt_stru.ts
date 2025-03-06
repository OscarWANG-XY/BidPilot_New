// ============================== 基础模型 ==============================

import { FileRecord } from "./files_dt_stru";

// 项目类型枚举
export enum ProjectType {
    WELFARE = 'WELFARE',    // 企业福利
    FSD = 'FSD',           // 食材配送
    OTHER = 'OTHER'        // 其他
  }
  
  // 项目状态枚举
  export enum ProjectStatus {
    IN_PROGRESS = 'IN_PROGRESS', // 进行中
    COMPLETED = 'COMPLETED',     // 已完成
    CANCELLED = 'CANCELLED'      // 已取消
  }
  
  // 项目阶段枚举 (仅包含业务阶段)
  export enum StageType {
    INITIALIZATION = 'INITIALIZATION',   // 项目初始化
    TENDER_ANALYSIS = 'TENDER_ANALYSIS', // 招标文件解读
    BID_WRITING = 'BID_WRITING',         // 投标文件撰写
    BID_REVISION = 'BID_REVISION',       // 投标文件集成和整体修订
    BID_PRODUCTION = 'BID_PRODUCTION'    // 生产投标文件
  }
  
  // 项目基本信息接口
  export interface Project {
    id: string;                    // 项目ID (后端自增主键)
    projectCode: string;           // 项目编号 (自动生成的唯一编号)
    projectName: string;           // 项目名称
    projectType: ProjectType;      // 项目类型
    tenderee: string;             // 招标单位
    bidder: string;               // 投标单位
    bidDeadline: Date;            // 投标截止时间
    status: ProjectStatus;        // 项目状态
    isUrgent: boolean;            // 是否紧急
    creator: {                    // 创建者信息
      id: string;
      username: string;
    };
    createTime: Date;             // 创建时间
    lastUpdateTime: Date;         // 最后更新时间

    // 文件相关
    files?: FileRecord[];

    // 阶段相关
    stages?: ProjectStage[];  // 阶段列表
    currentActiveStage?: StageType; // 当前活动阶段
    stageHistories?: ProjectHistory[]; // 阶段历史记录
  }
    
    // 使用示例：获取当前活跃阶段
    //const currentStage = project.stages.find(stage => stage.id === project.currentActiveStageId);
  
  // 项目阶段历史记录接口
  export interface ProjectHistory {
    historyId: string;
    projectId: string;
    fromStage: StageType;
    toStage: StageType;
    operationTime: Date;
    remarks?: string;
  }
  



  // ============================== Project的请求模型 ==============================
  /**
 * 项目创建请求
 * 对应后端 serializers.CreateProjectSerializer
 */
export type CreateProjectRequest = 
    Pick<Project, 'projectName' | 'projectType' | 'tenderee'> // 继承必填字段
    // Pick<Project, > // 继承可选字段
    & Partial<Pick<Project, 'bidder' | 'bidDeadline' | 'isUrgent'>> // 继承必填字段，但改为可选
    // & { isUrgent?: boolean;} // 添加必填/可选字段    


/**
* 项目查询请求
* 对应后端 serializers.ProjectListSerializer
*/
export type ProjectQueryParams =
    Partial<Pick<Project, 'currentActiveStage' | 'projectType' | 'isUrgent'>>
    & {
        search?: string;
        ordering?: string;
    }

export type UpdateProjectStageRequest = 
    Pick<Project, 'id'>
    & {
        stage: StageType;
        remarks?: string;
    }
// 更新项目状态请求
export type UpdateProjectStatusRequest = 
    Pick<Project, 'id'|'status'>
    & {
        remarks?: string;
    }


// ============================== 阶段模型 ==============================

// 阶段状态枚举
export enum StageStatus {
  NOT_STARTED = 'NOT_STARTED',   // 未开始
  IN_PROGRESS = 'IN_PROGRESS',   // 进行中
  COMPLETED = 'COMPLETED',       // 已完成
  BLOCKED = 'BLOCKED'            // 阻塞中（例如等待外部反馈）
}

// 统一的阶段模型
export interface ProjectStage {
    id: string;
    projectId: string;
    stage: StageType;         // 阶段类型，作为区分不同阶段的标识
    name: string;
    status: StageStatus;
    description: string;
    progress: number;
    remarks?: string;
    
    // 可选字段，根据不同阶段类型可能存在
    fileId?: string;             // 用于初始化阶段的文件ID
    file?: FileRecord;
    tasks?: Task[];  // 阶段相关任务，可以是多种任务类型的组合
    
    // 其他可能的阶段特定字段
    metadata?: Record<string, any>;
}

export type Task = BaseTask | DocumentExtractionTask | DocumentTreeBuildingTask;

// 项目阶段概览响应接口 - 用于前端展示




// 项目概览响应接口 - 包含项目基本信息和所有阶段概览
export interface ProjectOverviewResponse {
  project: Project;
  stages: ProjectStage[];
}


export type ProjectStageOverview = 
  Pick<ProjectStage, 'id' | 'name'| 'stage' |  'status' | 'description'  | 'progress' | 'tasks' | 'remarks'>

export type ProjectStageViewResponse 
  = Pick<ProjectStage, 'id' | 'stage' | 'name' | 'description' | 'status' | 'progress'|'fileId'|'tasks'|'remarks'>

// ============================== 任务模型 ==============================

// 任务类型枚举 - 根据业务场景添加
export enum TaskType {
  // 项目初始化阶段任务类型
  PROJECT_BASIC_INFO_INPUT = 'PROJECT_BASIC_INFO_INPUT', // 项目基本信息输入
  RENDER_DOCUMENT_UPLOAD = 'RENDER_DOCUMENT_UPLOAD', // 渲染文档上传

  // 招标文件分析阶段任务类型
  DOCUMENT_EXTRACTION = 'DOCUMENT_EXTRACTION',       // 提取文档信息
  DOCUMENT_TREE_BUILDING = 'DOCUMENT_TREE_BUILDING', // 构建文档树
  AI_STRUCTURE_ANALYSIS = 'AI_STRUCTURE_ANALYSIS',   // AI分析层级结构
  BIDDER_INSTRUCTION_ANALYSIS = 'BIDDER_INSTRUCTION_ANALYSIS', // 分析投标人须知
  SCORING_CRITERIA_ANALYSIS = 'SCORING_CRITERIA_ANALYSIS',     // 分析评分标准
  BID_DOCUMENT_COMPOSITION = 'BID_DOCUMENT_COMPOSITION',       // 分析投标文件组成
  
  // 投标文件撰写阶段任务类型
  CHAPTER_WRITING = 'CHAPTER_WRITING',               // 章节撰写
  TECHNICAL_SOLUTION = 'TECHNICAL_SOLUTION',         // 技术方案
  PRICE_PROPOSAL = 'PRICE_PROPOSAL',                 // 价格方案
  QUALIFICATION_DOCUMENTS = 'QUALIFICATION_DOCUMENTS', // 资质文件
  
  // 通用任务类型
  DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',               // 文档审核
  DOCUMENT_REVISION = 'DOCUMENT_REVISION',           // 文档修订
  DOCUMENT_PRODUCTION = 'DOCUMENT_PRODUCTION',       // 文档生产
  OTHER = 'OTHER'                                    // 其他
}

// 任务状态枚举
export enum TaskStatus {
  PENDING = 'PENDING',           // 待处理
  PROCESSING = 'PROCESSING',     // 处理中
  COMPLETED = 'COMPLETED',       // 已完成
  FAILED = 'FAILED',             // 失败
  CONFIRMED = 'CONFIRMED',       // 已确认
  BLOCKED = 'BLOCKED'            // 阻塞中（例如等待依赖任务）
}

// 基础任务接口
export interface BaseTask {
    id: string;
    stageId: string;
    name: string;
    description: string;
    progress: number;
    type: TaskType;
    status: TaskStatus;
    createdAt: Date;
    updatedAt: Date;
}

// 特定任务类型接口 - 可以根据需要扩展
export interface DocumentExtractionTask extends BaseTask {
    type: TaskType.DOCUMENT_EXTRACTION;
    fileId: string;
    //documentElements: DocumentElement[];
}

export interface DocumentTreeBuildingTask extends BaseTask {
    type: TaskType.DOCUMENT_TREE_BUILDING;
}


