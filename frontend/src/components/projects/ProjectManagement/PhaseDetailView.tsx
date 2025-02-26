import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import StatusBadge from './StatusBadge'
import { ProjectPhase, Task, TaskStatus, PhaseStatus } from './types'
import { Calendar, FileText, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

// Add a formatDate function
const formatDate = (date?: string) => {
  if (!date) return '未设置';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

interface PhaseDetailViewProps {
  phase: ProjectPhase
}

export const PhaseDetailView: React.FC<PhaseDetailViewProps> = ({ phase }) => {
  // Helper function to render status badge with appropriate color
  const renderStatusBadge = (status: PhaseStatus | TaskStatus) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    let label = '';
    
    // Handle both PhaseStatus and TaskStatus
    if (status === PhaseStatus.COMPLETED || status === TaskStatus.COMPLETED || status === TaskStatus.CONFIRMED) {
      variant = 'default'; // Green
      label = '已完成';
    } else if (status === PhaseStatus.IN_PROGRESS || status === TaskStatus.PROCESSING) {
      variant = 'secondary'; // Blue
      label = '进行中';
    } else if (status === PhaseStatus.BLOCKED || status === TaskStatus.BLOCKED || status === TaskStatus.FAILED) {
      variant = 'destructive'; // Red
      label = status === TaskStatus.FAILED ? '失败' : '阻塞中';
    } else {
      variant = 'outline'; // Gray
      label = '未开始';
    }
    
    return <StatusBadge status={status} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{phase.name}</h2>
        <div className="flex items-center gap-2">
          {renderStatusBadge(phase.status)}
          {phase.progress !== undefined && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
              {phase.progress}% 完成
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-6 text-sm text-gray-500">
        {phase.startDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>开始: {formatDate(phase.startDate)}</span>
          </div>
        )}
        {phase.endDate && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>结束: {formatDate(phase.endDate)}</span>
          </div>
        )}
      </div>
      
      <p className="text-gray-600">{phase.description}</p>
      
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">任务</TabsTrigger>
          <TabsTrigger value="documents">文档</TabsTrigger>
          <TabsTrigger value="details">详情</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">阶段任务</h3>
              <div className="text-sm text-gray-500">
                共 {phase.tasks.length} 个任务，
                {phase.tasks.filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CONFIRMED).length} 个已完成
              </div>
            </div>
            
            <Accordion type="multiple" className="border rounded-md divide-y">
              {phase.tasks.map((task: Task) => (
                <AccordionItem key={task.id} value={task.id} className="px-2">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-left font-medium">{task.name}</span>
                        {task.priority && (
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded",
                            task.priority === 'HIGH' ? "bg-red-100 text-red-800" :
                            task.priority === 'MEDIUM' ? "bg-yellow-100 text-yellow-800" :
                            "bg-green-100 text-green-800"
                          )}>
                            {task.priority === 'HIGH' ? '高' : task.priority === 'MEDIUM' ? '中' : '低'}优先级
                          </span>
                        )}
                        {task.aiAssisted && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            AI辅助
                          </span>
                        )}
                      </div>
                      {renderStatusBadge(task.status)}
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="pb-4">
                    <div className="space-y-4 pl-4">
                      {task.description && (
                        <p className="text-gray-600">{task.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-500">计划日期:</span>
                          <span>{task.date ? formatDate(task.date) : '未设置'}</span>
                        </div>
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-500">截止日期:</span>
                            <span>{formatDate(task.dueDate)}</span>
                          </div>
                        )}
                        
                        {task.progress !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">进度:</span>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                            <span>{task.progress}%</span>
                          </div>
                        )}
                      </div>
                      
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">附件</h4>
                          <ul className="space-y-1">
                            {task.attachments.map(file => (
                              <li key={file.id} className="flex items-center">
                                <a href={file.url} className="text-blue-600 hover:underline flex items-center text-sm">
                                  <FileText className="h-4 w-4 mr-2" />
                                  {file.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="pt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">阶段文档</h3>
            {phase.documents && phase.documents.length > 0 ? (
              <div className="border rounded-md p-4">
                <ul className="space-y-2">
                  {phase.documents.map(doc => (
                    <li key={doc.id} className="flex items-center">
                      <a href={doc.url} className="text-blue-600 hover:underline flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        {doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500">暂无文档</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="details" className="pt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">阶段详情</h3>
            {phase.remarks && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                <p className="text-amber-800 text-sm">{phase.remarks}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
