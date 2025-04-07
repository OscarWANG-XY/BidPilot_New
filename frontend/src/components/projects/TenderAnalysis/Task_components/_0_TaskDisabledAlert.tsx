import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'

interface TaskDisabledAlertProps {}

export const TaskDisabledAlert: React.FC<TaskDisabledAlertProps> = () => {
  return (
    <Alert variant="default">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertTitle>任务未激活</AlertTitle>
      <AlertDescription>
        请先完成招标文件上传
      </AlertDescription>
    </Alert>
  );
};