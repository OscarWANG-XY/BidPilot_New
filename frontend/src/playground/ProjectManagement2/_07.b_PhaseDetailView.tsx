import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import StatusBadge from '../../components/projects/_06.2_StatusBadge'
//import { ProjectPhase, Task, TaskStatus, PhaseStatus } from '../../types/projects_stages_dt_stru'
import { ProjectStage, Task, TaskStatus, StageStatus } from '@/types/projects_dt_stru'
import { Calendar, FileText, Clock, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StageType } from '@/types/projects_dt_stru'
import { FileUploadButton } from '@/components/files/FileUploadButton'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Add a formatDate function
const formatDate = (date?: string) => {
  if (!date) return '未设置';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

interface PhaseDetailViewProps {
  phase: ProjectStage
}

export const PhaseDetailView: React.FC<PhaseDetailViewProps> = ({ phase }) => {
  // 添加上传状态管理
  const [isUploading, setIsUploading] = useState(false);
  
  // Helper function to render status badge with appropriate color
  const renderStatusBadge = (status: StageStatus | TaskStatus) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    let label = '';
    
    // Handle both PhaseStatus and TaskStatus
    if (status === StageStatus.COMPLETED || status === TaskStatus.COMPLETED || status === TaskStatus.CONFIRMED) {
      variant = 'default'; // Green
      label = '已完成';
    } else if (status === StageStatus.IN_PROGRESS || status === TaskStatus.PROCESSING) {
      variant = 'secondary'; // Blue
      label = '进行中';
    } else if (status === StageStatus.BLOCKED || status === TaskStatus.BLOCKED || status === TaskStatus.FAILED) {
      variant = 'destructive'; // Red
      label = status === TaskStatus.FAILED ? '失败' : '阻塞中';
    } else {
      variant = 'outline'; // Gray
      label = '未开始';
    }
    
    return <StatusBadge status={status} />;
  };

  // 处理文件上传的函数
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // 这里可以添加实际的文件上传逻辑
      console.log('Uploading file:', file.name);
      
      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 上传成功提示
      toast({
        title: "文件上传成功",
        description: `${file.name} 已成功上传`,
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "上传失败",
        description: "文件上传过程中发生错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 渲染阶段特定组件
  const renderPhaseSpecificComponents = () => {
    switch (phase.stage) {
      case StageType.INITIALIZATION:
        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                上传招标文件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                请上传招标文件，系统将自动分析文件内容，为后续阶段提供支持。
              </p>
              <FileUploadButton 
                onFileSelect={handleFileUpload} 
                isUploading={isUploading} 
              />
            </CardContent>
          </Card>
        );
      case StageType.TENDER_ANALYSIS:
        return (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                招标文件结构
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                系统已分析招标文件结构，您可以查看详细的章节内容。
              </p>
              {/* 这里可以添加招标文件结构的展示组件 */}
              <div className="text-sm text-gray-500">
                招标文件结构展示组件将在这里显示
              </div>
            </CardContent>
          </Card>
        );
      // 可以继续添加其他阶段的特定组件
      default:
        return null;
    }
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
      
      {/* 渲染阶段特定组件 */}
      {renderPhaseSpecificComponents()}
      
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
