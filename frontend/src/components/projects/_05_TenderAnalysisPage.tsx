import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InfoIcon, Loader2 } from 'lucide-react'
import { TenderFileUpload } from '@/components/projects/TenderTasks/_01_TenderFileupload'
import { DocxExtractionTask } from '@/components/projects/TenderTasks/_02_DocxExtractionTask'
import { DocxTreeBuildTask } from '@/components/projects/TenderTasks/_03_DocxTreeBuildTask'
import { useProjects } from '@/hooks/useProjects'
import { StageType, TaskStatus, TaskType, AllTaskState, TaskLockStatus } from '@/types/projects_dt_stru'
import { Skeleton } from '@/components/ui/skeleton'
import { TaskStatusItem, getProgressPercentage } from '@/components/projects/TenderTasks/_00_helper'

// 定义页面props
interface TenderAnalysisPageProps {
  projectId: string
}

// 主组件
export const TenderAnalysisPage: React.FC<TenderAnalysisPageProps> = ({ projectId }) => {
  
  
// 设置所有任务的初始状态
    const [allTaskState, setAllTaskState] = useState<AllTaskState>({
        fileUploadStatus: TaskStatus.PENDING,
        docxExtractionStatus: TaskStatus.PENDING,
        docxTreeBuildStatus: TaskStatus.PENDING,
        fileUploadLock: TaskLockStatus.UNLOCKED,
        docxExtractionLock: TaskLockStatus.UNLOCKED,
        docxTreeBuildLock: TaskLockStatus.UNLOCKED,
    })

    // 使用useProjects的钩子获取和更新数据
    const { projectStageTaskMetaDataQuery, updateStageTaskStatus } = useProjects()


    // （1）加载数据到本地， 调用projectStageTaskMetaDataQuery, 只要taskMetaData有新的值，就会触发useEffect对allTaskState更新
    const { data: taskMetaData, isLoading } = projectStageTaskMetaDataQuery(projectId, StageType.TENDER_ANALYSIS)
    useEffect(() => {
      if (taskMetaData && taskMetaData.length > 0) {  // 确保存在且不空

        const newTaskState: AllTaskState = { ...allTaskState }   //创建新变量，并浅拷贝
      
        taskMetaData.forEach(task => {
            if (task.type === TaskType.UPLOAD_TENDER_FILE) {
            newTaskState.fileUploadStatus = task.status as TaskStatus    // 变量赋值
            newTaskState.fileUploadLock = task.lockStatus as TaskLockStatus
            } else if (task.type === TaskType.DOCX_EXTRACTION_TASK) {
            newTaskState.docxExtractionStatus = task.status as TaskStatus
            newTaskState.docxExtractionLock = task.lockStatus as TaskLockStatus
            } else if (task.type === TaskType.DOCX_TREE_BUILD_TASK) {
            newTaskState.docxTreeBuildStatus = task.status as TaskStatus
            newTaskState.docxTreeBuildLock = task.lockStatus as TaskLockStatus
            }
        })
        setAllTaskState(newTaskState)  // 通过新变量更新状态
      }
    }, [taskMetaData])
    console.log("后端传入的taskMetaData", taskMetaData)


    //（2）更新状态到服务器， 回调函数，调用useProjects的updateStageTaskStatus
    const handleTaskStateChange = useCallback(async (
        taskType: TaskType, 
        newStatus: TaskStatus,
        taskStateKey: keyof AllTaskState,
        newLockStatus: TaskLockStatus,
        lockStateKey: keyof AllTaskState

    ) => {
        try {
        // 先更新本地状态以获得即时反馈
        setAllTaskState(prev => ({
            ...prev,
            [taskStateKey]: newStatus,
            [lockStateKey]: newLockStatus
        }));
        
        console.log("更新后的allTaskState", allTaskState)

        // 调用mutation更新后端状态
        await updateStageTaskStatus({
            projectId,
            stageType: StageType.TENDER_ANALYSIS,
            taskType,
            newStatus,
            newLockStatus
        });
        
        // 因为我们在mutation中已经设置了onSuccess中的invalidateQueries
        // 所以这里不需要手动刷新数据
        } catch (error) {
        console.error(`更新${taskType}任务状态失败:`, error);
        // 处理错误，可能需要回滚本地状态
        }
        // 下面我们添加了两个依赖项，projectId为了确保当用户切换到不同项目时，projectId也更新。
        // 没有添加stageType，或stageid, 因为在这个组件的语境下，stageType和stageid是常量。 
        // 每当useProjects的updateStageTaskStatus被调用，我们也会做一次状态更新，确保是同步的。
    }, [projectId, updateStageTaskStatus]);

    const handleFileUploadStateChange = useCallback((status: TaskStatus, lockStatus: TaskLockStatus) => {
        handleTaskStateChange(   // 这里是调用，调用本身不会影响handleTaskStateChange的变化
        TaskType.UPLOAD_TENDER_FILE, 
        status, 
        'fileUploadStatus',
        lockStatus || TaskLockStatus.UNLOCKED,
        'fileUploadLock'
        );
    }, [handleTaskStateChange]); // 依赖项的变化是在组件重新渲染时，handleTaskStateChange被重新创建。 
    
    const handleDocxExtractionStateChange = useCallback((status: TaskStatus, lockStatus: TaskLockStatus) => {
        handleTaskStateChange(
        TaskType.DOCX_EXTRACTION_TASK, 
        status, 
        'docxExtractionStatus',
        lockStatus || TaskLockStatus.UNLOCKED,
        'docxExtractionLock'
        );
    }, [handleTaskStateChange]);
    
    const handleDocxTreeBuildStateChange = useCallback((status: TaskStatus, lockStatus: TaskLockStatus) => {
        handleTaskStateChange(
        TaskType.DOCX_TREE_BUILD_TASK, 
        status, 
        'docxTreeBuildStatus',
        lockStatus || TaskLockStatus.UNLOCKED,
        'docxTreeBuildLock'
        );
    }, [handleTaskStateChange]);




    // activeTab 与 isTaskEnabled的搭配来实现Tab切换的逻辑。
    const [activeTab, setActiveTab] = useState('overview') 
    const isTaskAEnabled = allTaskState.fileUploadStatus === TaskStatus.COMPLETED
    const isTaskBEnabled = allTaskState.docxExtractionStatus === TaskStatus.COMPLETED


      // 如果数据正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold">招标文件分析</h3>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span>加载任务状态中...</span>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>任务概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 任务骨架屏 */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 页面渲染
  return (
    <div className="space-y-6">
    {/* 页面标题  */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">招标文件分析</h3>
        <div className="flex items-center space-x-2">
          <InfoIcon className="h-5 w-5 text-blue-500" />
          <span>项目进度: {getProgressPercentage(allTaskState)}%</span>
        </div>
      </div>
     
      {/* Tab按钮 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="upload_file">上传文件</TabsTrigger>
          <TabsTrigger value="tender_file_analysis">招标文件解析</TabsTrigger>
          <TabsTrigger value="scoring_standard_analysis">评分标准分析</TabsTrigger>
        </TabsList>

        {/* Tab内容 - 概览 */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>任务概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              <TaskStatusItem 
                  title="招标文件上传" 
                  status={allTaskState.fileUploadStatus} 
                  onClick={() => setActiveTab('upload_file')}
                />
                <TaskStatusItem 
                  title="招标文件解析" 
                  status={allTaskState.docxExtractionStatus} 
                  disabled={!isTaskAEnabled}
                  onClick={() => isTaskAEnabled && setActiveTab('tender_file_analysis')}
                />
                <TaskStatusItem 
                  title="评分标准分析" 
                  status={allTaskState.docxTreeBuildStatus} 
                  disabled={!isTaskBEnabled}
                  onClick={() => isTaskBEnabled && setActiveTab('scoring_standard_analysis')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab内容 - 上传文件 */}
        <TabsContent value="upload_file" className="mt-4">
          <TenderFileUpload 
            // 传入参数
            projectId={projectId}                           // 传入项目id
            initialStatus={allTaskState.fileUploadStatus}   // 传入初始状态
            initialLockStatus={allTaskState.fileUploadLock} // 传入初始锁状态
            // 回调函数
            onStateChange={handleFileUploadStateChange}                                                             
            onNavigateToNextTask={() => setActiveTab('tender_file_analysis')}                                       
            onStartNextTask={() => handleDocxExtractionStateChange(TaskStatus.PROCESSING, TaskLockStatus.UNLOCKED)} 
          />
        </TabsContent>

        {/* Tab内容 - 招标文件解析 */}
        <TabsContent value="tender_file_analysis" className="mt-4">
          <DocxExtractionTask 
            // 传入参数
            projectId={projectId} 
            initialStatus={allTaskState.docxExtractionStatus}
            initialLockStatus={allTaskState.docxExtractionLock}
            isEnabled={isTaskAEnabled}
            // 回调函数
            onStateChange={handleDocxExtractionStateChange}

          />
        </TabsContent>

        {/* Tab内容 - 评分标准分析 */}  
        <TabsContent value="scoring_standard_analysis" className="mt-4">
          <DocxTreeBuildTask 
            // 传入参数
            projectId={projectId} 
            initialStatus={allTaskState.docxTreeBuildStatus}
            initialLockStatus={allTaskState.docxTreeBuildLock}
            isEnabled={isTaskBEnabled}
            // 回调函数
            onStateChange={handleDocxTreeBuildStateChange}

          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
