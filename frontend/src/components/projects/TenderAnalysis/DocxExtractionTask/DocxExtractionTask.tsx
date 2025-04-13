import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, FileText, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StageType } from '@/_types/projects_dt_stru/projectStage_interface'
import { TaskStatus, TaskLockStatus } from '@/_types/projects_dt_stru/projectTasks_interface'
import { useDocxExtraction } from './useTaskDocxExtraction'
//import TiptapEditor_lite from '@/components/shared/TiptapEditor_lite'
import TiptapEditor from '@/components/TiptapEditor/TiptapEditor'
import { toast } from '@/_hooks/use-toast'

interface DocxExtractionTaskProps {
  projectId: string
  isEnabled: boolean
  onStatusChange?: (lockStatus: TaskLockStatus) => void
  onNavigateToNextTask?: () => void
}

export const DocxExtractionTask: React.FC<DocxExtractionTaskProps> = ({ 
  projectId, 
  isEnabled, 
  onStatusChange, 
  onNavigateToNextTask
}) => {


  // 使用API hooks获取和更新任务状态
  const { DocxExtractionQuery, DocxExtractionUpdate } = useDocxExtraction()

  // 查询任务状态（从API获取）
  const { data: taskData, isLoading: isTaskLoading, refetch: refetchTaskData } = 
    DocxExtractionQuery(projectId, StageType.TENDER_ANALYSIS, {
      refetchOnMount: true,   // 确保projectId变化时重新获取数据
    });

  // 轮询任务状态，用于实时更新提取进度
  const { data: pollTaskData, startPolling, stopPolling } = DocxExtractionQuery(projectId, StageType.TENDER_ANALYSIS);

  // 本地状态管理
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.NOT_STARTED)
  const [lockStatus, setLockStatus] = useState<TaskLockStatus>(TaskLockStatus.UNLOCKED)
  const [editorContent, setEditorContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [isExtracting, setIsExtracting] = useState(false)

  // 当projectId变化时，重置组件状态
  useEffect(() => {
    console.log('🔄 [DocxExtractionTask] projectId变化，重置组件状态:', projectId);
    setStatus(TaskStatus.NOT_STARTED);
    setLockStatus(TaskLockStatus.UNLOCKED);
    setEditorContent('');
    setExtractionProgress(0);
    setIsExtracting(false);
    
    // 强制重新获取数据
    refetchTaskData();
  }, [projectId, refetchTaskData]);

  // 同步API数据到本地状态
  useEffect(() => {
    if (taskData) {
      console.log('📥 [DocxExtractionTask] 更新本地状态:', taskData);
      setStatus(taskData.status);
      setLockStatus(taskData.lockStatus);
      
      // 检测是否正在提取中
      const isCurrentlyExtracting = taskData.status === TaskStatus.PROCESSING && !taskData.docxTiptap;
      setIsExtracting(isCurrentlyExtracting);
      
      // 如果状态是ACTIVE，确保轮询已启动
      if (taskData.status === TaskStatus.PROCESSING) {
        startPolling();
      }
      
      if (taskData.docxTiptap) {
        // 将tiptapContent转换为JSON字符串
        setEditorContent(taskData.docxTiptap);
        
        // 如果有内容且状态为COMPLETED，确保进度为100%
        if (taskData.status === TaskStatus.COMPLETED) {
          setExtractionProgress(100);
        }
      }
    }
  }, [taskData, startPolling]);

  // 处理轮询数据更新
  useEffect(() => {
    if (pollTaskData) {
      // 更新任务状态
      setStatus(pollTaskData.status);
      setLockStatus(pollTaskData.lockStatus);
      
      // 检测是否正在提取中
      const isCurrentlyExtracting = pollTaskData.status === TaskStatus.PROCESSING && !pollTaskData.docxTiptap;
      
      // 如果状态从ACTIVE变为COMPLETED，并且有内容，则更新编辑器内容
      if (pollTaskData.status === TaskStatus.COMPLETED && pollTaskData.docxTiptap) {
        setEditorContent(pollTaskData.docxTiptap);
        
        // 提取完成通知
        if (isExtracting) {
          toast({
            title: "文档提取完成",
            description: "招标文件内容已成功提取，可以开始编辑",
          });
          setIsExtracting(false);
          setExtractionProgress(100); // 确保进度条显示100%
        }
      }
      
      // 更新提取状态
      if (isCurrentlyExtracting !== isExtracting) {
        setIsExtracting(isCurrentlyExtracting);
        
        // 如果开始提取，重置进度
        if (isCurrentlyExtracting) {
          setExtractionProgress(5); // 开始时显示一点进度
        }
      }
    }
  }, [pollTaskData, isExtracting]);

  // 添加一个单独的效果来平滑更新进度条
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    if (isExtracting) {
      // 创建一个平滑的进度更新
      progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          // 如果进度小于95%，则缓慢增加
          if (prev < 95) {
            // 进度越高，增加越慢
            const increment = Math.max(0.5, 5 * (1 - prev / 100));
            return Math.min(95, prev + increment);
          }
          return prev;
        });
      }, 1000); // 每秒更新一次
    } else if (status === TaskStatus.COMPLETED) {
      // 如果任务完成，确保进度为100%
      setExtractionProgress(100);
    }
    
    // 清理函数
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isExtracting, status]);

  // 向父组件回传状态变化
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(lockStatus)
    }
  }, [lockStatus, onStatusChange])


  // 手动启动文档提取 （将状态设置为PROCESSING，并更新到后端, 内容status）
  const handleStartExtraction = async () => {
    // 如果任务已完成，不应该重新启动提取
    if (status === TaskStatus.COMPLETED) {
      return;
    }
    
    setLoading(true);
    try {
      // 更新任务状态为激活，触发后端提取流程
      await DocxExtractionUpdate({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        status: TaskStatus.PROCESSING,
      });
      
      // 更新本地状态
      setStatus(TaskStatus.PROCESSING);
      setIsExtracting(true);
      setExtractionProgress(0);
      
      // 手动启动轮询
      startPolling();
      
      toast({
        title: "文档提取已启动",
        description: "系统正在提取招标文件内容，请稍候...",
      });
    } catch (error) {
      console.error('启动提取失败:', error);
      toast({
        title: "启动失败",
        description: "无法启动文档提取，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 处理编辑器内容变化 (将内容设置到本地状态, 不连接后端)
  const handleEditorContentChange = (content: any) => {
    setEditorContent(content);
  }

  // 保存内容到后端 （将内容docxTiptap更新到后端）
  const handleSaveContent = async () => {
    setLoading(true)
    try {
      await DocxExtractionUpdate({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        docxTiptap: editorContent  //与上面加载的tiptapContent的JSON.stringify正好相反
      })
      
      toast({
        title: "内容已保存",
        description: "招标文件解析内容已成功保存",
      })
    } catch (error) {
      console.error('保存内容时出错:', error)
      toast({
        title: "保存失败",
        description: "无法保存解析内容，请稍后重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 合并后的处理函数 (将状态设置为Completed，并更新到后端, 内容：docxTiptap, status, lockStatus）
  const handleCompleteAndNavigate = async () => {
    console.log('handleCompleteAndNavigate')
    setLoading(true);
    try {
      // 更新任务状态为完成并锁定任务
      await DocxExtractionUpdate({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        docxTiptap: editorContent,
        status: TaskStatus.COMPLETED,
        lockStatus: TaskLockStatus.LOCKED,
      });

      // 更新本地状态
      setStatus(TaskStatus.COMPLETED);
      setLockStatus(TaskLockStatus.LOCKED);

      toast({
        title: "任务已完成并锁定",
        description: "正在进入文档结构分析任务",
      });

      // 回调父组件进行导航
      if (onNavigateToNextTask) {
        onNavigateToNextTask();
      }
    } catch (error) {
      console.error('操作失败:', error);
      toast({
        title: "操作失败",
        description: "无法完成任务并导航，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  // 在组件卸载时停止轮询
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // =========================== 渲染 ========================================  

  // 根据任务状态获取卡片样式
  const getCardStyleByStatus = () => {
    switch(status) {
      case TaskStatus.NOT_STARTED:
        return "border-gray-200";
      case TaskStatus.PROCESSING:
        return "border-blue-400 border-2 bg-blue-50";
      case TaskStatus.COMPLETED:
        return "border-green-400 border-2 bg-green-50";
      case TaskStatus.FAILED:
        return "border-red-400 border-2 bg-red-50";
      default:
        return "border-gray-200";
    }
  }

  return (
    <Card className={`mb-4 ${getCardStyleByStatus()}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <FileText className="h-5 w-5 mr-2" />
          招标文件内容提取
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
              提取招标文件内容，提取关键信息和要求 (项目ID: {projectId})
              {lockStatus === TaskLockStatus.LOCKED && (
                <span className="text-amber-600 ml-1">任务已锁定，无法修改内容。</span>
              )}
            </p>
            
            {isTaskLoading ? (
              <div className="py-4 text-center">
                <p>加载中...</p>
              </div>
            ) : (
              <>
                {/* 显示提取进度 */}
                {isExtracting && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">正在提取文档内容...</span>
                      <span className="text-sm">{extractionProgress}%</span>
                    </div>
                    <Progress value={extractionProgress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-2">
                      系统正在分析招标文件，请耐心等待。这可能需要几分钟时间。
                    </p>
                  </div>
                )}
                
                {/* 未开始状态或失败状态显示启动按钮 */}
                {(status === TaskStatus.NOT_STARTED || status === TaskStatus.FAILED) && !isExtracting && (
                  <div className="py-8 text-center">
                    <p className="mb-4 text-gray-600">
                      {status === TaskStatus.FAILED ? 
                        "文档提取失败，请重新尝试" : 
                        "文档内容尚未提取，点击下方按钮开始提取"}
                    </p>
                    <Button 
                      onClick={handleStartExtraction}
                      disabled={loading}
                      className="mx-auto"
                      variant={status === TaskStatus.FAILED ? "destructive" : "default"}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          处理中...
                        </>
                      ) : (
                        status === TaskStatus.FAILED ? '重新提取文档内容' : '开始提取文档内容'
                      )}
                    </Button>
                  </div>
                )}
                
                {/* 编辑器区域 - 只在有内容或已完成时显示 */}
                {(editorContent || status === TaskStatus.COMPLETED) && !isExtracting && (
                  <>
                    <div className="border rounded-md mb-4">
                      <TiptapEditor
                        initialContent={editorContent}
                        onChange={handleEditorContentChange}
                        maxHeight={500}
                        showToc={true}
                        readOnly={lockStatus === TaskLockStatus.LOCKED}
                      />
                    </div>
                    
                    {/* 编辑器的保存按钮组 */}
                    <div className="mt-6 flex justify-between">
                      {lockStatus === TaskLockStatus.UNLOCKED && (
                        <div>
                          <Button
                            variant="outline"
                            onClick={handleSaveContent}
                            disabled={loading}
                          >
                            保存内容
                          </Button>
                        </div>
                      )}
                      
                      <div className="space-x-3">
                        {status !== TaskStatus.COMPLETED && lockStatus === TaskLockStatus.UNLOCKED && (
                          <Button
                            onClick={handleCompleteAndNavigate}
                            disabled={loading}
                          >
                            {loading ? '处理中...' : '完成并进入下一步'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <Alert variant="default">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>任务未激活</AlertTitle>
            <AlertDescription>
              请先完成招标文件上传
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}