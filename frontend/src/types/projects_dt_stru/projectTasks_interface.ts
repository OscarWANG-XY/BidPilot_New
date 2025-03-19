// ============================== 基础模型 ==============================


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
  
  export enum TaskLockStatus {
    LOCKED = 'LOCKED',             // 锁定
    UNLOCKED = 'UNLOCKED'           // 解锁
  }
  
  // ============================== 任务模型 ==============================
  
  // 统一的任务接口 - 对齐后端 Task 模型
  export interface Task {
    id: string;
    stage: string;                 // 所属阶段ID
    name: string;                  // 任务名称
    description: string;           // 描述
    type: TaskType;                // 任务类型
    status: TaskStatus;            // 状态
    createdAt: Date;               // 创建时间
    updatedAt: Date;               // 更新时间
    lockStatus: TaskLockStatus;    // 锁定状态
    tiptapContent?: any;           // tiptap内容（JSON，可选）
  }
  
  // 特定任务类型接口 - 对应后端特定任务的序列化器
  
  // 文件上传任务接口 - 对应 FileUploadTaskDetailSerializer
  export interface FileUploadTask extends Task {
    // 目前没有特殊字段，但保留接口以匹配后端特定视图
  }
  
  // 文档提取任务接口 - 对应 DocxExtractionTaskDetailSerializer
  export interface DocxExtractionTask extends Task {
    // 可能通过tiptapContent存储提取的内容
  }
  
  // 文档树构建任务接口 - 对应未来可能实现的序列化器
  export interface DocxTreeBuildTask extends Task {
    // 可能通过tiptapContent存储文档树结构
  }
  
  // 任务联合类型 - 所有特定任务类型的联合
  export type AnyTask = Task | DocxExtractionTask | DocxTreeBuildTask;
  
  // 定义任务元数据接口，包含状态和锁定状态
  export interface TaskMetaData {
    id: string;
    name: string;
    description: string;
    type: TaskType;
    status: TaskStatus;
    lockStatus: TaskLockStatus; // 添加锁定状态
  }
  
  export type AllTaskState = {
    fileUploadStatus: TaskStatus;
    docxExtractionStatus: TaskStatus;
    docxTreeBuildStatus: TaskStatus;
    fileUploadLock: TaskLockStatus;
    docxExtractionLock: TaskLockStatus;
    docxTreeBuildLock: TaskLockStatus
  }
  
  
  
  // ============================== 请求/响应模型 ==============================
 

  
  
  