import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, ListTree, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StageType } from '@/types/projects_dt_stru/projectStage_interface'
import { TaskStatus, TaskLockStatus } from '@/types/projects_dt_stru/projectTasks_interface'
import { useOutlineAnalysis useOutlineAnalysisStream} from '@/hooks/useProjects/useTaskOutlineAnalysis'
import TiptapEditor_lite from '@/components/shared/TiptapEditor_lite'
import { toast } from '@/hooks/use-toast'

interface DocOutlineAnalysisTaskProps {
  projectId: string
  isEnabled: boolean
  onStatusChange?: (lockStatus: TaskLockStatus) => void
  onNavigateToNextTask?: () => void
}

export const DocOutlineAnalysisTask: React.FC<DocOutlineAnalysisTaskProps> = ({ 
  projectId, 
  isEnabled, 
  onStatusChange, 
  onNavigateToNextTask
}) => {



    
  // 使用API hooks获取和更新任务状态
  const { outlineAnalysisTaskQuery, pollOutlineAnalysisTask, updateOutlineAnalysisTask } = useOutlineAnalysis();
  const {
    streamId,
    streamContent,
    isStreaming,
    streamError,
    streamComplete,
    streamStatus,
    streamResult,
    startStream,
    stopStreaming,
    isStartingStream,
  } = useOutlineAnalysisStream(projectId, StageType.TENDER_ANALYSIS);

  // 查询任务状态（从API获取）
  const { data: taskData, isLoading: isTaskLoading, refetch: refetchTaskData } = 
    docOutlineAnalysisTaskQuery(projectId, StageType.TENDER_ANALYSIS, {
      refetchOnMount: true,   // 确保projectId变化时重新获取数据
    });

  // 轮询任务状态，用于实时更新分析进度
  const { data: pollTaskData, startPolling, stopPolling } = pollDocOutlineAnalysisTask(projectId, StageType.TENDER_ANALYSIS);

  // 本地状态管理
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.NOT_STARTED)
  const [lockStatus, setLockStatus] = useState<TaskLockStatus>(TaskLockStatus.UNLOCKED)
  const [editorContent, setEditorContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 当projectId变化时，重置组件状态
  useEffect(() => {
    console.log('🔄 [DocOutlineAnalysisTask] projectId变化，重置组件状态:', projectId);
    setStatus(TaskStatus.NOT_STARTED);
    setLockStatus(TaskLockStatus.UNLOCKED);
    setEditorContent('');
    setAnalysisProgress(0);
    setIsAnalyzing(false);
    
    // 强制重新获取数据
    refetchTaskData();
  }, [projectId, refetchTaskData]);

  // 同步API数据到本地状态
  useEffect(() => {
    if (taskData) {
      console.log('📥 [DocOutlineAnalysisTask] 更新本地状态:', taskData);
      setStatus(taskData.status);
      setLockStatus(taskData.lockStatus);
      
      // 检测是否正在分析中
      const isCurrentlyAnalyzing = taskData.status === TaskStatus.ACTIVE && !taskData.tiptapContent;
      setIsAnalyzing(isCurrentlyAnalyzing);
      
      // 如果状态是ACTIVE，确保轮询已启动
      if (taskData.status === TaskStatus.ACTIVE) {
        startPolling();
      }
      
      if (taskData.tiptapContent) {
        // 将tiptapContent转换为JSON字符串
        setEditorContent(JSON.stringify(taskData.tiptapContent));
        
        // 如果有内容且状态为COMPLETED，确保进度为100%
        if (taskData.status === TaskStatus.COMPLETED) {
          setAnalysisProgress(100);
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
      
      // 检测是否正在分析中
      const isCurrentlyAnalyzing = pollTaskData.status === TaskStatus.ACTIVE && !pollTaskData.tiptapContent;
      
      // 如果状态从ACTIVE变为COMPLETED，并且有内容，则更新编辑器内容
      if (pollTaskData.status === TaskStatus.COMPLETED && pollTaskData.tiptapContent) {
        setEditorContent(JSON.stringify(pollTaskData.tiptapContent));
        
        // 分析完成通知
        if (isAnalyzing) {
          toast({
            title: "文档结构分析完成",
            description: "招标文件结构已成功分析，可以开始编辑",
          });
          setIsAnalyzing(false);
          setAnalysisProgress(100); // 确保进度条显示100%
        }
      }
      
      // 更新分析状态
      if (isCurrentlyAnalyzing !== isAnalyzing) {
        setIsAnalyzing(isCurrentlyAnalyzing);
        
        // 如果开始分析，重置进度
        if (isCurrentlyAnalyzing) {
          setAnalysisProgress(5); // 开始时显示一点进度
        }
      }
    }
  }, [pollTaskData, isAnalyzing]);

  // 添加一个单独的效果来平滑更新进度条
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    if (isAnalyzing) {
      // 创建一个平滑的进度更新
      progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
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
      setAnalysisProgress(100);
    }
    
    // 清理函数
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isAnalyzing, status]);

  // 向父组件回传状态变化
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(lockStatus)
    }
  }, [lockStatus, onStatusChange])

  
  // 处理编辑器内容变化
  const handleEditorContentChange = (content: string) => {
    setEditorContent(content);
  }

  // 保存内容到后端
  const handleSaveContent = async () => {
    setLoading(true)
    try {
      await updateDocOutlineAnalysisTask({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        tiptapContent: JSON.parse(editorContent)
      })
      
      toast({
        title: "内容已保存",
        description: "文档结构分析内容已成功保存",
      })
    } catch (error) {
      console.error('保存内容时出错:', error)
      toast({
        title: "保存失败",
        description: "无法保存分析内容，请稍后重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 合并后的处理函数
  const handleCompleteAndNavigate = async () => {
    console.log('handleCompleteAndNavigate')
    setLoading(true);
    try {
      // 更新任务状态为完成并锁定任务
      await updateDocOutlineAnalysisTask({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        tiptapContent: JSON.parse(editorContent),
        status: TaskStatus.COMPLETED,
        lockStatus: TaskLockStatus.LOCKED,
      });

      // 更新本地状态
      setStatus(TaskStatus.COMPLETED);
      setLockStatus(TaskLockStatus.LOCKED);

      toast({
        title: "任务已完成并锁定",
        description: "正在进入下一个任务",
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

  // 手动启动文档结构分析
  const handleStartAnalysis = async () => {
    // 如果任务已完成，不应该重新启动分析
    if (status === TaskStatus.COMPLETED) {
      return;
    }
    
    setLoading(true);
    try {
      // 更新任务状态为激活，触发后端分析流程
      await updateDocOutlineAnalysisTask({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        status: TaskStatus.ACTIVE,
      });
      
      // 更新本地状态
      setStatus(TaskStatus.ACTIVE);
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      
      // 手动启动轮询
      startPolling();
      
      toast({
        title: "文档结构分析已启动",
        description: "系统正在分析招标文件结构，请稍候...",
      });
    } catch (error) {
      console.error('启动分析失败:', error);
      toast({
        title: "启动失败",
        description: "无法启动文档结构分析，请稍后重试",
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

  return (
    <Card className={`mb-4 ${getCardStyleByStatus()}`}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <ListTree className="h-5 w-5 mr-2" />
          招标文件结构分析
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
              分析招标文件结构，识别章节和关键部分 (项目ID: {projectId})
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
                {/* 显示分析进度 */}
                {isAnalyzing && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">正在分析文档结构...</span>
                      <span className="text-sm">{analysisProgress}%</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-2">
                      系统正在分析招标文件结构，识别章节和关键部分，请耐心等待。
                    </p>
                  </div>
                )}
                
                {/* 未开始状态或失败状态显示启动按钮 */}
                {(status === TaskStatus.NOT_STARTED || status === TaskStatus.FAILED) && !isAnalyzing && (
                  <div className="py-8 text-center">
                    <p className="mb-4 text-gray-600">
                      {status === TaskStatus.FAILED ? 
                        "文档结构分析失败，请重新尝试" : 
                        "文档结构尚未分析，点击下方按钮开始分析"}
                    </p>
                    <Button 
                      onClick={handleStartAnalysis}
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
                        status === TaskStatus.FAILED ? '重新分析文档结构' : '开始分析文档结构'
                      )}
                    </Button>
                  </div>
                )}
                
                {/* 编辑器区域 - 只在有内容或已完成时显示 */}
                {(editorContent || status === TaskStatus.COMPLETED) && !isAnalyzing && (
                  <>
                    <div className="border rounded-md mb-4">
                      <TiptapEditor_lite
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
              请先完成招标文件内容提取
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 