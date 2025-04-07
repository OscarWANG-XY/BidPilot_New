// useDocxExtractionTaskState.ts - Optimized Version
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDocxExtraction } from '@/components/projects/TenderAnalysis/Task_components/useTaskDocxExtraction';
import { TaskStatus, TaskLockStatus } from '@/types/projects_dt_stru/projectTasks_interface';
import { StageType } from '@/types/projects_dt_stru/projectStage_interface';
import { Type_DocxExtractionTaskDetail } from '@/components/projects/TenderAnalysis/Task_components/taskDocxExtraction_api';




// ----------- 扩展 UI Interface ---------------    

interface Type_DocxExtractionTaskState extends Type_DocxExtractionTaskDetail {
  isExtracting: boolean;
  editorContent: string;
}

// ==================== TaskState Management ====================
export const useDocxExtractionTaskState = (
  projectId: string,
  onStatusChange?: (lockStatus: TaskLockStatus) => void,
  onNavigateToNextTask?: () => void
) => {
  const { DocxExtractionQuery, DocxExtractionUpdate } = useDocxExtraction();
  const { toast } = useToast();

  // UI-specific state (not directly from API)
  const [loading, setLoading] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  // --------- 获取API提取的数据 ------- 
  const {
    data: taskState,
    isLoading: isTaskLoading,
    refetch: _refetchTaskData
  } = DocxExtractionQuery(projectId,  StageType.TENDER_ANALYSIS, {
    // ProjectId 作为porps 传入 DocxExtractionQuery, 并且projectId 是query key的一部分，这个使得只要projectId发生变化
    // 这个是Tanstack Query的核心功能之一，无需手动处理处理变化
    // 首次挂载，TanStack Query 会自动发起请求获取数据，因为缓存数据没有该数据


    refetchOnMount: true, 
    // 后续挂载时，才会用到refetchOnMount的功能，组件卸载后再次挂载时的，会发起立即获取数据。 
    // 这种更新数据也是有条件的，需要数据被标记为stale 时，才会发起请求更新数据 
    // 如果数据没有变化，则不会发起请求更新数据, 如果需要数据无条件发起请求，需要使用 refetchOnMount:'always' 
    
    // 通过select 对DocxExtractionQuery提取的数据重新包装
    select: useCallback((data: any):Type_DocxExtractionTaskState => {
      return {
        status: data.status,
        lockStatus: data.lockStatus,
        editorContent: data.docxTiptap ? JSON.stringify(data.docxTiptap) : '',
        isExtracting: data.status === TaskStatus.ACTIVE && !data.docxTiptap,
        ...data // 展开原始数据以确保不缺少任何必需属性
      };
    }, []),
    // Run this callback whenever the query succeeds
    onSuccess: useCallback((data: any)=> {
      // Report status changes to parent component
      if (onStatusChange) {
        onStatusChange(data.lockStatus);
      }
      
      // Reset editing mode when locked
      if (data.lockStatus === TaskLockStatus.LOCKED || data.isExtracting) {
        setIsEditing(false);
      }
      
      // Set progress to 100% when completed
      if (data.status === TaskStatus.COMPLETED) {
        setExtractionProgress(100);
      }
    }, [onStatusChange])
  });
  
  // 用提取的值对status, lockStatus, editorContent, isExtracting进行赋值，使其包含undefined等场景的处理
  const status = (taskState as Type_DocxExtractionTaskState)?.status ?? TaskStatus.NOT_STARTED;
  const lockStatus = (taskState as Type_DocxExtractionTaskState)?.lockStatus ?? TaskLockStatus.UNLOCKED;
  const editorContent = (taskState as Type_DocxExtractionTaskState)?.editorContent ?? '';
  const isExtracting = (taskState as Type_DocxExtractionTaskState)?.isExtracting ?? false;
  
  // When projectId changes, reset UI-specific state
  useEffect(() => {
    console.log('🔄 [DocxExtractionTask] projectId变化，重置组件状态:', projectId);
    setExtractionProgress(0);
    setIsEditing(false);
    setLoading(false);
    
    // Force data refresh is handled automatically by TanStack Query
    // when dependencies change!
  }, [projectId]);

  // Handle progress bar animation - this is purely visual, so we keep it
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    
    if (isExtracting) {
      // Create smooth progress updates
      progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (prev < 95) {
            const increment = Math.max(0.5, 5 * (1 - prev / 100));
            return Math.min(95, prev + increment);
          }
          return prev;
        });
      }, 1000);
    } else if (status === TaskStatus.COMPLETED) {
      // Ensure progress is 100% when task is completed
      setExtractionProgress(100);
    }
    
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isExtracting, status]);


  // ------------   Handler: Start document extraction  -------------
  const handleStartExtraction = useCallback(async () => {
    if (status === TaskStatus.COMPLETED) {
      return;
    }
    
    setLoading(true);
    try {
      await DocxExtractionUpdate({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        status: TaskStatus.ACTIVE,
      });
      
      // Reset progress at start
      setExtractionProgress(0);
      
      toast({
        title: "文档提取已启动",
        description: "系统正在提取招标文件内容，请稍候...",
      });
    } catch (error) {
      console.error('启动提取失败:', error);
      toast({
        title: "启动失败",
        description: "无法启动文档提取，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [status, projectId, DocxExtractionUpdate, toast]);



  //-------------------------  Handler: Toggle edit mode  -------------------------
  const handleToggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  // Handler: Update editor content (local only)
  const [localEditorContent, setLocalEditorContent] = useState('');
  
  // Sync the API data to local state when it changes
  useEffect(() => {
    setLocalEditorContent(editorContent);
  }, [editorContent]);
  
  const handleEditorContentChange = useCallback((content: string) => {
    setLocalEditorContent(content);
  }, []);



  // ------------  Handler: Save content to backend using mutation  ------------
  const handleSaveContent = useCallback(async () => {
    setLoading(true);
    try {
      await DocxExtractionUpdate({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        docxTiptap: JSON.parse(localEditorContent)
      });
      
      toast({
        title: "内容已保存",
        description: "招标文件解析内容已成功保存",
      });
    } catch (error) {
      console.error('保存内容时出错:', error);
      toast({
        title: "保存失败",
        description: "无法保存解析内容，请稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, localEditorContent, DocxExtractionUpdate, toast]);

  // ----------------- Handler: Complete task and navigate  -----------------
  const handleCompleteAndNavigate = useCallback(async () => {
    setLoading(true);
    try {
      await DocxExtractionUpdate({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        docxTiptap: JSON.parse(localEditorContent),
        status: TaskStatus.COMPLETED,
        lockStatus: TaskLockStatus.LOCKED,
      });

      toast({
        title: "任务已完成并锁定",
        description: "正在进入文档结构分析任务",
      });

      // Navigate to next task
      if (onNavigateToNextTask) {
        onNavigateToNextTask();
      }
    } catch (error) {
      console.error('操作失败:', error);
      toast({
        title: "操作失败",
        description: "无法完成任务并导航，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, localEditorContent, DocxExtractionUpdate, onNavigateToNextTask, toast]);



  // ------------  Handler: Reset task  ------------
  const handleResetTask = useCallback(async () => {
    setLoading(true);
    try {
      await DocxExtractionUpdate({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        status: TaskStatus.NOT_STARTED,
        lockStatus: TaskLockStatus.UNLOCKED,
      });
      
      setExtractionProgress(0);
      setIsEditing(false);
      
      toast({
        title: "任务已重置",
        description: "文档提取任务已重置，可以重新开始",
      });
    } catch (error) {
      console.error('重置任务失败:', error);
      toast({
        title: "重置失败",
        description: "无法重置任务，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, DocxExtractionUpdate, toast]);



  // Utility: Get card style based on status
  const getCardStyleByStatus = useCallback(() => {
    switch(status) {
      case TaskStatus.NOT_STARTED:
        return "border-gray-200";
      case TaskStatus.ACTIVE:
        return "border-blue-400 border-2 bg-blue-50";
      case TaskStatus.COMPLETED:
        return "border-green-400 border-2 bg-green-50";
      case TaskStatus.FAILED:
        return "border-red-400 border-2 bg-red-50";
      default:
        return "border-gray-200";
    }
  }, [status]);

  return {
    // States from API
    status,
    lockStatus,
    isExtracting,
    
    // Local states
    editorContent: localEditorContent,
    loading,
    extractionProgress,
    isTaskLoading,
    isEditing,
    
    // Handlers
    handleToggleEdit,
    handleEditorContentChange,
    handleSaveContent,
    handleCompleteAndNavigate,
    handleStartExtraction,
    handleResetTask,
    
    // Utilities
    getCardStyleByStatus
  };
};