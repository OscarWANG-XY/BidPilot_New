import { TaskStatus, AllTaskState } from '@/types/projects_dt_stru'
import { CheckCircleIcon } from 'lucide-react'

// Helper function, 在任务Overview的Tabcontent中使用，用于显示各个任务状态 
export const TaskStatusItem = ({ 
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
          {status === TaskStatus.COMPLETED ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <div className={`h-3 w-3 rounded-full ${
              status === TaskStatus.PROCESSING ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
          )}
          <span>{title}</span>
        </div>
  
        {/* 右侧内容 */}
        <div>
          {status === TaskStatus.PENDING && '未开始'}
          {status === TaskStatus.PROCESSING && '进行中'}
          {status === TaskStatus.COMPLETED && '已完成'}
        </div>
      </div>
    )
  }
  
  
  // Helper function to calculate progress percentage
  // number定义了函数的返回类型为数值。 
  export const getProgressPercentage = (taskState: AllTaskState): number => {
    // Object.keys 获取taskState对象的所有建，返回一个数组。
    const totalTasks = Object.keys(taskState).length
    // Object.values 获取taskState对象的所有值，返回一个数组，然后筛选completed的数组片段，再计算长度
    const completedTasks = Object.values(taskState).filter(status => status === TaskStatus.COMPLETED).length
    
    return Math.round((completedTasks / totalTasks) * 100)
  }
  