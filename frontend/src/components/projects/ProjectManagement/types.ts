import { ProjectStage, ProjectType, ProjectStatus } from '../../../types/projects_dt_stru';
import { FileRecord, FileType } from '../../../types/files_dt_stru';

// 阶段状态枚举
export enum PhaseStatus {
  NOT_STARTED = 'NOT_STARTED',   // 未开始
  IN_PROGRESS = 'IN_PROGRESS',   // 进行中
  COMPLETED = 'COMPLETED',       // 已完成
  BLOCKED = 'BLOCKED'            // 阻塞中（例如等待外部反馈）
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

// 任务类型枚举 - 根据业务场景添加
export enum TaskType {
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

// 项目阶段接口
export interface ProjectPhase {
  id: string;                    // 阶段ID
  name: string;                  // 阶段名称
  stage: ProjectStage;           // 业务阶段（对应业务流程中的位置）
  status: PhaseStatus;           // 阶段状态（未开始、进行中、已完成等）
  description: string;           // 阶段描述
  startDate?: string;            // 开始日期
  endDate?: string;              // 结束日期
  tasks: Task[];                 // 阶段包含的任务
  documents?: FileRecord[];       // 阶段相关文档
  progress?: number;             // 阶段进度（0-100）
  remarks?: string;              // 备注
  isAutomatic?: boolean;         // 是否自动执行（如AI分析）
}

// 任务接口
export interface Task {
  id: string;                    // 任务ID
  name: string;                  // 任务名称
  type: TaskType;                // 任务类型
  status: TaskStatus;            // 任务状态
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'; // 任务优先级
  date?: string;                 // 任务日期
  dueDate?: string;              // 截止日期
  description?: string;          // 任务描述
  attachments?: FileRecord[];    // 任务附件
  dependencies?: string[];       // 依赖任务的ID列表
  progress?: number;             // 任务进度（0-100）
  isAutomatic?: boolean;         // 是否自动执行（如AI分析）
  aiAssisted?: boolean;          // 是否AI辅助
  chapterReference?: string;     // 章节引用（适用于章节撰写任务）
  outputDocuments?: FileRecord[]; // 输出文档
  inputDocuments?: FileRecord[]; // 输入文档
  comments?: TaskComment[];      // 任务评论
  metadata?: Record<string, any>; // 任务元数据（可存储特定任务类型的额外信息）
  createdAt?: string;            // 创建时间
  updatedAt?: string;            // 更新时间
}

// 章节信息接口 - 用于投标文件撰写
export interface Chapter {
  id: string;                    // 章节ID
  title: string;                 // 章节标题
  level: number;                 // 章节层级（1为一级标题，2为二级标题，以此类推）
  parentId?: string;             // 父章节ID
  order: number;                 // 排序顺序
  content?: string;              // 章节内容
  wordCount?: number;            // 字数统计
  status: TaskStatus;            // 章节状态
  taskId?: string;               // 关联的任务ID
  isRequired: boolean;           // 是否必填
  templateReference?: string;    // 模板引用
  aiSuggestions?: string;        // AI建议
}

// 文档树节点接口 - 用于招标文件分析
export interface DocumentTreeNode {
  id: string;                    // 节点ID
  title: string;                 // 节点标题
  level: number;                 // 节点层级
  parentId?: string;             // 父节点ID
  order: number;                 // 排序顺序
  content?: string;              // 节点内容
  isImportant: boolean;          // 是否重要
  notes?: string;                // 备注
  relatedBidSections?: string[]; // 相关投标章节
}

// 评分标准接口 - 用于招标文件分析
export interface ScoringCriteria {
  id: string;                    // 评分标准ID
  section: string;               // 所属章节
  description: string;           // 描述
  maxScore: number;              // 最高分
  scoringMethod: string;         // 评分方法
  requirements: string;          // 要求
  importance: 'LOW' | 'MEDIUM' | 'HIGH'; // 重要性
  relatedBidSections?: string[]; // 相关投标章节
}

// 任务评论接口
export interface TaskComment {
  id: string;                    // 评论ID
  content: string;               // 评论内容
  createdAt: string;             // 创建时间
  attachments?: FileRecord[];    // 评论附件
}

// 项目历史记录接口
export interface ProjectHistory {
  historyId: number;
  projectId: number;
  fromStage: ProjectStage;
  toStage: ProjectStage;
  operationTime: Date;
  remarks?: string;
}

// 阶段历史记录接口
export interface PhaseHistory {
  id: string;
  phaseId: string;
  fromStatus: PhaseStatus;
  toStatus: PhaseStatus;
  timestamp: string;
  remarks?: string;
}

// 任务历史记录接口
export interface TaskHistory {
  id: string;
  taskId: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  timestamp: string;
  remarks?: string;
}

// 项目统计信息接口
export interface ProjectStats {
  totalPhases: number;
  completedPhases: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  progress: number;              // 总体进度（0-100）
  estimatedCompletionDate?: string; // 预计完成日期
}

// 阶段统计信息接口
export interface PhaseStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  progress: number;              // 阶段进度（0-100）
}
