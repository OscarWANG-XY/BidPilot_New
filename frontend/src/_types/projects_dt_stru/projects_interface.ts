// 导入任务相关的接口和类型
import { 
    ProjectStage,
    StageType,
  } from './projectStage_interface';
  


// ============================== 基础模型 ==============================


// 项目类型枚举 - 与后端对齐
export enum ProjectType {
    WELFARE = 'WELFARE',    // 企业福利
    FSD = 'FSD',           // 食材配送
    OTHER = 'OTHER'        // 其他
  }
  
  // 项目状态枚举 - 与后端对齐
  export enum ProjectStatus {
    IN_PROGRESS = 'IN_PROGRESS', // 进行中
    COMPLETED = 'COMPLETED',     // 已完成
    CANCELLED = 'CANCELLED'      // 已取消
  }
  
  
  
  // 项目基本信息接口 - 对齐后端模型
  export interface Project {
    id: string;                      // 项目ID (UUID)
    projectName: string;             // 项目名称
    tenderee: string;                // 招标单位
    bidder: string;                  // 投标单位
    projectType: ProjectType;        // 项目类型
    bidDeadline?: Date;              // 投标截止时间（可选）
    status: ProjectStatus;           // 项目状态
    starred: boolean;               // 是否标星
    currentActiveStage: StageType;   // 当前活动阶段
    creator: {                       // 创建者信息
      id: string;
      phone: string;
      role: string;
    };
    createTime: Date;                // 创建时间
    lastUpdateTime: Date;            // 最后更新时间
  
    // 关联数据
    stages?: ProjectStage[];         // 项目阶段
  }
  
  
  // ============================== 请求/响应模型 ==============================
  
  /**
   * 项目创建请求 - 对齐后端 ProjectCreateSerializer
   */
  export type CreateProjectRequest = 
    Pick<Project, 'projectName' | 'tenderee'> &
    Partial<Pick<Project, 'bidder' | 'projectType' | 'bidDeadline' | 'starred' | 'status'>>;
  
  /**
   * 项目查询参数 - 对齐后端过滤机制
   */
  export interface ProjectQueryParams {
    currentActiveStage?: StageType;
    projectType?: ProjectType;
    starred?: boolean;
    search?: string;
    ordering?: string;
  }
  
  /**
   * 项目阶段更新请求 - 对齐后端 ProjectStageTypeUpdateSerializer
   */
  export interface UpdateProjectActiveStageRequest {
    id: string;
    currentActiveStage: StageType;
    remarks?: string;
  }
  
  /**
   * 项目状态更新请求 - 对齐后端 ProjectStatusUpdateSerializer
   */
  export interface UpdateProjectStatusRequest {
    id: string;
    status: ProjectStatus;
    remarks?: string;
  }

  // 项目侧边栏项 
  export interface ProjectsSidebarItem {
    name: string;
    url: string;
    status: string;
    created: string;
    starred: boolean;
  }