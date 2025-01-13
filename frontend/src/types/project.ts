export interface Project {
  id: string;
  // 基础信息
  name: string;           // 项目名称
  type: string;          // 项目类型
  companyName: string;   // 招标单位
  
  // 项目状态信息
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;     // ISO 日期字符串
  updatedAt: string;     // ISO 日期字符串
  
  // 项目流程
  processes: {
    current: number;
    steps: ProjectStep[];
  };
  
  documents: Document[];
  members: User[];
}

export interface ProjectStep {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  documents: Document[];
}

export interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
  // ... 其他文档相关字段
}

export interface User {
  id: string;
  name: string;
  role: string;
  // ... 其他用户相关字段
}
