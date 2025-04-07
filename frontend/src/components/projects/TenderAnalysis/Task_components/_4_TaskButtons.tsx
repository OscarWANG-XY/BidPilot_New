import React from 'react'
import { Loader2, Eye, Edit, RotateCcw, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TaskStatus, TaskLockStatus } from '@/types/projects_dt_stru/projectTasks_interface'



interface TaskActionButtonsProps {
    status: TaskStatus;
    lockStatus: TaskLockStatus;
    loading: boolean;
    isExtracting: boolean;
    isEditing: boolean; // New prop to track editing state
    handleStartExtraction: () => void;
    handleCompleteAndNavigate: () => void;
    handleToggleEdit: () => void; // New handler for toggling edit mode
    handleResetTask?: () => void; // Optional reset handler
    editorContent?: string; // Optional to check if there's content to edit
  }
  
export const TaskActionButtons: React.FC<TaskActionButtonsProps> = ({
    status,
    lockStatus,
    loading,
    isExtracting,
    isEditing,
    handleStartExtraction,
    handleCompleteAndNavigate,
    handleToggleEdit,
    handleResetTask,
    editorContent
  }) => {
    // Don't show any buttons when task is locked or extraction is in progress
    if (lockStatus === TaskLockStatus.LOCKED || isExtracting) {
      return null;
    }
    
    // Determine which buttons to show based on task status
    const showStartButton = (status === TaskStatus.NOT_STARTED || status === TaskStatus.FAILED) && !isExtracting;
    const showCompleteButton = status !== TaskStatus.COMPLETED && editorContent;
    const showEditButton = status !== TaskStatus.NOT_STARTED && status !== TaskStatus.FAILED && editorContent;
    const showResetButton = status !== TaskStatus.NOT_STARTED && handleResetTask && !isExtracting;
    
    return (
      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <div>
          {/* Start/Retry Extraction Button */}
          {showStartButton && (
            <Button
              onClick={handleStartExtraction}
              disabled={loading}
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
          )}
          
          {/* Edit Button */}
          {showEditButton && (
            <Button
              variant={isEditing ? "secondary" : "outline"}
              onClick={handleToggleEdit}
              disabled={loading}
              className="flex items-center"
            >
              {isEditing ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  查看模式
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑内容
                </>
              )}
            </Button>
          )}
        </div>
        
        <div className="flex gap-3">
          {/* Reset Task Button */}
          {showResetButton && (
            <Button
              variant="outline"
              onClick={handleResetTask}
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              重置任务
            </Button>
          )}
          
          {/* Complete Task Button */}
          {showCompleteButton && (
            <Button
              onClick={handleCompleteAndNavigate}
              disabled={loading || isEditing} // Disable when in edit mode
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  完成并进入下一步
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };