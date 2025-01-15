import { FileRecord } from './files_dt_stru';

export interface User {
  id: string;
  name: string;
  role: string;
  // ... 其他用户相关字段
}

export interface ProjectStep {
  id: number;
  name: string;
  status: '立项' | '招标文件解读' | '投标文件编制' | '完成';
  documents: FileRecord[];
}

export interface Project {
  id: string;
  // 基础信息
  name: string;           // 项目名称
  type: '福利礼品' | '食材配送' |"";          // 项目类型
  companyName: string;   // 招标单位

  // 项目状态信息
  status: '未开始' | '进行中' | '已完成';
  createdAt: string;     // ISO 日期字符串
  updatedAt: string;     // ISO 日期字符串
  
  // 项目流程
  processes: {
    current: number;
    steps: ProjectStep[];
  };
  
  documents: FileRecord[];
} 
