// DocxExtractionTask.tsx
import React from 'react';
import { useDocxExtractionTaskState } from './useDocxExtractionTaskState';
import { BidDocumentExtraction } from './MainComponent';
import { TaskStatus, TaskLockStatus } from '@/types/projects_dt_stru/projectTasks_interface';

interface DocxExtractionTaskProps {
  projectId: string;
  isEnabled: boolean;
  onStatusChange?: (lockStatus: TaskLockStatus) => void;
  onNavigateToNextTask?: () => void;
}

export const DocxExtractionTask: React.FC<DocxExtractionTaskProps> = ({
  projectId,
  isEnabled,
  onStatusChange,
  onNavigateToNextTask
}) => {
  // Use our comprehensive state hook
  const {
    status,
    lockStatus,
    editorContent,
    loading,
    extractionProgress,
    isExtracting,
    isTaskLoading,
    isEditing,
    handleToggleEdit,
    handleEditorContentChange,
    handleSaveContent,
    handleCompleteAndNavigate,
    handleStartExtraction,
    handleResetTask,
    getCardStyleByStatus
  } = useDocxExtractionTaskState(
    projectId,
    isEnabled,
    onStatusChange,
    onNavigateToNextTask
  );

  // Simply pass all props to the main component
  return (
    <BidDocumentExtraction
      projectId={projectId}
      isEnabled={isEnabled}
      isTaskLoading={isTaskLoading}
      isExtracting={isExtracting}
      extractionProgress={extractionProgress}
      status={status}
      lockStatus={lockStatus}
      loading={loading}
      editorContent={editorContent}
      getCardStyleByStatus={getCardStyleByStatus}
      handleStartExtraction={handleStartExtraction}
      handleEditorContentChange={handleEditorContentChange}
      handleSaveContent={handleSaveContent}
      handleCompleteAndNavigate={handleCompleteAndNavigate}
      handleResetTask={handleResetTask}
    />
  );
};