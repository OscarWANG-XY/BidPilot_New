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
  
  documents: Document[];
  members: User[];

  // 添加招标文件字段
  tenderFiles: TenderFile[];
}
//-------------------------------- 项目流程 --------------------------------
export interface ProjectStep {
  id: number;
  name: string;
  status: '立项' | '招标文件解读' | '投标文件编制' | '完成';
  documents: Document[];
}


//-------------------------------- 文档 --------------------------------
export interface TenderDocument {
  id: string;
  name: string;
  url: string;
  type: 'PDF' | 'WORD';
  // ... 其他文档相关字段
}

//-------------------------------- 成员 --------------------------------
export interface User {
  id: string;
  name: string;
  role: string;
  // ... 其他用户相关字段
}

// 添加招标文件接口
export interface TenderFile {
  id: string;
  fileName: string;
  fileUrl?: string;      // 可选，因为上传时可能还没有URL
  fileSize: number;
  uploadTime: string;
  fileType?: string;     // 可选
  status: '待审核' | '已通过' | '已驳回';
  uploadBy?: string;     // 可选
  remarks?: string;      // 可选
  projectId: string;     // 添加项目ID字段
}
