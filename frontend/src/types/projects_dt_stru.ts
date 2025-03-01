// ============================== 基础模型 ==============================
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
    id: string;                    // 项目ID (后端自增主键)
    projectCode: string;           // 项目编号 (自动生成的唯一编号)
    projectName: string;           // 项目名称
    projectType: ProjectType;      // 项目类型
    tenderee: string;             // 招标单位
    bidder: string;               // 投标单位
    bidDeadline: Date;            // 投标截止时间
    status: ProjectStatus;        // 项目状态
    currentStage: ProjectStage;    // 当前阶段
    isUrgent: boolean;            // 是否紧急
    creator: {                    // 创建者信息
      id: string;
      username: string;
    };
    createTime: Date;             // 创建时间
    lastUpdateTime: Date;         // 最后更新时间

    // 阶段历史记录, 后端通过 ProjectHistorySerializer 序列化合成
    stageHistories: ProjectHistory[]; // 阶段历史记录
  }
  
  // 项目阶段历史记录接口
  export interface ProjectHistory {
    historyId: string;
    projectId: string;
    fromStage: ProjectStage;
    toStage: ProjectStage;
    operationTime: Date;
    remarks?: string;
  }
  



  // ============================== 请求模型 ==============================
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
Partial<Pick<Project, 'currentStage' | 'projectType' | 'isUrgent'>>
& {
    search?: string;
    ordering?: string;
}

export type UpdateProjectStageRequest = 
    Pick<Project, 'id'>
    & {
        stage: ProjectStage;
        remarks?: string;
    }


// 阶段状态枚举
export enum StageStatus {
  NOT_STARTED = 'NOT_STARTED',   // 未开始
  IN_PROGRESS = 'IN_PROGRESS',   // 进行中
  COMPLETED = 'COMPLETED',       // 已完成
  BLOCKED = 'BLOCKED'            // 阻塞中（例如等待外部反馈）
}

// 阶段接口
export interface Stage {
    id: string;
    name: string;
    description: string;
    status: StageStatus;
    createdAt: Date;
}
