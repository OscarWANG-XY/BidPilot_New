import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskApi } from '@/api/projects_api/projectTasks_api';
import type { StageType } from '@/types/projects_dt_stru/projectStage_interface';
import type {
  TaskStatus,
  TaskLockStatus,
} from '@/types/projects_dt_stru/projectTasks_interface';
import { useState, useEffect, useCallback } from 'react';

export const useProjectTasks = () => {
    const queryClient = useQueryClient();
  
    // File Upload Task Operations
    const fileUploadTaskQuery = (projectId: string, stageType: StageType) => useQuery({
      queryKey: ['fileUploadTask', projectId, stageType],
      queryFn: async () => {
        console.log('🔍 [useProjectTasks] 查询文件上传任务:', { projectId, stageType });
        const result = await TaskApi.getFileUploadTask(projectId, stageType);
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
        
        const result = await TaskApi.updateFileUploadTask(projectId, stageType, taskData);
        console.log('✅ [useProjectTasks] 更新文件上传任务成功:', result);
        return result;
      },
      onSuccess: (_, variables) => {
        console.log('🔄 [useProjectTasks] 更新文件上传任务后，更新缓存数据');
        
        // 使无效相关查询，触发重新获取数据
        queryClient.invalidateQueries({
          queryKey: ['fileUploadTask', variables.projectId, variables.stageType]
        });
      }
    });
  
    // Document Extraction Task Operations
    const docxExtractionTaskQuery = (projectId: string, stageType: StageType, options = {}) => useQuery({
      queryKey: ['docxExtractionTask', projectId, stageType],
      queryFn: async () => {
        console.log('🔍 [useProjectTasks] 查询文档提取任务:', { projectId, stageType });
        const result = await TaskApi.getDocxExtractionTask(projectId, stageType);
        console.log('📥 [useProjectTasks] 查询文档提取任务成功:', result);
        return result;
      },
      refetchOnWindowFocus: false,
      staleTime: 0, // 不缓存结果，每次都重新获取最新状态
      gcTime: 5 * 60 * 1000,
      enabled: Boolean(projectId) && Boolean(stageType),
      ...options, // 允许传入额外的配置选项
    });
    
    // // 添加一个专门用于轮询文档提取任务状态的查询
    // const pollDocxExtractionTask = (projectId: string, stageType: StageType) => useQuery({
    //   queryKey: ['docxExtractionTaskPoll', projectId, stageType],
    //   queryFn: async () => {
    //     console.log('🔄 [useProjectTasks] 轮询文档提取任务状态:', { projectId, stageType });
    //     const result = await TaskApi.getDocxExtractionTask(projectId, stageType);
    //     return result;
    //   },
    //   refetchInterval: 2000,
    // //   select: (data) => {
    // //     const shouldStopPolling = data.status !== 'ACTIVE';
    // //     if (shouldStopPolling) {
    // //       // 可以在这里手动停止轮询，例如通过设置 enabled: false
    // //       // 或者在组件中根据这个标志处理
    // //     }
    // //     return data;
    // //   },
    //   refetchOnWindowFocus: false,
    //   staleTime: 0,
    //   enabled: Boolean(projectId) && Boolean(stageType),
    // });


// 修改轮询逻辑，使其更加智能
const pollDocxExtractionTask = (projectId: string, stageType: StageType) => {
  // 使用状态来控制是否启用轮询
  const [shouldPoll, setShouldPoll] = useState<boolean>(false);
  
  const query = useQuery({
    queryKey: ['docxExtractionTaskPoll', projectId, stageType],
    queryFn: async () => {
      console.log('🔄 [useProjectTasks] 轮询文档提取任务状态:', { projectId, stageType });
      const result = await TaskApi.getDocxExtractionTask(projectId, stageType);
      return result;
    },
    refetchInterval: shouldPoll ? 2000 : false, // 根据状态决定是否轮询
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: Boolean(projectId) && Boolean(stageType) && shouldPoll,
    // 当projectId变化时，确保缓存被清除
    gcTime: 0,
  });

  // 当任务状态不是 ACTIVE 时，停止轮询
  useEffect(() => {
    if (query.data && query.data.status !== 'ACTIVE') {
      console.log('🛑 [useProjectTasks] 任务不再处于活动状态，停止轮询');
      setShouldPoll(false);
    } else if (query.data && query.data.status === 'ACTIVE') {
      // 如果状态是ACTIVE，确保轮询已启动
      setShouldPoll(true);
    }
  }, [query.data]);

  // 当projectId变化时，重置轮询状态
  useEffect(() => {
    // 初始检查任务状态，如果是ACTIVE则自动开始轮询
    const checkInitialStatus = async () => {
      if (projectId && stageType) {
        try {
          const result = await TaskApi.getDocxExtractionTask(projectId, stageType);
          if (result && result.status === 'ACTIVE') {
            console.log('▶️ [useProjectTasks] 检测到任务状态为ACTIVE，自动启动轮询');
            setShouldPoll(true);
          }
        } catch (error) {
          console.error('检查初始状态失败:', error);
        }
      }
    };
    
    checkInitialStatus();
    
    // 清理函数
    return () => {
      setShouldPoll(false);
    };
  }, [projectId, stageType]);

  // 提供一个手动启动轮询的方法
  const startPolling = useCallback(() => {
    console.log('▶️ [useProjectTasks] 手动启动轮询');
    setShouldPoll(true);
  }, []);

  // 提供一个手动停止轮询的方法
  const stopPolling = useCallback(() => {
    console.log('⏹️ [useProjectTasks] 手动停止轮询');
    setShouldPoll(false);
  }, []);

  return {
    ...query,
    startPolling,
    stopPolling,
    isPolling: shouldPoll
  };
};



    const updateDocxExtractionTask = useMutation({
      mutationFn: async ({
        projectId,
        stageType,
        status,
        lockStatus,
        tiptapContent,
      }: {
        projectId: string;
        stageType: StageType;
        status?: TaskStatus;
        lockStatus?: TaskLockStatus;
        tiptapContent?: any;
      }) => {
        console.log('📤 [useProjectTasks] 更新文档提取任务:', { projectId, stageType, status, lockStatus });
        
        const taskData: any = {};
        if (status) taskData.status = status;
        if (lockStatus) taskData.lock_status = lockStatus;
        if (tiptapContent !== undefined) taskData.tiptap_content = tiptapContent;
        
        const result = await TaskApi.updateDocxExtractionTask(projectId, stageType, taskData);
        console.log('✅ [useProjectTasks] 更新文档提取任务成功:', result);
        return result;
      },
      onSuccess: (_, variables) => {
        console.log('🔄 [useProjectTasks] 更新文档提取任务后，更新缓存数据');
        
        // 使无效相关查询，触发重新获取数据
        queryClient.invalidateQueries({
          queryKey: ['docxExtractionTask', variables.projectId, variables.stageType]
        });
        queryClient.invalidateQueries({
          queryKey: ['docxExtractionTaskPoll', variables.projectId, variables.stageType]
        });
      }
    });
  
    // Return all task operations
    return {
      // File Upload Tasks
      fileUploadTaskQuery,
      updateFileUploadTask: updateFileUploadTask.mutateAsync,
      
      // Document Extraction Tasks
      docxExtractionTaskQuery,
      pollDocxExtractionTask,
      updateDocxExtractionTask: updateDocxExtractionTask.mutateAsync,
    };
  };