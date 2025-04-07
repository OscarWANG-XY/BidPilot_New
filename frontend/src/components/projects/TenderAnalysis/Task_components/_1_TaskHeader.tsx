import React from 'react'
import { CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CheckCircle } from 'lucide-react'
import { TaskStatus } from '@/types/projects_dt_stru/projectTasks_interface'


// 定义Props接口
interface TaskHeaderProps {
    title: string;
    status: TaskStatus;
  }
  
export const TaskHeader: React.FC<TaskHeaderProps> = ({ title, status }) => {
    return (
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <FileText className="h-5 w-5 mr-2" />
          {title}
          {status === TaskStatus.COMPLETED && (
            <span title="此任务已完成">
              <CheckCircle className="h-4 w-4 ml-2 text-gray-500" />
            </span>
          )}
        </CardTitle>
      </CardHeader>
    );
  };