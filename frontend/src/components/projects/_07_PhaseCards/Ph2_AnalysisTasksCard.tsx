import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText } from 'lucide-react'
import { Task, TaskStatus, PhaseStatus } from '../types'

interface AnalysisTasksCardProps {
  tasks: Task[];
  formatDate: (date: string | Date) => string;
}

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

export const AnalysisTasksCard: React.FC<AnalysisTasksCardProps> = ({ tasks, formatDate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          任务
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {tasks.map((task: Task) => (
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
  );
};
