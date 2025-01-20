import { FileRecord } from "./files_dt_stru";

// ================================ 项目类型  ============================================ 

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
    INITIATION = 'INITIATION',   // 项目启动
    TENDER_ANALYSIS = 'TENDER_ANALYSIS',           // 招标文件分析
    BID_DOCUMENT_PREPARATION = 'BID_DOCUMENT_PREPARATION', // 投标文件准备
    TECHNICAL_PROPOSAL = 'TECHNICAL_PROPOSAL',     // 技术方案编制
    PRICING = 'PRICING',                          // 价格编制
    DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',          // 文件审核
    BID_SUBMISSION = 'BID_SUBMISSION'             // 投标提交
  }


  // 项目基本信息接口
  export interface ProjectBasicInfo {
    id: string;                  // 项目ID：  basic, system，用于系统内部建立数据关联, readOnly
    name: string;                // 项目名称： basic，用户输入， text, editable 
    code: string;                // 项目编号:  basic，系统生成，text，readOnly
    projectType: ProjectType;    // 项目类型:  basic，用户输入，select, editable
    tenderee: string;           // 招标方:  basic，用户/分析输入，text，editable
    bidder: string;             // 投标方:  basic，用户输入，text，editable
    industry: string;           // 所属行业:  basic，用户输入，text, editable
    expectedBudget: number;     // 预计预算:  basic，用户/分析输入，number, editable
    createTime: Date;           // 创建时间:  system，readOnly
    updateTime: Date;           // 更新时间:  system，readOnly
    deadline: Date;             // 截止时间:  basic，用户/分析输入，date, editable
  }

    // 完整项目接口  (extended on ProjectBasicInfo，11个字段+8个字段 = 19个字段total) 
  export interface Project extends ProjectBasicInfo {
    status: ProjectStatus;      // 项目状态： status，用户/分析输入，select，editable
    currentPhase: ProjectPhase; // 当前阶段： status，用户/分析输入，select，editable
    phases: PhaseDetail[];      // 项目阶段： phases，用户/分析输入，select，editable
    progress: number;            // 总体进度: status，使用阶段权重进行计算, readOnly
    attachments?: ProjectDocument[]; // 附件： documents，用户/分析输入，select，editable
    lastModifiedBy: string;      // 最后修改人: system，readOnly
    createBy: string;            // 创建人:    system，readOnly
    remarks?: string;            // 备注：     basic，用户输入，textarea，editable  
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
  

// ================================ 项目文档类型  ============================================ 

  // 项目文档类型枚举
  export enum ProjectDocumentType {
    TENDER_DOCUMENT = 'TENDER_DOCUMENT',          // 招标文件
    TECHNICAL_SOLUTION = 'TECHNICAL_SOLUTION',    // 技术方案
    PRICE_DOCUMENT = 'PRICE_DOCUMENT',           // 价格文件
    QUALIFICATION = 'QUALIFICATION',             // 资质文件
    MEETING_MINUTES = 'MEETING_MINUTES',         // 会议纪要
    OTHER = 'OTHER'                              // 其他文件
  }

  export interface ProjectFileMetadata {
    phaseId?: string;                           // 关联的项目阶段ID
    phase?: ProjectPhase;                       // 关联的项目阶段
    documentType: ProjectDocumentType;          // 文档类型
    version?: number;                           // 文档版本
    reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'; // 审核状态
    reviewComment?: string;                     // 审核意见
    isTemplate?: boolean;                       // 是否是模板文件
    requiredByPhase?: boolean;                 // 是否是阶段必需文件
    customFields?: Record<string, unknown>;     // 自定义字段
  }

  // 更新 ProjectDocument 接口
  export interface ProjectDocument {
    fileRecord: FileRecord;                     // 关联的文件记录
    projectMetadata: ProjectFileMetadata;       // 项目相关的元数据
    uploadTime: Date;                           // 上传时间
    uploader: string;                           // 上传人
    remarks?: string;                           // 备注
  }

  

// ================================ 分析接口  ============================================ 

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
  

// ================================ 请求接口  ============================================ 
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