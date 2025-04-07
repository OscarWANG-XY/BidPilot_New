import React, { useEffect, useReducer, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, FileText, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StageType } from '@/types/projects_dt_stru/projectStage_interface'
import { TaskStatus, TaskLockStatus } from '@/types/projects_dt_stru/projectTasks_interface'
import { useDocxExtraction } from '@/components/projects/TenderAnalysis/Task_components/useTaskDocxExtraction'
import { pollDocxExtractionTask } from '@/components/projects/TenderAnalysis/Task_components/useTaskDocxExtraction'
import TiptapEditor_lite from '@/components/shared/TiptapEditor_lite'
import { toast } from '@/hooks/use-toast'




// ----------------------- 定义 Task Reducer ----------------------
// 定义状态接口
interface TaskState {
  status: TaskStatus
  lockStatus: TaskLockStatus
  editorContent: string
  loading: boolean
  extractionProgress: number
  isExtracting: boolean
}

// 定义 action 类型
type TaskAction =
  | { type: 'RESET' }
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'UPDATE_FROM_TASK_DATA', payload: any }
  | { type: 'UPDATE_FROM_POLL_DATA', payload: any }
  | { type: 'UPDATE_EDITOR_CONTENT', payload: string }
  | { type: 'SET_EXTRACTION_PROGRESS', payload: number }
  | { type: 'START_EXTRACTION' }
  | { type: 'COMPLETE_EXTRACTION' }
  | { type: 'SET_TASK_COMPLETED_AND_LOCKED' }

// 初始状态
const initialState: TaskState = {
  status: TaskStatus.NOT_STARTED,
  lockStatus: TaskLockStatus.UNLOCKED,
  editorContent: '',
  loading: false,
  extractionProgress: 0,
  isExtracting: false
}

// Reducer 函数
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'RESET':
      return initialState

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'UPDATE_FROM_TASK_DATA': {
      const taskData = action.payload
      if (!taskData) return state

      const isCurrentlyExtracting = taskData.status === TaskStatus.ACTIVE && !taskData.docxTiptap
      const newEditorContent = taskData.docxTiptap 
        ? JSON.stringify(taskData.docxTiptap) 
        : state.editorContent

      return {
        ...state,
        status: taskData.status,
        lockStatus: taskData.lockStatus,
        isExtracting: isCurrentlyExtracting,
        editorContent: newEditorContent,
        extractionProgress: taskData.status === TaskStatus.COMPLETED ? 100 : state.extractionProgress
      }
    }

    case 'UPDATE_FROM_POLL_DATA': {
      const pollData = action.payload
      if (!pollData) return state

      const isCurrentlyExtracting = pollData.status === TaskStatus.ACTIVE && !pollData.docxTiptap
      const newEditorContent = pollData.docxTiptap && pollData.status === TaskStatus.COMPLETED
        ? JSON.stringify(pollData.docxTiptap)
        : state.editorContent

      // 检查是否刚完成提取
      const justCompleted = state.isExtracting && 
                           pollData.status === TaskStatus.COMPLETED && 
                           pollData.docxTiptap

      return {
        ...state,
        status: pollData.status,
        lockStatus: pollData.lockStatus,
        isExtracting: isCurrentlyExtracting,
        editorContent: newEditorContent,
        extractionProgress: justCompleted ? 100 : state.extractionProgress
      }
    }

    case 'UPDATE_EDITOR_CONTENT':
      return {
        ...state,
        editorContent: action.payload
      }

    case 'SET_EXTRACTION_PROGRESS':
      return {
        ...state,
        extractionProgress: action.payload
      }

    case 'START_EXTRACTION':
      return {
        ...state,
        status: TaskStatus.ACTIVE,
        isExtracting: true,
        extractionProgress: 0
      }

    case 'COMPLETE_EXTRACTION':
      return {
        ...state,
        isExtracting: false,
        extractionProgress: 100
      }

    case 'SET_TASK_COMPLETED_AND_LOCKED':
      return {
        ...state,
        status: TaskStatus.COMPLETED,
        lockStatus: TaskLockStatus.LOCKED,
        loading: false
      }

    default:
      return state
  }
}


