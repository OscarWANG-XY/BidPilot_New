import React, { useEffect, useRef } from 'react';
import { useProjectStages } from '@/_hooks/useProjects/useProjectStages';
import { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import { TaskStatus, TaskType } from '@/_types/projects_dt_stru/projectTasks_interface';
import { TaskContent } from './TaskComponentMap';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

// 状态对应的颜色和中文描述
const statusConfig: Record<TaskStatus, { color: string; label: string }> = {
  [TaskStatus.PROCESSING]: { color: 'bg-blue-100 text-blue-800', label: '处理中' },
  [TaskStatus.COMPLETED]: { color: 'bg-green-100 text-green-800', label: '已完成' },
  [TaskStatus.FAILED]: { color: 'bg-red-100 text-red-800', label: '失败' },
  [TaskStatus.NOT_STARTED]: { color: 'bg-gray-100 text-gray-800', label: '未开始' },
  [TaskStatus.CONFIGURING]: { color: 'bg-purple-100 text-purple-800', label: '配置中' },
  [TaskStatus.REVIEWING]: { color: 'bg-orange-100 text-orange-800', label: '审核中' }
};

// 任务顺序定义
const taskOrder = [
  TaskType.UPLOAD_TENDER_FILE,
  TaskType.DOCX_EXTRACTION_TASK,
  TaskType.OUTLINE_ANALYSIS_TASK
];

// 确定任务是否启用的函数
const determineTaskEnabled = (currentTask: any, allTasks: any[]) => {
  // 如果任务已失败或未开始，则禁用
  if (currentTask.status === TaskStatus.FAILED) {
    return false;
  }
  
  // 获取当前任务在顺序中的索引
  const currentTaskIndex = taskOrder.indexOf(currentTask.type);
  
  // 如果是第一个任务，则始终启用
  if (currentTaskIndex === 0) {
    return true;
  }
  
  // 如果不在预定义顺序中，则默认启用
  if (currentTaskIndex === -1) {
    return true;
  }
  
  // 获取前一个任务类型
  const previousTaskType = taskOrder[currentTaskIndex - 1];
  
  // 查找前一个任务
  const previousTask = allTasks.find(task => task.type === previousTaskType);
  
  // 如果找不到前一个任务，则启用当前任务
  if (!previousTask) {
    return true;
  }
  
  // 只有当前一个任务完成时，当前任务才启用
  return previousTask.status === TaskStatus.COMPLETED;
};


//=================== TenderAnalysisPage 主组件 ===============================

interface TenderAnalysisPageProps {
    projectId: string
  }

export const TenderAnalysisPage: React.FC<TenderAnalysisPageProps> = ({ projectId }) => {

  // 使用refs存储处理中的任务元素
  const processingTaskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // 添加状态来跟踪打开的手风琴项
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  // 从hook获取项目阶段数据
  const {stageData, isLoading, Error } = useProjectStages(projectId, StageType.TENDER_ANALYSIS)
  const tasksL1 = stageData?.tasksL1

  // 直接在渲染逻辑中计算 sortedTasks
  const sortedTasks = tasksL1?.sort((a, b) => {
    const indexA = taskOrder.indexOf(a.type);
    const indexB = taskOrder.indexOf(b.type);
    
    // 如果 a 不在 taskOrder 中，让它排在后面
    if (indexA === -1) return 1;
    // 如果 b 不在 taskOrder 中，让 a 排在前面
    if (indexB === -1) return -1;
    
    // 正常比较
    return indexA - indexB;
  });

  // 在数据加载完成后，设置默认打开的项并滚动到第一个已激活但尚未开始的任务
  useEffect(() => {
    if (stageData && sortedTasks && sortedTasks.length > 0) {
      // 找到所有已完成的任务和已激活的任务
      const completedTasks = sortedTasks.filter(task => task.status === TaskStatus.COMPLETED);
      const activeTasks = sortedTasks.filter(task => determineTaskEnabled(task, sortedTasks));
      
      // 合并已完成和已激活的任务ID，并去重
      const tasksToOpen = [...completedTasks, ...activeTasks]
        .map(task => task.id)
        .filter((id, index, self) => self.indexOf(id) === index);
      
      // 设置这些任务为默认打开状态
      setOpenItems(tasksToOpen);
      
      // 找到第一个已激活但尚未开始的任务
      const firstActivatedNotStartedTask = sortedTasks.find(task => 
        determineTaskEnabled(task, sortedTasks) && 
        task.status === TaskStatus.NOT_STARTED
      );
      
      // 如果找到了这样的任务，滚动到它
      if (firstActivatedNotStartedTask) {
        setTimeout(() => {
          processingTaskRefs.current[firstActivatedNotStartedTask.id]?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    }
  }, [stageData, sortedTasks]);


  
  // ================== 以下是UI组件渲染 ==================
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (Error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        获取任务列表失败，请稍后重试
      </div>
    );
  }

  if (!sortedTasks || sortedTasks.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
        暂无招标文件分析任务
      </div>
    );
  }

  return (
    <div className="
      container    /* 设置容器最大宽度（响应式断点） */
      mx-auto     /* 水平自动外边距实现居中 */
      py-6        /* 垂直方向内边距6个单位（1.5rem/24px） */
    ">
      <h1 className="
        text-2xl    /* 字体大小2xl（24px） */ 
        font-bold   /* 字体加粗 */
        mb-6        /* 底部外边距6个单位 */
      ">招标文件分析任务</h1>
      
      <div className="
        mb-4        /* 底部外边距4个单位 */
        bg-blue-50  /* 浅蓝色背景（50色调） */
        p-3         /* 内边距3个单位 */
        rounded-md  /* 中等圆角半径 */
        text-blue-800 /* 深蓝色文字 */
        text-sm     /* 小号字体（14px） */
      ">
        页面加载完成后将自动打开并滚动到"处理中"的任务
      </div>
      
      <Accordion 
        type="multiple" 
        value={openItems}
        onValueChange={(value) => setOpenItems(value as string[])}
        className="
          w-full    /* 宽度100%占满父容器 */
        "
      >
        {sortedTasks.map((task) => (
          <AccordionItem 
            key={task.id} 
            value={task.id}
            ref={element => {
              if (task.status === 'PROCESSING') {
                processingTaskRefs.current[task.id] = element;
              }
            }}
            className={`
              ${task.status === 'PROCESSING' ? 'border-l-4 border-blue-500' : ''}
              /* 处理中状态时添加4px蓝色左边框 */
            `}
          >
            <AccordionTrigger className="
              px-4       /* 水平内边距4个单位 */
              py-2       /* 垂直内边距2个单位 */
              hover:bg-gray-50  /* 悬停时浅灰色背景 */
            ">
              <div className="
                flex        /* flex布局 */
                items-center  /* 垂直居中对齐 */
                justify-between  /* 两端对齐 */
                w-full      /* 宽度100% */
              ">
                {/* 任务名称 */ }
                <div className="
                  font-medium  /* 中等字体粗细 */
                ">{task.name}</div>

                {/* 任务状态 */}
                <Badge className={`
                  ml-4       /* 左外边距4个单位 */
                  ${statusConfig[task.status]?.color || 'bg-gray-100 text-gray-800'}
                  /* 动态类名：优先使用状态配置中的颜色，默认灰色 */
                `}>
                  {statusConfig[task.status]?.label || '未知状态'}
                </Badge>
              </div>
            </AccordionTrigger>
            
            <AccordionContent className="
              px-4       /* 水平内边距4个单位 */
              py-3       /* 垂直内边距3个单位 */
              bg-gray-50 /* 浅灰色背景 */
            ">
                {/* 使用动态任务组件 */}
                <div className="mt-4 border-t pt-4">
                  <TaskContent 
                    task={task} 
                    projectId={projectId}
                    isEnabled={determineTaskEnabled(task, sortedTasks)}
                  />
                </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};


export default TenderAnalysisPage;