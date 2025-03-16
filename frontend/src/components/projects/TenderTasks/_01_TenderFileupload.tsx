import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Upload, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { FileManager } from '@/components/files/_FileManager'
import { useFiles } from '@/hooks/useFiles'
import { TaskStatus, TaskLockStatus } from '@/types/projects_dt_stru'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'


// Part1: 组件的props定义
interface TenderFileUploadProps {
  // 传入参数
  projectId: string
  initialStatus?: TaskStatus
  initialLockStatus?: TaskLockStatus
  isEnabled?: boolean                     // 添加isEnabled属性，与TaskA保持一致
  // 回调函数
  onStateChange?: (status: TaskStatus, lockStatus: TaskLockStatus) => void  // 状态数据回传
  onNavigateToNextTask?: () => void                                         // 回调进入下个任务的Tab
  //onStartNextTask?: () => void                            // 回调启动下个任务
}

export const TenderFileUpload: React.FC<TenderFileUploadProps> = ({ 
  // 传入参数
  projectId, 
  initialStatus,
  initialLockStatus,
  isEnabled = true, // 作为第一个任务，默认是true （以后再考虑是否加入到数据库的模型里。）
  // 回调函数
  onStateChange, 
  onNavigateToNextTask,
  //onStartNextTask
}) => {

  console.log("TenderFileUpload组件的初始化参数", {
    projectId,
    initialStatus,
    initialLockStatus,
    isEnabled,
  })

  // --------  Part2: 任务的状态管理
  const [status, setStatus] = useState<TaskStatus>(initialStatus || TaskStatus.PENDING)
  const [lockStatus, setLockStatus] = useState<TaskLockStatus>(initialLockStatus || TaskLockStatus.UNLOCKED)
  useEffect(() => {
    // if(onStatusChange) 检查onStatusChange是否存在(是否是undefined或null)，如果存在则执行onStatusChange(status) 
    if (onStateChange) {
      onStateChange(status, lockStatus)
    }
  }, [status, lockStatus, onStateChange])



  // 新增：文件加载状态
  const [isFilesLoading, setIsFilesLoading] = useState(true)    // 一开始默认文件在加载，等待FileManager加载结束触发回调，改变FilesLoading状态
  const { refetch: refreshFiles, files } = useFiles(projectId)  // 获取文件列表 (注意，加载完以后才会有值)
  const [fileManagerKey, setFileManagerKey] = useState(0);      //文件管理器的重置键

  const hasDocxFile = files.some(file => 
      file.name.toLowerCase().endsWith('.docx') || 
      file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )

  console.log("TenderFileUpload组件的文件加载状态", {
    isFilesLoading,
    files,
    hasDocxFile,
  })
  
  useEffect(() => {
    if (!isFilesLoading) {  // 只有在文件加载完成后才执行状态检查
      if (status === TaskStatus.COMPLETED && !hasDocxFile) {
        setStatus(TaskStatus.PENDING)
        setFileManagerKey(prev => prev + 1)
      }
    }
  }, [files, hasDocxFile, isFilesLoading]) 




  // 按钮加载状态
  const [isNavigating, setIsNavigating] = useState(false)

  

  // 处理文件上传的函数 - 返回一个布尔值表示是否应该继续上传
  const handleFileUpload = (file: File): boolean => {

    // 如果组件已锁定，阻止上传
    if (lockStatus === TaskLockStatus.LOCKED) {
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
  // 新增：处理文件加载状态变化
  const handleLoadingChange = (loading: boolean) => {
    console.log('Files loading state changed:', loading)
    setIsFilesLoading(loading)
  }
  // 处理上传成功的回调
  const handleUploadSuccess = async () => {
    console.log('File uploaded successfully, refreshing file list');
    try {
      // 先刷新文件列表
      await refreshFiles();
      
      // 添加一个短暂延迟，确保files数组已更新
      setTimeout(() => {
        console.log('Setting status to COMPLETED after file refresh');
        setStatus(TaskStatus.COMPLETED);
      }, 500);
    } catch (error) {
      console.error('Error refreshing files:', error);
      setStatus(TaskStatus.COMPLETED);
    }
  }
  // 重写文件删除处理函数，传递给FileManager
  const handleDeleteCheck = () => {
    if (lockStatus === TaskLockStatus.LOCKED) {
      toast({
        title: "操作被锁定",
        description: "任务已进入下一阶段，无法删除上传的文件",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };
  // 处理"下一步"按钮点击
  const handleNextTask = () => {

    console.log("'下一步'按钮被点击")

    if (!hasDocxFile) {
      toast({
        title: "请先上传文件",
        description: "需要先上传招标文件才能进入下一步",
        variant: "destructive"
      });
      return;
    }

    setIsNavigating(true);
    
    try {

      

      // 锁定组件，防止文件被删除或重新上传 (通过setLockStatus来实现,要比下面慢一步)
      setLockStatus(TaskLockStatus.LOCKED);
      console.log("组件被锁定, 锁定后的状态为", lockStatus)

      // 通知父组件启动下一个任务
      // if (onStartNextTask && lockStatus === TaskLockStatus.UNLOCKED && status === TaskStatus.COMPLETED) {
      //   onStartNextTask();
      //   console.log("触发onStartNextTask回调")
      // }
      
      toast({
        title: "任务已开始",
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

      // 如果出错，解锁组件
      setLockStatus(TaskLockStatus.UNLOCKED);

    } finally {
      setIsNavigating(false);
    }
  };



  // --------  Part4: 组件的UI渲染， 不像TaskA, TaskB那样使用{isEnable ?() :()} 
return (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="text-lg flex items-center">
        <Upload className="h-5 w-5 mr-2" />
        上传招标文件
        {lockStatus === TaskLockStatus.LOCKED && (
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
            {lockStatus === TaskLockStatus.LOCKED && <span className="text-amber-600 ml-1">任务已锁定，无法修改文件。</span>}
          </p>
          {hasDocxFile ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                {lockStatus === TaskLockStatus.LOCKED 
                    ? "文件已锁定。任务已进入下一阶段，无法修改文件。" 
                    : "已上传Word文档。如需更新，请先删除现有文档再上传新文档。"}
              </p>
            </div>
          ) : null}
          <FileManager 
            key={`file-manager-${fileManagerKey}`} // 使用动态key强制重置组件
            // 属性配置（传入）
            projectId={projectId} 
            acceptedFileTypes=".docx"
            allowMultiple={false}
            readOnly={lockStatus === TaskLockStatus.LOCKED}
            // 回调函数
            onFileUpload={handleFileUpload} 
            onUploadSuccess={handleUploadSuccess}
            onDeleteCheck={handleDeleteCheck}
            onLoadingChange={handleLoadingChange} // 新增：传递加载状态回调
          />
          {hasDocxFile && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleNextTask}
                disabled={isNavigating || status !== TaskStatus.COMPLETED}
              > 
                {lockStatus === TaskLockStatus.UNLOCKED? '启动招标文件分析' : '查看招标文件分析'}      
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
