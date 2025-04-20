import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocxExtractionApi } from '@/components/projects/TenderAnalysis/DocxExtractionTask/taskDocxExtraction_api';
// import { StreamingTaskApi } from '@/api/projects_api/taskOutlineAnalysis_api';
import type { Type_DocxExtractionTaskDetail, Type_DocxExtractionTaskUpdate } from '@/components/projects/TenderAnalysis/DocxExtractionTask/taskDocxExtraction_api';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type {
  TaskStatus,
  TaskLockStatus,
} from '@/_types/projects_dt_stru/projectTasks_interface';
import { useCallback } from 'react';

export const useDocxExtraction = () => {
  const queryClient = useQueryClient();
  
  // Document Extraction Task Query with built-in polling
  const DocxExtractionQuery = (
    projectId: string, 
    stageType: StageType, 
    options = {}
  ) => {
    // Create the base query with polling capabilities
    const query = useQuery({
      queryKey: ['docxExtractionTask', projectId, stageType],
      queryFn: async () => {
        const result = await DocxExtractionApi.getDocxExtractionTask(projectId, stageType);
        console.log('📥 文档提取的结果是', result);
        return result as Type_DocxExtractionTaskDetail;
      },
      
      // 只有当任务处于 PROCESSING 状态时，才进行轮询
      // 语法：refetchInterval 在useQuery内部接收的是原始Query对象，要通过query.state.date来访问里面的数据。
      refetchInterval: (query) => {
        return query.state.data?.status === 'PROCESSING' ? 2000 : false;
      },
      refetchOnWindowFocus: false,
      staleTime: 0,
      gcTime: 5 * 60 * 1000,
      enabled: Boolean(projectId) && Boolean(stageType),
      ...options,
    });



    // Add helper methods to control polling manually if needed
    const startPolling = useCallback(() => {
      query.refetch();
      queryClient.setQueryData(
        // key 
        ['docxExtractionTask', projectId, stageType], 
        // 更新函数
        (oldData: Type_DocxExtractionTaskDetail) => {
          if (oldData) { return { ...oldData, status: 'PROCESSING' }; } 
          return oldData;
        }
      );
    }, [projectId, query.refetch]);

    const stopPolling = useCallback(() => {
      // Update the query data to set status to something other than PROCESSING
      queryClient.setQueryData(
        ['docxExtractionTask', projectId, stageType], 
        (oldData: Type_DocxExtractionTaskDetail) => {
          if (oldData && oldData.status === 'PROCESSING') {
                              //status的更新逻辑为：如果oldData.docxTiptap存在（非空），则任务完成，返回COMPLETED, 否则NOT_STARTED
          return { ...oldData, status: oldData.docxTiptap ? 'COMPLETED' : 'NOT_STARTED' };
        }
        return oldData;
      });
    }, [projectId]);

    return {
      ...query,
      startPolling,
      stopPolling,
      isPolling: query.data?.status === 'PROCESSING', //这里使用了useQuery返回的query对象，已经扁平化了，不能加state. 
    };
  };

  // Mutation to update the document extraction task
  const updateDocxExtractionTask = useMutation({
    mutationFn: async ({
      projectId,
      stageType,
      status,
      lockStatus,
      docxTiptap,
    }: {
      projectId: string;
      stageType: StageType;
      status?: TaskStatus;
      lockStatus?: TaskLockStatus;
      docxTiptap?: any;
    }) => {
      
    // 构建要上传的数据，格式为Type_DocxExtractionTaskUpdate
      const taskData = {} as Type_DocxExtractionTaskUpdate;
      if (status) taskData.status = status;
      if (lockStatus) taskData.lockStatus = lockStatus;
      if (docxTiptap !== undefined) taskData.docxTiptap = docxTiptap;
      
      const result = await DocxExtractionApi.updateDocxExtractionTask(
        projectId, 
        stageType, taskData as Type_DocxExtractionTaskUpdate);
      console.log('✅ 成功更新文档提取的任务数据:', result);
      return { result, projectId, stageType, status };
    },
    onSuccess: (data, variables) => {
      // Invalidate the query to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: ['docxExtractionTask', variables.projectId, variables.stageType]
      });

      // 如果任务状态变为完成，则刷新项目阶段数据
      if (data.status === 'COMPLETED' || variables.status === 'COMPLETED') {
        console.log('🔄 [useProjectTasks] 文档提取任务完成，刷新项目阶段数据');
        queryClient.invalidateQueries({
          queryKey: ['projectStage', variables.projectId, variables.stageType]
        });
      }
    }
  });

  // Return the hook API
  return {
    DocxExtractionQuery,
    DocxExtractionUpdate: updateDocxExtractionTask.mutateAsync,
  };
};