// ==================== 主组件 props + 函数 ====================
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


  // // 本地状态管理
  // const [status, setStatus] = useState<TaskStatus>(TaskStatus.NOT_STARTED)
  // const [lockStatus, setLockStatus] = useState<TaskLockStatus>(TaskLockStatus.UNLOCKED)
  // const [editorContent, setEditorContent] = useState<string>('')
  // const [loading, setLoading] = useState(false)
  // const [extractionProgress, setExtractionProgress] = useState(0)
  // const [isExtracting, setIsExtracting] = useState(false)
  const [state, dispatch] = useReducer(taskReducer, initialState)
  const { 
    status, 
    lockStatus, 
    editorContent, 
    loading, 
    extractionProgress, 
    isExtracting 
  } = state


  // 使用API hooks获取和更新任务状态
  const { docxExtractionTaskQuery,  updateDocxExtractionTask } = useDocxExtraction()

  // 查询任务状态（从API获取）
  const { data: taskData, isLoading: isTaskLoading, refetch: refetchTaskData } = 
    docxExtractionTaskQuery(projectId, StageType.TENDER_ANALYSIS, {
      refetchOnMount: true,   //这个设定确保了 组件挂载时会重新获取数据。 
    });

  // 轮询任务状态，用于实时更新提取进度  
  // 这里没有设定refectchOnMount，用与手动控制轮询，而不是组件挂载时获取数据，和上面的逻辑不同。 
  const { data: pollTaskData, startPolling, stopPolling } = 
  pollDocxExtractionTask(projectId, StageType.TENDER_ANALYSIS);


 


  // 当projectId变化时，重置组件状态
  useEffect(()=>{
    console.log('🔄 [DocxExtractionTask] projectId变化，重置组件状态:', projectId);
    dispatch({type:'RESET'});
  },[projectId]);

  useEffect(() => {
    // 强制重新获取数据
    refetchTaskData();
  }, [projectId, refetchTaskData]);

  // 同步API数据到本地状态
  useEffect(() => {
    if (taskData) {
      console.log('📥 [DocxExtractionTask] 更新本地状态:', taskData);
      dispatch({type:'UPDATE_FROM_TASK_DATA', payload: taskData})
      
      // 如果状态是ACTIVE，确保轮询已启动
      if (taskData.status === TaskStatus.ACTIVE) {
        startPolling();
      }
    }  
  }, [taskData, startPolling]);


  // 处理轮询数据更新
  useEffect(() => {
    if (pollTaskData) {
      dispatch({ type: 'UPDATE_FROM_POLL_DATA', payload: pollTaskData })
      
      // 如果状态从ACTIVE变为COMPLETED，并且有内容，则提示用户
      if (pollTaskData.status === TaskStatus.COMPLETED && 
          pollTaskData.docxTiptap && 
          isExtracting) {
        toast({
          title: "文档提取完成",
          description: "招标文件内容已成功提取，可以开始编辑",
        })
        dispatch({ type: 'COMPLETE_EXTRACTION' })
      }
    }
  }, [pollTaskData, isExtracting])



  // 添加一个单独的效果来平滑更新进度条
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null
    
    if (isExtracting) {
      // 创建一个平滑的进度更新
      progressInterval = setInterval(() => {
        dispatch({ 
          type: 'SET_EXTRACTION_PROGRESS', 
          payload: Math.min(95, extractionProgress + Math.max(0.5, 5 * (1 - extractionProgress / 100)))
        })
      }, 1000) // 每秒更新一次
    } else if (status === TaskStatus.COMPLETED) {
      // 如果任务完成，确保进度为100%
      dispatch({ type: 'SET_EXTRACTION_PROGRESS', payload: 100 })
    }
    
    // 清理函数
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [isExtracting, status, extractionProgress])



  // 向父组件回传状态变化
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(lockStatus)
    }
  }, [lockStatus, onStatusChange])

  // 在组件卸载时停止轮询
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])


  // 处理编辑器内容变化 - 使用 useCallback 优化
  const handleEditorContentChange = useCallback((content: string) => {
    dispatch({ type: 'UPDATE_EDITOR_CONTENT', payload: content })
  }, [])

  // 保存内容到后端 - 使用 useCallback 优化
  const handleSaveContent = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      await updateDocxExtractionTask({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        docxTiptap: JSON.parse(editorContent)
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
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [projectId, editorContent, updateDocxExtractionTask])


// 合并后的处理函数 - 使用 useCallback 优化
  const handleCompleteAndNavigate = useCallback(async () => {
    console.log('handleCompleteAndNavigate')
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // 更新任务状态为完成并锁定任务
      await updateDocxExtractionTask({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        docxTiptap: JSON.parse(editorContent),
        status: TaskStatus.COMPLETED,
        lockStatus: TaskLockStatus.LOCKED,
      })

      // 更新本地状态
      dispatch({ type: 'SET_TASK_COMPLETED_AND_LOCKED' })

      toast({
        title: "任务已完成并锁定",
        description: "正在进入文档结构分析任务",
      })

      // 回调父组件进行导航
      if (onNavigateToNextTask) {
        onNavigateToNextTask()
      }
    } catch (error) {
      console.error('操作失败:', error)
      toast({
        title: "操作失败",
        description: "无法完成任务并导航，请稍后重试",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [projectId, editorContent, updateDocxExtractionTask, onNavigateToNextTask])


 // 手动启动文档提取 - 使用 useCallback 优化
  const handleStartExtraction = useCallback(async () => {
    // 如果任务已完成，不应该重新启动提取
    if (status === TaskStatus.COMPLETED) {
      return
    }
    
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // 更新任务状态为激活，触发后端提取流程
      await updateDocxExtractionTask({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        status: TaskStatus.ACTIVE,
      })
      
      // 更新本地状态
      dispatch({ type: 'START_EXTRACTION' })
      
      // 手动启动轮询
      startPolling()
      
      toast({
        title: "文档提取已启动",
        description: "系统正在提取招标文件内容，请稍候...",
      })
    } catch (error) {
      console.error('启动提取失败:', error)
      toast({
        title: "启动失败",
        description: "无法启动文档提取，请稍后重试",
        variant: "destructive",
      })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [projectId, status, updateDocxExtractionTask, startPolling])


  // =========================== 渲染 ========================================  

  // 根据任务状态获取卡片样式 - 使用 useMemo 优化
  const cardStyle = useMemo(() => {
    switch(status) {
      case TaskStatus.NOT_STARTED:
        return "border-gray-200"
      case TaskStatus.ACTIVE:
        return "border-blue-400 border-2 bg-blue-50"
      case TaskStatus.COMPLETED:
        return "border-green-400 border-2 bg-green-50"
      case TaskStatus.FAILED:
        return "border-red-400 border-2 bg-red-50"
      default:
        return "border-gray-200"
    }
  }, [status])

  return (
    <Card className={`mb-4 ${cardStyle}`}>
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
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>加载任务数据中...</p>
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
                
                {/* 未开始状态或失败状态显示启动按钮 - 仅在不提取时显示 */}
                {!isExtracting && (status === TaskStatus.NOT_STARTED || status === TaskStatus.FAILED) && (
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
                
                {/* 编辑器区域 - 只在有内容或已完成时显示，且不在提取过程中 */}
                {!isExtracting && (editorContent || status === TaskStatus.COMPLETED) && (
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
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                              </>
                            ) : '保存内容'}
                          </Button>
                        </div>
                      )}
                      
                      <div className="space-x-3">
                        {status !== TaskStatus.COMPLETED && lockStatus === TaskLockStatus.UNLOCKED && (
                          <Button
                            onClick={handleCompleteAndNavigate}
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                处理中...
                              </>
                            ) : '完成并进入下一步'}
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