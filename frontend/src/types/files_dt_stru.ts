

// ================================ 文件数据结构定义 ============================================ 

// 定义为？可选时，意味着对象形态可能有/没有这个字段，有字段的情况，值可能时undefined. 
// undefined 可能带来不确定性，所以类型检查时，就会需要增加检查不确定性：
//      一种是： 用if (file.status === undefined) {} 处理undefined的情况。
//      还有一种：if (file.status?.toString()) {} 用可选链处理有值的情况。 

import { z } from 'zod';

/** 基础实体接口，包含审计字段 */
export interface BaseEntity {
    id: string;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
    version: number;
  }
  
  /** 文件状态枚举 */
  export enum FileStatus {
    NOT = 'NONE',             // 不需要状态
    PENDING = 'PENDING',      // 待审核
    APPROVED = 'APPROVED',    // 已通过
    REJECTED = 'REJECTED'     // 已驳回
  }
  
  /** 文件类型枚举 */
  export enum FileType {
    PDF = 'PDF',
    WORD = 'WORD',
    EXCEL = 'EXCEL',
    IMAGE = 'IMAGE',
    OTHER = 'OTHER'
  }
  
  /** 文件可见性枚举 */
  export enum FileVisibility {
    NOT_APPLICABLE = 'NOT_APPLICABLE', // 不适用
    PUBLIC = 'PUBLIC',     // 公开
    PRIVATE = 'PRIVATE',   // 私有
    SHARED = 'SHARED'      // 共享
  }
  
  /** 文件记录接口 */
  export interface FileRecord extends BaseEntity {
    name: string;
    url?: string;  // 可选，一开始可能没有url
    size: number;
    type: FileType;
    mimeType?: string; //可选，MIME Type 是文件标准，PDF, WORD, JPEG, png, html等都是范畴
    status: FileStatus;
    visibility: FileVisibility;
    
    // 处理状态相关
    processingStatus: 'NONE'|'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    processingProgress?: number;  // 0-100
    errorMessage?: string;
    
    // 访问控制
    accessControl?: {
      readUserIds: string[];
      writeUserIds: string[];
      ownerUserId: string;
    };
    
    // 元数据
    metadata?: Record<string, unknown>;
    remarks?: string;
  }
  
  /** 文件与项目的关联关系 */
  export interface FileProjectLink extends BaseEntity {
    fileId: string;
    projectId: string;
    linkType: 'ATTACHMENT' | 'REFERENCE';
    sortOrder?: number;
    isDeleted: boolean;
  }
  
  /** 文件更新输入类型 */
  export type FileUpdateInput = Partial<Pick<FileRecord, 
    'name' | 
    'status' | 
    'visibility' | 
    'remarks' | 
    'metadata'
  >>;
  
  /** 验证schema（使用 Zod） */
  export const FileRecordSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
    size: z.number().positive(),
    type: z.nativeEnum(FileType),
    status: z.nativeEnum(FileStatus),
    visibility: z.nativeEnum(FileVisibility),
    // ... 其他字段的验证
  });
  
  // 类型推导
  export type ValidatedFileRecord = z.infer<typeof FileRecordSchema>;