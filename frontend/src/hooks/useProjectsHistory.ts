import { useQuery } from '@tanstack/react-query';
import { changeHistoryApi } from '@/api/projects_api';
import { 
  ChangeHistoryQueryParams
} from '@/types/projects_dt_stru';

export const useChangeHistory = () => {
  // 获取项目变更历史
  const projectChangeHistoryQuery = (params?: ChangeHistoryQueryParams) => useQuery({
    queryKey: ['projectChangeHistory', params],
    queryFn: async () => {
      console.log('🔍 [useChangeHistory] 查询项目变更历史:', params);
      const result = await changeHistoryApi.getProjectChangeHistory(params);
      console.log('📥 [useChangeHistory] 查询项目变更历史:', result);
      return result;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,  // 30秒后数据变为陈旧
    gcTime: 5 * 60 * 1000  // 5分钟后清除缓存
  });

  // 获取单个项目变更历史详情
  const singleProjectChangeHistoryQuery = (historyId: string) => useQuery({
    queryKey: ['projectChangeHistory', historyId],
    queryFn: async () => {
      console.log('🔍 [useChangeHistory] 查询单个项目变更历史:', historyId);
      const result = await changeHistoryApi.getProjectChangeHistoryById(historyId);
      console.log('📥 [useChangeHistory] 查询单个项目变更历史:', result);
      return result;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000  // 5分钟后数据变为陈旧
  });

  // 获取阶段变更历史
  const stageChangeHistoryQuery = (params?: ChangeHistoryQueryParams) => useQuery({
    queryKey: ['stageChangeHistory', params],
    queryFn: async () => {
      console.log('🔍 [useChangeHistory] 查询阶段变更历史:', params);
      const result = await changeHistoryApi.getStageChangeHistory(params);
      console.log('📥 [useChangeHistory] 查询阶段变更历史:', result);
      return result;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000
  });

  // 获取单个阶段变更历史详情
  const singleStageChangeHistoryQuery = (historyId: string) => useQuery({
    queryKey: ['stageChangeHistory', historyId],
    queryFn: async () => {
      console.log('🔍 [useChangeHistory] 查询单个阶段变更历史:', historyId);
      const result = await changeHistoryApi.getStageChangeHistoryById(historyId);
      console.log('📥 [useChangeHistory] 查询单个阶段变更历史:', result);
      return result;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  // 获取任务变更历史
  const taskChangeHistoryQuery = (params?: ChangeHistoryQueryParams) => useQuery({
    queryKey: ['taskChangeHistory', params],
    queryFn: async () => {
      console.log('🔍 [useChangeHistory] 查询任务变更历史:', params);
      const result = await changeHistoryApi.getTaskChangeHistory(params);
      console.log('📥 [useChangeHistory] 查询任务变更历史:', result);
      return result;
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000
  });

  // 获取单个任务变更历史详情
  const singleTaskChangeHistoryQuery = (historyId: string) => useQuery({
    queryKey: ['taskChangeHistory', historyId],
    queryFn: async () => {
      console.log('🔍 [useChangeHistory] 查询单个任务变更历史:', historyId);
      const result = await changeHistoryApi.getTaskChangeHistoryById(historyId);
      console.log('📥 [useChangeHistory] 查询单个任务变更历史:', result);
      return result;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  return {
    // 项目变更历史查询
    projectChangeHistoryQuery,
    singleProjectChangeHistoryQuery,
    
    // 阶段变更历史查询
    stageChangeHistoryQuery,
    singleStageChangeHistoryQuery,
    
    // 任务变更历史查询
    taskChangeHistoryQuery,
    singleTaskChangeHistoryQuery
  };
};