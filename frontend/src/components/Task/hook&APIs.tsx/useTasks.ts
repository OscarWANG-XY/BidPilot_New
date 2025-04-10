import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskApi } from './tasksApi';
import type { Type_TaskDetail, Type_TaskUpdate } from './tasksApi';
import type { StageType } from '@/types/projects_dt_stru/projectStage_interface';
import { TaskStatus } from './tasksApi';
import { useCallback } from 'react';

export const useTasks = () => {
  const queryClient = useQueryClient();
  
  // 任务查询 Hook
  // 调用的组件首次加载会触发useTaskData的查询（浏览器刷新相当于首次加载）
  // projectId 或者 stageType 变化时会触发重新查询，因为它们queryKey的一部分。 
  // 当任务处于ANALYZING时，每秒查询一次
  // 当有手动调用invalidateQueries: 时，会触发重新查询。 

  const useTaskData = (
    projectId: string, 
    stageType: StageType, 
    options = {}
  ) => {
    return useQuery({
      queryKey: ['tasks', projectId, stageType],
      queryFn: async () => {
        const result = await TaskApi.getTask(projectId, stageType);
        return result as Type_TaskDetail;
      },
      
      // 仅在任务处于分析中状态时进行轮询
      refetchInterval: (query) => {
        return query.state.data?.status === TaskStatus.PROCESSING ? 1000 : false;
      },
      refetchOnWindowFocus: false,   // 窗口获得焦点时，不会触发查询
      staleTime: 0,   //这里将数据立即标记过时，这样的化，确保组件重新刷新时，也触发重新查询，而不是使用缓存数据。 （queryKey变化，手动时效，refectch触发等场景受过时条件约束，都是直接触发查询） 
      gcTime: 5 * 60 * 1000,   //表示数据5分钟类有效
      enabled: Boolean(projectId) && Boolean(stageType),  //查询有效的条件，如有任何一个不满足，查询被禁用。
      ...options, //需要放在最后，这样组件传递过来的同属性值，会覆盖掉之前的。 可以补充的属性，比如：{onSuccess: (data) => {console.log(data)}} 
    });
  };

  // 更新任务状态
  const updateTaskStatus = useMutation({
    mutationFn: async ({
      projectId,
      stageType,
      status,
      docxTiptap,
      context,
      prompt,
      companyInfo,
      finalResult
    }: {
      projectId: string;
      stageType: StageType;
      status: TaskStatus;
      docxTiptap?: string;
      context?: string;
      prompt?: string;
      companyInfo?: string;
      finalResult?: string;
    }) => {
      const taskData: Partial<Type_TaskUpdate> = {
        status
      };
      
      if (docxTiptap !== undefined) {
        taskData.docxTiptap = typeof docxTiptap === 'string' ? docxTiptap : JSON.stringify(docxTiptap);
      }
      if (context !== undefined) {
        taskData.context = typeof context === 'string' ? context : JSON.stringify(context);
      }
      if (prompt !== undefined) {
        taskData.prompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
      }
      if (companyInfo !== undefined) {
        taskData.companyInfo = typeof companyInfo === 'string' ? companyInfo : JSON.stringify(companyInfo);
      }
      if (finalResult !== undefined) {
        taskData.finalResult = typeof finalResult === 'string' ? finalResult : JSON.stringify(finalResult);
      }
      
      return await TaskApi.updateTask(projectId, stageType, taskData as Type_TaskUpdate);
    },
    onSuccess: (_, { projectId, stageType }) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', projectId, stageType]
      });
    }
  });


  // ------------ CONFIGURING状态 处理钩子 ------------
  // 加载配置
  const loadConfig = useCallback((
    projectId: string,
    stageType: StageType,
  ) => {
  // 简单地使缓存失效，触发重新查询
    return queryClient.invalidateQueries({
      queryKey: ['tasks', projectId, stageType]
    });
  }, [queryClient]);


  // 保存当前配置
  const saveConfig = useCallback((
    projectId: string,
    stageType: StageType,
    context: string,
    prompt: string,
    companyInfo: any,
  ) => {
    return updateTaskStatus.mutateAsync({
      projectId,
      stageType,
      status: TaskStatus.CONFIGURING,
      context, 
      prompt,
      companyInfo,
    });
  }, [updateTaskStatus]);

  // 提供任务状态流转的便捷方法
  const startAnalysis = useCallback((
    projectId: string, 
    stageType: StageType, 
  ) => {
    return updateTaskStatus.mutateAsync({
      projectId,
      stageType,
      status: TaskStatus.PROCESSING,
    });
  }, [updateTaskStatus]);



  // ------------ ANALYZING状态 处理钩子 ------------

        //在这里不保留钩子，TerminateAnalysis的钩子放在了useStreaming.tsx中
    const startReview = useCallback((
      projectId: string, 
      stageType: StageType, 
    ) => {
      return updateTaskStatus.mutateAsync({
        projectId,
        stageType,
        status: TaskStatus.REVIEWING,
      });
    }, [updateTaskStatus]);



  // ------------ REVIEWING状态 处理钩子 ------------





  const acceptResult = useCallback((
    projectId: string,
    stageType: StageType,
    //originalResult: string    
    // 说明： 我们不传入streamResult, 而是发起状态变更，然后在后端将streamResult转为TiptapJSON格式，存储在finalResult中。 
  ) => {
    return updateTaskStatus.mutateAsync({
      projectId,
      stageType,
      status: TaskStatus.COMPLETED,
      //finalResult: originalResult
    });
  }, [updateTaskStatus]);

  const saveEditedResult = useCallback((
    projectId: string, 
    stageType: StageType,
    finalResult: string
  ) => {
    return updateTaskStatus.mutateAsync({
      projectId,
      stageType,
      status: TaskStatus.COMPLETED,
      finalResult
    });
  }, [updateTaskStatus]);


  // ------------ COMPLETED状态 处理钩子 ------------
  const resetTask = useCallback((
    projectId: string, 
    stageType: StageType
  ) => {
    return updateTaskStatus.mutateAsync({
      projectId,
      stageType,
      status: TaskStatus.CONFIGURING,
    });
  }, [updateTaskStatus]);
  


  // 返回 Hook API
  return {
    // 基础查询
    useTaskData,

    // 基础更新
    updateTaskStatus: updateTaskStatus.mutateAsync,
    isUpdating: updateTaskStatus.isPending,

    // --- CONFIGURING状态 数据处理快捷钩子 -------
    loadConfig,
      // 纯UI方法 editConfig, 不放在useLLMTasks中, 而在LLMTaskContainer.tsx中 
      // 纯UI方法 cancelEditConfig, 不放在useLLMTasks中, 而在LLMTaskContainer.tsx中 
    saveConfig,
    startAnalysis,

    // --- ANALYZING状态 数据处理快捷钩子 （在useStreaming.tsx中）-------
    startReview,

    // --- REVIEWING状态 数据处理快捷钩子 -------
 
    acceptResult,
    saveEditedResult,

    // --- COMPLETED状态 数据处理快捷钩子 -------
    resetTask,

  };
};