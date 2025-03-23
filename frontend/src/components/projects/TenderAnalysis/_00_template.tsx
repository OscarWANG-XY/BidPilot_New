import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon, Lock } from 'lucide-react'
import { TaskStatus, TaskLockStatus } from '@/types/projects_dt_stru/projectTasks_interface'

/**
 * 自下而上模式的任务组件基础接口
 * 每个任务组件独立通过hooks与API交互，父组件仅接收状态更新通知
 */
interface BaseTaskProps {
  // 基本信息
  projectId: string
  isEnabled: boolean              // 是否启用，由父组件基于依赖逻辑传入
  
  // 子组件向上回传状态的回调
  onStatusChange?: (status: TaskStatus) => void
  onLockStatusChange?: (lockStatus: TaskLockStatus) => void
}

/**
 * 任务组件基础类 - 每个具体任务需要继承并实现自己的逻辑
 * 每个组件内部自行管理数据获取、状态更新和API交互
 */
export const BaseTaskComponent: React.FC<BaseTaskProps & {
  taskIcon?: React.ReactNode
  taskTitle: string
  children: React.ReactNode
}> = ({
  projectId,
  isEnabled,
  taskIcon,
  taskTitle,
  onStatusChange,
  onLockStatusChange,
  children
}) => {
  // 组件内部状态 - 实际实现中使用useXXXTask hook获取初始状态
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING)
  const [lockStatus, setLockStatus] = useState<TaskLockStatus>(TaskLockStatus.UNLOCKED)

  // 向父组件报告状态变化
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status)
    }
  }, [status, onStatusChange])

  useEffect(() => {
    if (onLockStatusChange) {
      onLockStatusChange(lockStatus)
    }
  }, [lockStatus, onLockStatusChange])




  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          {taskIcon && <span className="mr-2">{taskIcon}</span>}
          {taskTitle}
          {lockStatus === TaskLockStatus.LOCKED && (
            <span title="此任务已锁定">
              <Lock className="h-4 w-4 ml-2 text-gray-500" />
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEnabled ? (
          // 启用时显示子组件传入的内容
          children
        ) : (
          // 未启用时显示通用提示
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