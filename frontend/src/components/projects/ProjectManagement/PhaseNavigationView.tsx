import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Calendar, FileText, Clock } from 'lucide-react'
import { ProjectPhase, PhaseStatus, Task, TaskStatus } from './types'

interface PhaseNavigationViewProps {
  phase: ProjectPhase
}

// Add a formatDate function since it's not exported from utils
const formatDate = (date: string | Date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

export const PhaseNavigationView: React.FC<PhaseNavigationViewProps> = ({ phase }) => {
  // Helper function to render status badge
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
    
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{phase.name}</h2>
        {renderStatusBadge(phase.status)}
      </div>
      
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        {phase.startDate && (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>开始: {formatDate(phase.startDate)}</span>
          </div>
        )}
        {phase.endDate && (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>截止: {formatDate(phase.endDate)}</span>
          </div>
        )}
        {phase.progress !== undefined && (
          <div className="flex items-center">
            <span>进度: {phase.progress}%</span>
          </div>
        )}
      </div>
      
      <p className="text-gray-600">{phase.description}</p>
      
      {phase.remarks && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
          <p className="text-amber-800 text-sm">{phase.remarks}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 任务卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              任务
            </CardTitle>
          </CardHeader>
          <CardContent>
            {phase.tasks.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {phase.tasks.map((task: Task) => (
                  <AccordionItem key={task.id} value={task.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="text-left">{task.name}</span>
                        {renderStatusBadge(task.status)}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {task.description && (
                          <p className="text-sm text-gray-600">{task.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          {task.priority && (
                            <Badge variant="outline" className="bg-gray-100">
                              优先级: {
                                task.priority === 'HIGH' ? '高' : 
                                task.priority === 'MEDIUM' ? '中' : '低'
                              }
                            </Badge>
                          )}
                          
                          {task.dueDate && (
                            <Badge variant="outline" className="bg-gray-100">
                              截止日期: {formatDate(task.dueDate)}
                            </Badge>
                          )}
                          
                          {task.progress !== undefined && (
                            <Badge variant="outline" className="bg-gray-100">
                              进度: {task.progress}%
                            </Badge>
                          )}
                          
                          {task.isAutomatic && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              自动执行
                            </Badge>
                          )}
                          
                          {task.aiAssisted && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">
                              AI辅助
                            </Badge>
                          )}
                        </div>
                        
                        {task.inputDocuments && task.inputDocuments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium mb-1">输入文档:</p>
                            <ul className="text-xs space-y-1">
                              {task.inputDocuments.map(doc => (
                                <li key={doc.id} className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1 text-gray-500" />
                                  <a href={doc.url} className="text-blue-600 hover:underline">
                                    {doc.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {task.outputDocuments && task.outputDocuments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium mb-1">输出文档:</p>
                            <ul className="text-xs space-y-1">
                              {task.outputDocuments.map(doc => (
                                <li key={doc.id} className="flex items-center">
                                  <FileText className="h-3 w-3 mr-1 text-gray-500" />
                                  <a href={doc.url} className="text-blue-600 hover:underline">
                                    {doc.name}
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
            ) : (
              <p className="text-sm text-gray-500">暂无任务</p>
            )}
          </CardContent>
        </Card>
        
        {/* 文档卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              文档
            </CardTitle>
          </CardHeader>
          <CardContent>
            {phase.documents && phase.documents.length > 0 ? (
              <ul className="space-y-2">
                {phase.documents.map(doc => (
                  <li key={doc.id} className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <a href={doc.url} className="text-blue-600 hover:underline">
                      {doc.name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">暂无文档</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
