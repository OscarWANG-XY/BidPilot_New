import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { FileManager } from '@/components/files/_FileManager'
import { useFiles } from '@/hooks/useFiles'
import { TaskStatus } from '@/types/projects_dt_stru'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'


// Part1: 组件的props定义
interface TenderFileUploadProps {
  projectId: string
  onStatusChange?: (status: TaskStatus) => void //回调函数接收"status"作为参数进行回传
  initialStatus?: TaskStatus
  isEnabled?: boolean // 添加isEnabled属性，与TaskA保持一致
  onNavigateToNextTask?: () => void // 添加导航到下一个任务的回调函数
}

export const TenderFileUpload: React.FC<TenderFileUploadProps> = ({ 
  projectId, 
  onStatusChange, 
  initialStatus = TaskStatus.PENDING,
  isEnabled = true, // 默认为true，因为文件上传通常是第一个任务
  onNavigateToNextTask
}) => {


  // --------  Part2: 任务的状态管理
  // 添加了任务A的status状态管理, 用于向父组件传递状态，与后面的
  const [status, setStatus] = useState<TaskStatus>(initialStatus)
  // 不用像TaskA那样添加的loading状态管理，因为在FileManager组件中已经有了


  // 依赖项是status和onStatusChange。 
  // 两种情况会向父组件传递status的值，1）status发生变化，2）onStatusChange发生变化(即父组件的重新渲染)。 
  useEffect(() => {
    // if(onStatusChange) 检查onStatusChange是否存在(是否是undefined或null)，如果存在则执行onStatusChange(status) 
    if (onStatusChange) {
      onStatusChange(status)
    }
  }, [status])





  // --------  Part3: upload任务的数据处理 模块
  const { refecth: refreshFiles, files } = useFiles(projectId)

  // 检查是否已有docx文件
  const hasDocxFile = files.some(file => 
    file.name.toLowerCase().endsWith('.docx') || 
    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );


  // 处理文件上传的函数 - 返回一个布尔值表示是否应该继续上传
  const handleFileUpload = (file: File): boolean => {
    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.docx') && 
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      toast({
        title: "文件类型错误",
        description: "只允许上传Word文档(.docx)文件",
        variant: "destructive"
      });
      return false; // 阻止上传
    }
    
    // 检查是否已有docx文件
    if (hasDocxFile) {
      toast({
        title: "已存在文档",
        description: "项目已有Word文档，请先删除现有文档再上传新文档",
        variant: "destructive"
      });
      return false; // 阻止上传
    }
    
    console.log('File validation passed, proceeding with upload:', file);
    return true; // 允许上传
  }
  
  // 处理上传成功的回调
  const handleUploadSuccess = () => {
    console.log('File uploaded successfully, refreshing file list');
    refreshFiles();
    setStatus(TaskStatus.COMPLETED) // 更新的状态会通过之前的useEffect传递给父组件;
  }



  // --------  Part4: 组件的UI渲染， 不像TaskA, TaskB那样使用{isEnable ?() :()} 
return (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="text-lg flex items-center">
        <Upload className="h-5 w-5 mr-2" />
        上传招标文件
      </CardTitle>
    </CardHeader>
    <CardContent>
      {isEnabled ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            请上传招标文件（仅支持.docx格式），系统将自动分析文件内容，为后续阶段提供支持。
          </p>
          {hasDocxFile ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                已上传Word文档。如需更新，请先删除现有文档再上传新文档。
              </p>
            </div>
          ) : null}
          <FileManager 
            onFileUpload={handleFileUpload} 
            onUploadSuccess={handleUploadSuccess}
            projectId={projectId} 
            acceptedFileTypes=".docx"
            allowMultiple={false}
          />
          {hasDocxFile && (
            <div className="mt-6 flex justify-end">
              <Button onClick={onNavigateToNextTask}>       
                下一步：招标文件解析
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Alert variant="default">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>任务未激活</AlertTitle>
          <AlertDescription>
            请先完成前置任务
          </AlertDescription>
        </Alert>
      )}
    </CardContent>
  </Card>
)
}
