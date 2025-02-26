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
export enum ProjectStage {
  INITIALIZATION = 'INITIALIZATION',   // 项目初始化
  TENDER_ANALYSIS = 'TENDER_ANALYSIS', // 招标文件解读
  BID_WRITING = 'BID_WRITING',         // 投标文件撰写
  BID_REVISION = 'BID_REVISION',       // 投标文件集成和整体修订
  BID_PRODUCTION = 'BID_PRODUCTION'    // 生产投标文件
}

// 项目基本信息接口
export interface Project {
  id: number;                    // 项目ID (后端自增主键)
  projectCode: string;           // 项目编号 (自动生成的唯一编号)
  projectName: string;           // 项目名称
  projectType: ProjectType;      // 项目类型
  tenderee: string;             // 招标单位
  bidder: string;               // 投标单位
  bidDeadline: Date;            // 投标截止时间
  status: ProjectStatus;        // 项目状态
  currentStage: ProjectStage;    // 当前阶段
  stageHistories?: ProjectHistory[];  // 添加这个属性
  isUrgent: boolean;            // 是否紧急
  creator: {                    // 创建者信息
    id: number;
    username: string;
  };
  createTime: Date;             // 创建时间
  lastUpdateTime: Date;         // 最后更新时间
}

// 项目阶段历史记录接口
export interface ProjectHistory {
  historyId: number;
  projectId: number;
  fromStage: ProjectStage;
  toStage: ProjectStage;
  operationTime: Date;
  remarks?: string;
}

// 创建项目的请求接口
export interface CreateProjectRequest {
  projectName: string;
  projectType: ProjectType;
  tenderee: string;
  bidder?: string;
  bidDeadline?: Date;
  isUrgent?: boolean;
}

// 更新项目阶段的请求接口
export interface UpdateProjectStageRequest {
  projectId: number;
  stage: ProjectStage;
  remarks?: string;
}

// 项目查询的请求接口
export interface ProjectQueryParams {
  current_stage?: ProjectStage;
  project_type?: ProjectType;
  is_urgent?: boolean;
  search?: string;
  ordering?: string;
}