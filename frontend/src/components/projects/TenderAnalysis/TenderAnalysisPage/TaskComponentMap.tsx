// TaskComponentMap.tsx 将 组件都组织到一起，方便TenderAnalaysisPage根据数据映射调用相应组件。 


import React from 'react';
import { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface';
import { TaskList } from '@/_types/projects_dt_stru/projectStage_interface';
import { TenderFileUpload } from '@/components/projects/TenderAnalysis/TenderFileUpload/TenderFileupload';
import { DocxExtractionTask } from '@/components/projects/TenderAnalysis/DocxExtractionTask/DocxExtractionTask';
import TaskContainer from '@/components/Task/TaskContainer';


// 组件映射类型
type ComponentMap = {
  [key in TaskType]?: React.ComponentType<any>;
};

// 组件映射： [key in TaskType]？：React.ComponentType<any>;
const taskComponentMap: ComponentMap = {
  [TaskType.UPLOAD_TENDER_FILE]: TenderFileUpload,
  [TaskType.DOCX_EXTRACTION_TASK]: DocxExtractionTask,
  [TaskType.OUTLINE_ANALYSIS_TASK]: TaskContainer,
  // [TaskType.OTHER]: TaskContainer,
};


//======================== 主组件 ==========================
// TaskContent组件的属性接口
export interface TaskContentProps {
  task: TaskList;
  projectId: string;
  isEnabled: boolean;
  // 使用索引签名允许传递任何其他属性
  [key: string]: any;
}

// 通用任务内容组件
export const TaskContent: React.FC<TaskContentProps> = (props) => {
  // 结构赋值, 把需要的属性显性表达，其他打包在...restProps里。
  const { task, projectId, isEnabled, ...restProps } = props;

  // 获取组件
  const TaskComponent = taskComponentMap[task.type];
  
  // 检查组件是否存在
  if (!TaskComponent) {
    return <div className="text-gray-500">未知任务类型: {task.type}</div>;
  }
  
  // 将task组件和其所需属性 作为完成的组件输出， 传递给需要调用的组件
  return <TaskComponent 
    task={task}
    projectId={projectId}
    isEnabled = {isEnabled}
    {...restProps} />;
};