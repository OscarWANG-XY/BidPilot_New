import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { InfoIcon, CheckCircleIcon } from 'lucide-react'
import { TenderFileUpload } from '@/components/projects/TenderTasks/TenderFileupload'
import { TaskA, TaskStatus } from '@/components/projects/TenderTasks/TaskA'
import { TaskB } from '@/components/projects/TenderTasks/TaskB'

// 定义状态接口， 之后考虑统一切换使用 projects_dt_stru.ts中的TaskStatus类型 
interface TaskState {
  tenderFileUpload: TaskStatus
  taskA: TaskStatus
  taskB: TaskStatus
}


// 定义页面props
interface TenderAnalysisPageProps {
  projectId: string
}

// 主组件
export const TenderAnalysisPage: React.FC<TenderAnalysisPageProps> = ({ projectId }) => {
  
  
// 设置所有任务的初始状态是not_started，用于之后跟踪
  const [taskState, setTaskState] = useState<TaskState>({
    tenderFileUpload: 'not_started',
    taskA: 'not_started',
    taskB: 'not_started',
  })

  // 用于管理 当前选中的tab，初始值设为 'overview'的tab, 值需要和tab的value值一致
  const [activeTab, setActiveTab] = useState('overview') 

// 检查任务B是否启用（取决于任务A是否完成），与后面的TaskStatusItem组件的disabled 和 onClick 属性配套使用。
  const isTaskAEnabled = taskState.tenderFileUpload === 'completed'
  const isTaskBEnabled = taskState.taskA === 'completed'


  // 改监听依赖的是projectId的变化，所以跳转项目，组件首次渲染时执行，从API获取任务状态。 
  //（*****TODO*****）以下useEffect内的函数时 Simulation，TODO 需要替换为实际的API调用。
  useEffect(() => {
    // This would be replaced with an actual API call
    const fetchTaskStates = async () => {
      try {
        // Mock API response
        const response = {
          taskA: 'not_started' as TaskStatus,
          taskB: 'not_started' as TaskStatus,
        }
        setTaskState(response)
      } catch (error) {
        console.error('Error fetching task states:', error)
      }
    }

    fetchTaskStates()
  }, [projectId])



  // 处理任务A状态变化，这里只更新taskA的状态，其他任务状态不变。
  const handleTaskAStatusChange = useCallback((status: TaskStatus) => {
    setTaskState(prev => ({
      ...prev,
      taskA: status  // 只更新单任务的状态
    }))
  }, [])

  // 处理任务B状态变化，这里只更新taskB的状态，其他任务状态不变。
  const handleTaskBStatusChange = useCallback((status: TaskStatus) => {
    setTaskState(prev => ({
      ...prev,
      taskB: status  // 只更新单任务的状态
    }))
  }, [])

  // 处理文件上传状态变化
  const handleFileUploadStatusChange = useCallback((status: TaskStatus) => {
    setTaskState(prev => ({
      ...prev,
      tenderFileUpload: status  // 只更新文件上传任务的状态
    }))
  }, [])

  // 页面渲染
  return (
    <div className="space-y-6">
    {/* 页面标题  */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">招标文件分析</h3>
        <div className="flex items-center space-x-2">
          <InfoIcon className="h-5 w-5 text-blue-500" />
          <span>项目进度: {getProgressPercentage(taskState)}%</span>
        </div>
      </div>
     
      {/* Tab按钮 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="upload">上传文件</TabsTrigger>
          <TabsTrigger value="taskA">招标文件解析</TabsTrigger>
          <TabsTrigger value="taskB">评分标准分析</TabsTrigger>
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
                  status={taskState.tenderFileUpload} 
                  onClick={() => setActiveTab('upload')}
                />
                <TaskStatusItem 
                  title="招标文件解析" 
                  status={taskState.taskA} 
                  disabled={!isTaskAEnabled}
                  onClick={() => isTaskAEnabled && setActiveTab('taskA')}
                />
                <TaskStatusItem 
                  title="评分标准分析" 
                  status={taskState.taskB} 
                  disabled={!isTaskBEnabled}
                  onClick={() => isTaskBEnabled && setActiveTab('taskB')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab内容 - 上传文件 */}
        <TabsContent value="upload" className="mt-4">
          <TenderFileUpload 
            projectId={projectId} 
            onStatusChange={handleFileUploadStatusChange}
            initialStatus={taskState.tenderFileUpload}
            onNavigateToNextTask={() => setActiveTab('taskA')}
          />
        </TabsContent>

        {/* Tab内容 - 招标文件解析 */}
        <TabsContent value="taskA" className="mt-4">
          <TaskA 
            projectId={projectId} 
            isEnabled={isTaskAEnabled}
            // 从上面的handleTaskAStatusChange的处理函数中，status作为参数传入，这个参数来自子组件。 
            onStatusChange={handleTaskAStatusChange}
            initialStatus={taskState.taskA}
          />
        </TabsContent>

        {/* Tab内容 - 评分标准分析 */}  
        <TabsContent value="taskB" className="mt-4">
          <TaskB 
            projectId={projectId} 
            isEnabled={isTaskBEnabled}
            // 从上面的handleTaskBStatusChange的处理函数中，status作为参数传入，这个参数来自子组件。 
            onStatusChange={handleTaskBStatusChange}
            initialStatus={taskState.taskB}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function, 在任务Overview的Tabcontent中使用，用于显示各个任务状态 
const TaskStatusItem = ({ 
  title, 
  status, 
  disabled = false,
  onClick 
}: { 
  title: string
  status: TaskStatus
  disabled?: boolean
  onClick?: () => void  
  //回调函数有调用的组件进行实现，以上有几种定义： 
  // onClick={() => setActiveTab('taskA')}
  // onClick={() => isTaskBEnabled && setActiveTab('taskB')}
}) => {
  return (
    <div 
      className={`flex items-center justify-between p-3 border rounded-md ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
      }`}
      // 针对这个div添加了点击事件
      onClick={disabled ? undefined : onClick}
    >
      {/* 左侧内容 */}
      <div className="flex items-center space-x-2">
        {status === 'completed' ? (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        ) : (
          <div className={`h-3 w-3 rounded-full ${
            status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
          }`} />
        )}
        <span>{title}</span>
      </div>

      {/* 右侧内容 */}
      <div>
        {status === 'not_started' && '未开始'}
        {status === 'in_progress' && '进行中'}
        {status === 'completed' && '已完成'}
      </div>
    </div>
  )
}


// Helper function to calculate progress percentage
// number定义了函数的返回类型为数值。 
const getProgressPercentage = (taskState: TaskState): number => {
  // Object.keys 获取taskState对象的所有建，返回一个数组。
  const totalTasks = Object.keys(taskState).length
  // Object.values 获取taskState对象的所有值，返回一个数组，然后筛选completed的数组片段，再计算长度
  const completedTasks = Object.values(taskState).filter(status => status === 'completed').length
  
  return Math.round((completedTasks / totalTasks) * 100)
}
