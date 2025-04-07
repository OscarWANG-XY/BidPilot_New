import React, { useState, useEffect } from 'react'
import { Card, CardContent} from '@/components/ui/card'
import { TaskStatus, TaskLockStatus } from '@/types/projects_dt_stru/projectTasks_interface'
import { TaskHeader } from './_1_TaskHeader'
import { ExtractingProgress } from './_2_ExtractingProgress'
import { DocumentEditor } from './_3_DocumentEditor'
import { TaskActionButtons } from './_4_TaskButtons'
import { TaskDisabledAlert } from './_0_TaskDisabledAlert'

interface BidDocumentExtractionProps {
  projectId: string;
  isEnabled: boolean;
  isTaskLoading: boolean;
  isExtracting: boolean;
  extractionProgress: number;
  status: TaskStatus;
  lockStatus: TaskLockStatus;
  loading: boolean;
  editorContent: string;
  getCardStyleByStatus: () => string;
  handleStartExtraction: () => void;
  handleEditorContentChange: (content: string) => void;
  handleSaveContent: () => void;
  handleCompleteAndNavigate: () => void;
  handleResetTask?: () => void;
}

export const BidDocumentExtraction: React.FC<BidDocumentExtractionProps> = ({
  projectId,
  isEnabled,
  isTaskLoading,
  isExtracting,
  extractionProgress,
  status,
  lockStatus,
  loading,
  editorContent,
  getCardStyleByStatus,
  handleStartExtraction,
  handleEditorContentChange,
  handleSaveContent,
  handleCompleteAndNavigate,
  handleResetTask
}) => {
  // State to track if we're in edit mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Handler to toggle edit mode
  const handleToggleEdit = () => {
    setIsEditing(prev => !prev);
  };
  
  // Reset editing mode when task status changes or when locked
  useEffect(() => {
    if (lockStatus === TaskLockStatus.LOCKED || isExtracting) {
      setIsEditing(false);
    }
  }, [lockStatus, isExtracting, status]);
  
  // Determine if we should show the editor content section
  const shouldShowEditor = (editorContent || status === TaskStatus.COMPLETED) && !isExtracting;
  
  return (
    <Card className={`mb-4 ${getCardStyleByStatus()}`}>
      <TaskHeader 
        title="招标文件内容提取" 
        lockStatus={lockStatus} 
      />
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
                <p>加载中...</p>
              </div>
            ) : (
              <>
                <ExtractingProgress 
                  isExtracting={isExtracting} 
                  extractionProgress={extractionProgress} 
                />
                
                {/* Document editor with simplified props */}
                {shouldShowEditor && (
                  <DocumentEditor 
                    editorContent={editorContent}
                    isEditing={isEditing && lockStatus === TaskLockStatus.UNLOCKED}
                    loading={loading}
                    handleEditorContentChange={handleEditorContentChange}
                    handleSaveContent={handleSaveContent}
                  />
                )}
                
                {/* Task action buttons with edit functionality */}
                <TaskActionButtons
                  status={status}
                  lockStatus={lockStatus}
                  loading={loading}
                  isExtracting={isExtracting}
                  isEditing={isEditing}
                  editorContent={editorContent}
                  handleStartExtraction={handleStartExtraction}
                  handleCompleteAndNavigate={handleCompleteAndNavigate}
                  handleToggleEdit={handleToggleEdit}
                  handleResetTask={handleResetTask}
                />
              </>
            )}
          </>
        ) : (
          <TaskDisabledAlert />
        )}
      </CardContent>
    </Card>
  );
};