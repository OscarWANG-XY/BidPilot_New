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

// 任务类型枚举 - 与后端对齐
export enum TaskType {
  UPLOAD_TENDER_FILE = 'UPLOAD_TENDER_FILE',     //'上传招标文件'
  DOCX_EXTRACTION_TASK = 'DOCX_EXTRACTION_TASK', //'提取文档信息'
  DOCX_TREE_BUILD_TASK = 'DOCX_TREE_BUILD_TASK',  //'构建文档树'
  // AI_STRUCTURE_ANALYSIS = 'AI_STRUCTURE_ANALYSIS',        // AI分析层级结构
  // BIDDER_INSTRUCTION_ANALYSIS = 'BIDDER_INSTRUCTION_ANALYSIS', // 分析投标人须知
  // SCORING_CRITERIA_ANALYSIS = 'SCORING_CRITERIA_ANALYSIS',     // 分析评分标准
  // BID_DOCUMENT_COMPOSITION = 'BID_DOCUMENT_COMPOSITION',       // 分析投标文件组成
  // CHAPTER_WRITING = 'CHAPTER_WRITING',                    // 章节撰写
  // TECHNICAL_SOLUTION = 'TECHNICAL_SOLUTION',              // 技术方案
  // PRICE_PROPOSAL = 'PRICE_PROPOSAL',                      // 价格方案
  // QUALIFICATION_DOCUMENTS = 'QUALIFICATION_DOCUMENTS',    // 资质文件
  // DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',                    // 文档审核
  // DOCUMENT_REVISION = 'DOCUMENT_REVISION',                // 文档修订
  // DOCUMENT_PRODUCTION = 'DOCUMENT_PRODUCTION',            // 文档生产
  OTHER = 'OTHER'                                         // 其他
}

// 任务状态枚举 - 与后端对齐
export enum TaskStatus {
  PENDING = 'PENDING',           // 待处理
  PROCESSING = 'PROCESSING',     // 处理中
  COMPLETED = 'COMPLETED',       // 已完成
  FAILED = 'FAILED',             // 失败
  CONFIRMED = 'CONFIRMED',       // 已确认
  BLOCKED = 'BLOCKED'            // 阻塞中
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
  isUrgent: boolean;               // 是否紧急
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
  stageHistories?: ProjectHistory[]; // 项目历史记录
}

// 项目阶段历史记录接口 - 对齐后端模型
export interface ProjectHistory {
  id: string;
  project: string;               // 项目ID
  fromStage: StageType;          // 原阶段
  toStage: StageType;            // 新阶段
  fromStatus?: ProjectStatus;    // 原状态（可选）
  toStatus?: ProjectStatus;      // 新状态（可选）
  operationTime: Date;           // 操作时间
  remarks?: string;              // 备注
}

// ============================== 项目阶段模型 ==============================

// 项目阶段接口 - 对齐后端模型
export interface ProjectStage {
  id: string;
  project: string;                // 项目ID
  stageType: StageType;           // 阶段类型
  name: string;                   // 阶段名称
  stageStatus: StageStatus;       // 阶段状态
  description: string;            // 描述
  fileId?: string;                // 文件ID（可选）
  progress: number;               // 进度
  remarks?: string;               // 备注（可选）
  createdAt: Date;                // 创建时间
  updatedAt: Date;                // 更新时间
  metadata: Record<string, any>;  // 元数据
  tasks?: AllTask[];                 // 关联任务
}

// ============================== 任务模型 ==============================

// 基础任务接口 - 对齐后端模型
export interface BaseTask {
  id: string;
  stage: string;                 // 所属阶段ID
  name: string;                  // 任务名称
  description: string;           // 描述
  type: TaskType;                // 任务类型
  status: TaskStatus;            // 状态
  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}

// 文档提取任务接口 - 对齐后端模型
export interface DocxExtractionTask extends BaseTask {
  extractedElements?: any;        // 提取的文档元素（JSON）
  outlineAnalysisResult?: any;    // 大纲分析结果（JSON）
  improvedDocxElements?: any;     // 初步大纲优化后的文档元素（JSON）
}

// 文档树构建任务接口 - 对齐后端模型
export interface DocxTreeBuildTask extends BaseTask {
  docxtree?: any;                 // 文档树（JSON）
  moreSubtitles?: any;            // 更多子标题（JSON）
}

// 任务联合类型 - 所有特定任务类型的联合
export type AllTask = BaseTask | DocxExtractionTask | DocxTreeBuildTask;

export type AllTaskState = {
  tenderFileUpload: TaskStatus
  docxExtractionTask: TaskStatus
  docxTreeBuildTask: TaskStatus
}



// ============================== 请求/响应模型 ==============================

/**
 * 项目创建请求 - 对齐后端 ProjectCreateSerializer
 */
export type CreateProjectRequest = 
  Pick<Project, 'projectName' | 'tenderee'> &
  Partial<Pick<Project, 'bidder' | 'projectType' | 'bidDeadline' | 'isUrgent' | 'status'>>;

/**
 * 项目查询参数 - 对齐后端过滤机制
 */
export interface ProjectQueryParams {
  currentActiveStage?: StageType;
  projectType?: ProjectType;
  isUrgent?: boolean;
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


/**
 * 任务更新请求 - 基于任务类型
 */
export interface BaseTaskUpdateRequest {
  name?: string;
  description?: string;
  status?: TaskStatus;
}

export interface DocxExtractionTaskUpdateRequest extends BaseTaskUpdateRequest {
  extractedElements?: any;
  outlineAnalysisResult?: any;
  improvedDocxElements?: any;
}

export interface DocxTreeBuildTaskUpdateRequest extends BaseTaskUpdateRequest {
  docxtree?: any;
  moreSubtitles?: any;
}

