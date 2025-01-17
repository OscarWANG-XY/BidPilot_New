// 项目类型枚举
export enum ProjectType {
  ENTERPRISE_WELFARE = '福利礼品',    // 企业福利
  CANTEEN_PROCUREMENT = '食材配送',  // 食堂采购
}

// 项目状态枚举
export enum ProjectStatus {
    DRAFT = 'DRAFT',           // 草稿
    IN_PROGRESS = 'IN_PROGRESS', // 进行中
    COMPLETED = 'COMPLETED',     // 已完成
    SUSPENDED = 'SUSPENDED',     // 已暂停
    CANCELLED = 'CANCELLED'      // 已取消
  }
  
  // 项目阶段枚举
  export enum ProjectPhase {
    INITIATION = 'INITIATION',   // 初始化/立项阶段
    TENDER_ANALYSIS = 'TENDER_ANALYSIS',           // 招标文件分析
    BID_DOCUMENT_PREPARATION = 'BID_DOCUMENT_PREPARATION', // 投标文件准备
    TECHNICAL_PROPOSAL = 'TECHNICAL_PROPOSAL',     // 技术方案编制
    PRICING = 'PRICING',                          // 价格编制
    DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',          // 文件审核
    BID_SUBMISSION = 'BID_SUBMISSION'             // 投标提交
  }

  // 项目基本信息接口
  export interface ProjectBasicInfo {
    id: string;
    name: string;                // 项目名称
    code: string;                // 项目编号
    tenderee: string;           // 招标方
    bidder: string;             // 投标方
    projectType: ProjectType;        // 项目类型
    industry: string;           // 所属行业
    expectedBudget: number;     // 预计预算
    createTime: Date;           // 创建时间
    updateTime: Date;           // 更新时间
    deadline: Date;             // 截止时间
  }
  
  // 项目阶段详情接口
  export interface PhaseDetail {
    phaseId: string;
    phase: ProjectPhase;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    startTime?: Date;
    endTime?: Date;
    assignee?: string;          // 负责人
    documents: ProjectDocument[];
    aiAnalysis?: AIAnalysisResult;
  }
  
  // 项目文档接口
  export interface ProjectDocument {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadTime: Date;
    uploader: string;
    version: number;
    remarks?: string;
  }
  
  // AI分析结果接口
  export interface AIAnalysisResult {
    id: string;
    analysisTime: Date;
    documentStructure?: string[];    // 文档目录结构
    keyPoints?: string[];            // 关键点分析
    recommendations?: string[];      // 建议
    riskAnalysis?: RiskAnalysis[];   // 风险分析
  }
  
  // 风险分析接口
  export interface RiskAnalysis {
    id: string;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    suggestion: string;
  }
  
  // 完整项目接口
  export interface Project extends ProjectBasicInfo {
    status: ProjectStatus;
    currentPhase: ProjectPhase;
    phases: PhaseDetail[];
    progress: number;            // 总体进度（百分比）
    attachments?: ProjectDocument[];
    lastModifiedBy: string;
    createBy: string;
    remarks?: string;
  }
  
  // 创建项目的请求接口
  export interface CreateProjectRequest {
    name: string;
    code?: string;
    tenderee: string;
    bidder?: string;
    projectType: ProjectType;
    industry?: string;
    expectedBudget?: number;
    deadline?: Date;
    remarks?: string;
  }
  
  // 更新项目状态的请求接口
  export interface UpdateProjectStatusRequest {
    projectId: string;
    status: ProjectStatus;
    remarks?: string;
  }
  
  // 更新项目阶段的请求接口
  export interface UpdateProjectPhaseRequest {
    projectId: string;
    phaseId: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    assignee?: string;
    remarks?: string;
  }