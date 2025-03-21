import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'
import { TaskStatus } from '@/types/projects_dt_stru/projectTasks_interface'

interface TaskBProps {
  projectId: string
  isEnabled: boolean
  onStatusChange?: (status: TaskStatus) => void //回调函数接收"status"作为参数进行回传
  initialStatus?: TaskStatus
}

export const DocxTreeBuildTask: React.FC<TaskBProps> = ({ 
  projectId, 
  isEnabled, // 是否启用任务A，再后面的组件渲染中使用
  onStatusChange, // 回调函数，在父组件有重新渲染时，无论状态是否真的有变化，onStatusChange都被认为变化了，在下面Effect里被监听。
  initialStatus = TaskStatus.NOT_STARTED
}) => {

  // 添加了任务A的status状态管理, 用于向父组件传递状态，与后面的
  const [status, setStatus] = useState<TaskStatus>(initialStatus as TaskStatus)
  // 添加了任务A的loading状态管理
  const [loading, setLoading] = useState(false)


  // 任务B的数据通信模块，待完善 todo 
  // ...................
  // ...................



  // 依赖项是status和onStatusChange。 
  // 两种情况会向父组件传递status的值，1）status发生变化，2）onStatusChange发生变化(即父组件的重新渲染)。 
  useEffect(() => {
    // if(onStatusChange) 检查onStatusChange是否存在(是否是undefined或null)，如果存在则执行onStatusChange(status)
    if (onStatusChange) {
      onStatusChange(status)
    }
  }, [status])

  // Simulate task completion
  const handleCompleteTask = async () => {
    setLoading(true)
    try {
      // This would be an actual API call in a real implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      setStatus(TaskStatus.COMPLETED)
      
      // Notify parent component
      if (onStatusChange) {
        onStatusChange(TaskStatus.COMPLETED)
      }
    } catch (error) {
      console.error('Error completing task:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>评分标准分析</CardTitle>
      </CardHeader>
      <CardContent>
        {isEnabled ? (
          // TaskA的核心渲染内容再isEnabled为true时显示，具体待进一步完善，目前时Button进行占位
          <>
            <p className="mb-4">分析招标文件中的评分标准，确定投标策略 (项目ID: {projectId})</p>
            
            {status === TaskStatus.COMPLETED ? (
              <div className="p-3 bg-green-50 text-green-700 rounded-md">
                任务已完成
              </div>
            ) : (
              <Button 
                onClick={handleCompleteTask} 
                disabled={loading}
                className="mt-4"
              >
                {loading ? '处理中...' : '完成任务'}
              </Button>
            )}
          </>
        ) : (
          <Alert variant="default">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>任务未激活</AlertTitle>
            <AlertDescription>
              请先完成招标文件解析任务才能开始评分标准分析
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
