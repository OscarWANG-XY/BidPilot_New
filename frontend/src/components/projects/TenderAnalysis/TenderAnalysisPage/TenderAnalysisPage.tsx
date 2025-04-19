import React, { useEffect, useRef } from 'react';
import { useProjectStages } from '@/_hooks/useProjects/useProjectStages';
import { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import { TaskStatus} from '@/_types/projects_dt_stru/projectTasks_interface';
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



interface TenderAnalysisPageProps {
    projectId: string
  }


export const TenderAnalysisPage: React.FC<TenderAnalysisPageProps> = ({ projectId }) => {
  // 使用refs存储处理中的任务元素
  const processingTaskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  

    const {stageData, isLoading, Error } = useProjectStages(projectId, StageType.TENDER_ANALYSIS)
    const tasksL1 = stageData?.tasksL1




  // 在数据加载完成后，滚动到第一个处理中的任务
  useEffect(() => {
    if (stageData && tasksL1 && tasksL1.length > 0) {
      // 找到第一个状态为processing的任务
      const processingTask = tasksL1.find(task => task.status === TaskStatus.PROCESSING);
      
      if (processingTask && processingTaskRefs.current[processingTask.id]) {
        // 使用setTimeout确保DOM完全渲染后再滚动
        setTimeout(() => {
          processingTaskRefs.current[processingTask.id]?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
        }, 300);
      }
    }
  }, [stageData]);



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

  if (!tasksL1 || tasksL1.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md text-gray-500 text-center">
        暂无招标文件分析任务
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">招标文件分析任务</h1>
      
      <div className="mb-4 bg-blue-50 p-3 rounded-md text-blue-800 text-sm">
        页面加载完成后将自动滚动到第一个"处理中"的任务
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {tasksL1.map((task) => (
          <AccordionItem 
            key={task.id} 
            value={task.id}
            ref={element => {
              // 只保存处理中的任务的引用
              if (task.status === 'PROCESSING') {
                processingTaskRefs.current[task.id] = element;
              }
            }}
            className={task.status === 'PROCESSING' ? 'border-l-4 border-blue-500' : ''}
          >
            <AccordionTrigger className="px-4 py-2 hover:bg-gray-50">
              <div className="flex items-center justify-between w-full">
                <div className="font-medium">{task.name}</div>
                <Badge className={`ml-4 ${statusConfig[task.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {statusConfig[task.status]?.label || '未知状态'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 bg-gray-50">
              <div className="space-y-3">
                <div>
                  <span className="font-semibold">任务ID：</span>
                  <span className="font-mono text-sm">{task.id}</span>
                </div>
                <div>
                  <span className="font-semibold">任务名称：</span>
                  <span>{task.name}</span>
                </div>
                <div>
                  <span className="font-semibold">任务状态：</span>
                  <Badge className={statusConfig[task.status]?.color || 'bg-gray-100 text-gray-800'}>
                    {statusConfig[task.status]?.label || '未知状态'}
                  </Badge>
                </div>
                {/* 这里可以根据需要添加更多任务详情 */}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};


export default TenderAnalysisPage;