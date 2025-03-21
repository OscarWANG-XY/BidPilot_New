import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Upload, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { FileManager } from '@/components/files/_FileManager'
import { useFiles } from '@/hooks/useFiles'
import { StageType } from '@/types/projects_dt_stru/projectStage_interface'
import { TaskStatus } from '@/types/projects_dt_stru/projectTasks_interface'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'
import { useProjectTasks } from '@/hooks/useProjects/useProjectTasks'


// Part1: 组件的props定义
interface TenderFileUploadProps {
  // 传入参数
  projectId: string
  isEnabled?: boolean                     // 添加isEnabled属性，与TaskA保持一致
  // 回调函数
  onStateChange?: (status: TaskStatus) => void  // 状态数据回传
  onNavigateToNextTask?: () => void             // 回调进入下个任务的Tab
}

export const TenderFileUpload: React.FC<TenderFileUploadProps> = ({ 
  // 传入参数
  projectId, 
  isEnabled = true, 
  // 回调函数
  onStateChange, 
  onNavigateToNextTask,
}) => {

  // 使用useProjectTasks获取和更新任务状态
  const { fileUploadTaskQuery, updateFileUploadTask } = useProjectTasks()

  // 查询任务状态（从API获取）
  const { data: taskData } = fileUploadTaskQuery(projectId, StageType.TENDER_ANALYSIS);

  // 本地状态管理（从API同步）- 默认为激活状态
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.ACTIVE)

  // 同步API数据到本地状态
  useEffect(() => {
    if (taskData) {
      setStatus(taskData.status);
    }
  }, [taskData]);

  // 向父组件回传状态变化
  useEffect(() => {
    if (onStateChange) {
      onStateChange(status)
    }
  }, [status, onStateChange])

  // 文件加载状态
  //const [isFilesLoading, setIsFilesLoading] = useState(true)
  const { refetch: refreshFiles, files } = useFiles(projectId)
  //const [fileManagerKey, setFileManagerKey] = useState(0);

  // 检查是否有且只有一个docx文件
  const docxFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.docx') || 
      file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
  const hasDocxFile = docxFiles.length > 0
  const hasExactlyOneDocxFile = docxFiles.length === 1
  
  // 按钮加载状态
  const [isNavigating, setIsNavigating] = useState(false)

  // 处理文件上传的函数 - 返回一个布尔值表示是否应该继续上传
  const handleFileUpload = (file: File): boolean => {
    // 如果任务已完成，阻止上传
    if (status === TaskStatus.COMPLETED) {
      toast({
        title: "操作被锁定",
        description: "任务已进入下一阶段，无法修改上传的文件",
        variant: "destructive"
      });
      return false;
    }

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
  
  // 处理文件加载状态变化
  const handleLoadingChange = (loading: boolean) => {
    console.log('Files loading state changed:', loading)
    //setIsFilesLoading(loading)
  }
  
  // 处理上传成功的回调
  const handleUploadSuccess = async () => {
    console.log('File uploaded successfully, refreshing file list');
    await refreshFiles();
  }
  
  // 文件删除处理函数
  const handleDeleteCheck = ():boolean => {
    if (status === TaskStatus.COMPLETED) {
      toast({
        title: "操作被锁定",
        description: "任务已进入下一阶段，无法删除上传的文件",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };
  
  // 处理"启动分析"按钮点击
  const handleNextTask = async () => {
    console.log("'启动分析'按钮被点击")

    if (!hasExactlyOneDocxFile) {
      toast({
        title: "文件要求",
        description: "需要上传且只能上传一个招标文件才能进入下一步",
        variant: "destructive"
      });
      return;
    }

    setIsNavigating(true);
    
    try {
      // 更新状态为完成
      setStatus(TaskStatus.COMPLETED);
      console.log("任务状态更新为完成")

      // 更新后端状态
      await updateFileUploadTask({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        status: TaskStatus.COMPLETED
      });
      
      toast({
        title: "任务已完成",
        description: "文档解析任务已开始处理",
        variant: "default"
      });
      
      // 导航到下一个任务页面
      if (onNavigateToNextTask) {
        onNavigateToNextTask();
      }
    } catch (error) {
      console.error('启动下一个任务失败:', error);
      toast({
        title: "操作失败",
        description: "无法启动下一个任务，请稍后重试",
        variant: "destructive"
      });

      // 如果出错，恢复状态
      setStatus(TaskStatus.ACTIVE);

    } finally {
      setIsNavigating(false);
    }
  };

  // 根据任务状态获取卡片样式
  const getCardStyleByStatus = () => {
    switch(status) {
      case TaskStatus.NOT_STARTED:
        return "border-gray-200";
      case TaskStatus.ACTIVE:
        return "border-blue-400 border-2 bg-blue-50";
      case TaskStatus.COMPLETED:
        return "border-green-400 border-2 bg-green-50";
      case TaskStatus.FAILED:
        return "border-red-400 border-2 bg-red-50";
      default:
        return "border-gray-200";
    }
  }

  // 判断是否文件操作被锁定
  const isFilesLocked = status === TaskStatus.COMPLETED;

  // --------  Part4: 组件的UI渲染
return (
  <Card className={`mb-6 ${getCardStyleByStatus()}`}>
    <CardHeader>
      <CardTitle className="text-lg flex items-center">
        <Upload className="h-5 w-5 mr-2" />
        上传招标文件
        {isFilesLocked && (
          <span title="此任务已锁定">
            <Lock className="h-4 w-4 ml-2 text-gray-500" />
          </span>
        )}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {isEnabled ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            请上传招标文件（仅支持.docx格式），系统将自动分析文件内容，为后续阶段提供支持。
            {isFilesLocked && <span className="text-amber-600 ml-1">任务已锁定，无法修改文件。</span>}
          </p>
          {hasDocxFile ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                {isFilesLocked 
                    ? "文件已锁定。任务已进入下一阶段，无法修改文件。" 
                    : "已上传Word文档。如需更新，请先删除现有文档再上传新文档。"}
              </p>
            </div>
          ) : null}

          <FileManager 
            //key={`file-manager-${fileManagerKey}`} // 使用动态key强制重置组件
            // 属性配置（传入）
            projectId={projectId} 
            acceptedFileTypes=".docx"
            allowMultiple={false}
            readOnly={isFilesLocked}
            // 回调函数
            onFileUpload={handleFileUpload} 
            onUploadSuccess={handleUploadSuccess}
            onDeleteCheck={handleDeleteCheck}
            onLoadingChange={handleLoadingChange} // 新增：传递加载状态回调
          />
          {!isFilesLocked && hasExactlyOneDocxFile && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleNextTask}
                disabled={isNavigating || isFilesLocked}
              > 
                确认上传     
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
