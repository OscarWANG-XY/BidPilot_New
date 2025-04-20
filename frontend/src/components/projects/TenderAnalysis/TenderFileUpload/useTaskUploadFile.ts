import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadFileApi } from '@/components/projects/TenderAnalysis/TenderFileUpload/taskUploadFile_api';
// import { StreamingTaskApi } from '@/api/projects_api/taskOutlineAnalysis_api';
import { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type {
  TaskStatus,
  TaskLockStatus,
} from '@/_types/projects_dt_stru/projectTasks_interface';
// import { useState, useEffect, useCallback } from 'react';

export const useUploadFile = () => {
    const queryClient = useQueryClient();

  
    // File Upload Task Operations
    const fileUploadTaskQuery = (projectId: string, stageType: StageType) => useQuery({
      queryKey: ['fileUploadTask', projectId, stageType],
      queryFn: async () => {
        console.log('🔍 [useProjectTasks] 查询文件上传任务:', { projectId, stageType });
        const result = await UploadFileApi.getFileUploadTask(projectId, stageType);
        console.log('📥 [useProjectTasks] 查询文件上传任务成功:', result);
        return result;
      },
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      enabled: Boolean(projectId) && Boolean(stageType),
    });
  
    const updateFileUploadTask = useMutation({
      mutationFn: async ({
        projectId,
        stageType,
        status,
        lockStatus,
      }: {
        projectId: string;
        stageType: StageType;
        status?: TaskStatus;
        lockStatus?: TaskLockStatus;
      }) => {
        console.log('📤 [useProjectTasks] 更新文件上传任务:', { projectId, stageType, status, lockStatus });
        
        const taskData: any = {};
        if (status) taskData.status = status;
        if (lockStatus) taskData.lock_status = lockStatus;
        
        const result = await UploadFileApi.updateFileUploadTask(projectId, stageType, taskData);
        console.log('✅ [useProjectTasks] 更新文件上传任务成功:', result);
        return { result, projectId, stageType, status };
      },
      onSuccess: (data, variables) => {
        console.log('🔄 [useProjectTasks] 更新文件上传任务后，更新缓存数据');
        
        // 使无效相关查询，触发重新获取数据
        queryClient.invalidateQueries({
          queryKey: ['fileUploadTask', variables.projectId, variables.stageType]
        });

        // 如果任务状态变为完成，则刷新项目阶段数据
        if (data.status === 'COMPLETED' || variables.status === 'COMPLETED') {
          console.log('🔄 [useProjectTasks] 文件上传任务完成，刷新项目阶段数据');
          queryClient.invalidateQueries({
            queryKey: ['projectStage', variables.projectId, variables.stageType]
          });
        }
      }
    });
  

// Return all task operations
return {
  // File Upload Tasks
  fileUploadTaskQuery,
  updateFileUploadTask: updateFileUploadTask.mutateAsync,
  
  // Document Extraction Tasks
//   docxExtractionTaskQuery,
//   pollDocxExtractionTask,
//   updateDocxExtractionTask: updateDocxExtractionTask.mutateAsync,

  // Document Outline Analysis Tasks
  // outlineAnalysisTaskQuery,
  // pollOutlineAnalysisTask,
  // updateOutlineAnalysisTask: updateOutlineAnalysisTask.mutateAsync,
};
};