import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskApi } from './tasksApi';
import type { Type_TaskDetail, Type_TaskUpdate } from './tasksApi';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import { TaskStatus } from './tasksApi';
import { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface';
import { useCallback, useMemo } from 'react';

export const useTasks = (
  projectId: string, 
  stageType: StageType, 
  taskType: TaskType
) => {
  const queryClient = useQueryClient();
  
  // 任务查询 - 现在这部分直接集成到钩子内部
  const taskQuery = useQuery({
    queryKey: ['tasks', projectId, stageType, taskType],
    queryFn: async () => {
      try{
        const result = await TaskApi.getTask(projectId, stageType, taskType);
        return result as Type_TaskDetail;
      }catch(error){
        // 捕获并保存错误状态
        console.error('任务查询出错:', error);
        throw error; // 重新抛出错误，让 React Query 处理
      }
    },
    
    // 仅在任务处于分析中状态时进行轮询
    refetchInterval: (query) => {
      if(query.state.error) return false
      return query.state.data?.status === TaskStatus.PROCESSING ? 1000 : false;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    enabled: Boolean(projectId) && Boolean(stageType) && Boolean(taskType),
    retry: 3, //限制重试次数，避免无限重试 
  });

  // 更新任务状态
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      status,
      context,
      prompt,
      relatedCompanyInfo,
      finalResult
    }: {
      status?: TaskStatus;
      context?: string;
      prompt?: string;
      relatedCompanyInfo?: string;
      finalResult?: string;
    }) => {
      const taskData: Partial<Type_TaskUpdate> = {status};
      
      if (context !== undefined) {
        taskData.context = typeof context === 'string' ? context : JSON.stringify(context);
      }
      if (prompt !== undefined) {
        taskData.prompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
      }
      if (relatedCompanyInfo !== undefined) {
        taskData.relatedCompanyInfo = typeof relatedCompanyInfo === 'string' ? relatedCompanyInfo : JSON.stringify(relatedCompanyInfo);
      }
      if (finalResult !== undefined) {
        taskData.finalResult = typeof finalResult === 'string' ? finalResult : JSON.stringify(finalResult);
      }
      
      return await TaskApi.updateTask(projectId, stageType, taskType, taskData as Type_TaskUpdate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', projectId, stageType, taskType]
      });
    }
  });

  // ------------ CONFIGURING状态 处理钩子 ------------
  // 加载配置
  const loadConfig = useCallback(() => {
    return TaskApi.loadConfig(projectId, stageType, taskType)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ['tasks', projectId, stageType, taskType]
        });
      });
  }, [projectId, stageType, taskType, queryClient]);

  // 保存当前配置
  const saveConfig = useCallback((
    context: string,
    prompt: string,
    relatedCompanyInfo: any,
  ) => {
    return TaskApi.saveConfig(projectId, stageType, taskType, {
      context,
      prompt,
      relatedCompanyInfo
    }).then(() => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', projectId, stageType, taskType]
      });
    });
  }, [projectId, stageType, taskType, queryClient]);

  // 开始分析
  const startAnalysis = useCallback(() => {
    return TaskApi.startAnalysis(projectId, stageType, taskType)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ['tasks', projectId, stageType, taskType]
        });
      });
  }, [projectId, stageType, taskType, queryClient]);

  // ------------ ANALYZING状态 处理钩子 ------------
  const startReview = useCallback(() => {
    return TaskApi.startReview(projectId, stageType, taskType)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ['tasks', projectId, stageType, taskType]
        });
      });
  }, [projectId, stageType, taskType, queryClient]);

  // ------------ REVIEWING状态 处理钩子 ------------
  const acceptResult = useCallback(() => {
    return TaskApi.acceptResult(projectId, stageType, taskType)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ['tasks', projectId, stageType, taskType]
        });
      });
  }, [projectId, stageType, taskType, queryClient]);

  const saveEditedResult = useCallback((finalResult: string) => {
    return TaskApi.saveEditedResult(projectId, stageType, taskType, {
      finalResult
    }).then(() => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', projectId, stageType, taskType]
      });
    });
  }, [projectId, stageType, taskType, queryClient]);

  // ------------ COMPLETED状态 处理钩子 ------------
  const resetTask = useCallback(() => {
    return TaskApi.resetTask(projectId, stageType, taskType)
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ['tasks', projectId, stageType, taskType]
        });
      });
  }, [projectId, stageType, taskType, queryClient]);

  // 返回 Hook API - 使用 useMemo 优化性能
  return useMemo(() => ({
    // 任务数据和状态
    taskData: taskQuery.data,
    isLoading: taskQuery.isLoading,
    isError: taskQuery.isError,
    error: taskQuery.error,


    // 添加重置错误状态的方法 （手动重新尝试时调用）
    resetError: () => {
    if (taskQuery.error) {
      // 重置错误状态
      queryClient.resetQueries({
        queryKey: ['tasks', projectId, stageType, taskType],
        exact: true
      });
    }
  },
    
    // 更新方法
    updateTask: updateTaskMutation.mutateAsync,
    isUpdating: updateTaskMutation.isPending,
    
    // CONFIGURING状态 方法
    loadConfig,
    saveConfig,
    startAnalysis,
    
    // ANALYZING状态 方法
    startReview,
    
    // REVIEWING状态 方法
    acceptResult,
    saveEditedResult,
    
    // COMPLETED状态 方法
    resetTask,
  }), [
    taskQuery.data,
    taskQuery.isLoading,
    taskQuery.isError,
    taskQuery.error,
    updateTaskMutation.mutateAsync,
    updateTaskMutation.isPending,
    loadConfig,
    saveConfig,
    startAnalysis,
    startReview,
    acceptResult,
    saveEditedResult,
    resetTask
  ]);
};