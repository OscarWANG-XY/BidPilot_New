import { useMemo } from 'react';
import { useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { 
  queriesApi, 
  StateStatusResponse, 
  SSEHistoryResponse 
} from '@/_api/project_agent_api/queries_api';

// 定义查询键，用于缓存管理 （以下是社区推荐的最佳实践）
export const queryKeys = {
  all: ['structuring-agent'] as const, // 将数组转为只读的常量， as const是断言为常量
  //...展开父级数组，创建层级结构， 这里展开的结果：['structuring-agent', 'agent-state', 'specific-project-id']
  agentState: (projectId: string) => [...queryKeys.all, 'agent-state', projectId] as const,  
  sseHistory: (projectId: string) => [...queryKeys.all, 'sse-history', projectId] as const,
};

// 定义查询选项类型： 用Omit从UseQueryOptions中移除queryKey和queryFn两个属性，剩下的属性包含：enabled, staleTime, refetchInterval, ...options
type AgentStateQueryOptions = Omit<UseQueryOptions<StateStatusResponse>, 'queryKey' | 'queryFn'>;
type SSEHistoryQueryOptions = Omit<UseQueryOptions<SSEHistoryResponse>, 'queryKey' | 'queryFn'>;

export const useQueries = (
  projectId: string,
  options?: AgentStateQueryOptions,
  sseOptions?: SSEHistoryQueryOptions,
) => {
  // 获取react-query的客户端实例，用于管理和操作缓存数据
  const queryClient = useQueryClient();


  /** -----------------------------------------------
   * 获取代理状态的查询钩子
   * @param projectId 项目ID
   * @param options 额外的查询选项
   * @returns UseQueryResult<StateStatusResponse>
   */
  const agentStateQuery = (): UseQueryResult<StateStatusResponse> => useQuery({
    // 查询键
    queryKey: queryKeys.agentState(projectId),
    // 简洁写法：
    // queryFn: () => queriesApi.getAgentState(projectId),
    
    //需要调试的写法：引入中间变量用于调试
    queryFn: async () => {
      console.log('🔍 开始调用api获取代理状态:', projectId);
      const result = await queriesApi.getAgentState(projectId)
      console.log('🔍 成功获取了代理状态:', result);
      return result
    },

    // 以下配置尽可能减少不必要查询
    enabled: !!projectId, // 只有当projectId存在时才启用查询
    staleTime: 30 * 1000, // 30秒内认为数据是新鲜的
    refetchOnWindowFocus:false, // 当窗口重新获得焦点时(标签页切回来)，不重新获取数据
    refetchOnMount:false, // 当组件挂载时，不重新获取数据
    // refetchInterval: 5 * 1000, // 每5秒自动轮询（适合状态监控）, 但我们使用SSE所以不用轮询
    // notifyOnChangeProps: ['data', 'error', 'isLoading', 'isFetching'], // 用来通知组件重新渲染的依赖项
    ...options,
  });


  /**----------------------------------------------
   * 获取SSE历史记录的查询钩子
   * @param projectId 项目ID
   * @param options 额外的查询选项
   * @returns UseQueryResult<SSEHistoryResponse>
   */
  const sseHistoryQuery = (): UseQueryResult<SSEHistoryResponse> => useQuery({
    queryKey: queryKeys.sseHistory(projectId),

    // 简洁写法：
    // queryFn: () => queriesApi.getSSEHistory(projectId),

    //需要调试的写法：引入中间变量用于调试
    queryFn: async () => {
      console.log('🔍 开始调用api获取SSE历史记录:', projectId);
      const result = await queriesApi.getSSEHistory(projectId)
      console.log('🔍 成功获取了SSE历史记录:', result);
      return result
    },

    // 以下配置尽可能减少不必要查询
    enabled: !!projectId, // 只有当projectId存在时才启用查询
    staleTime: 10 * 1000, // 10秒内认为数据是新鲜的
    refetchOnWindowFocus:false, // 当窗口重新获得焦点时(标签页切回来)，不重新获取数据
    refetchOnMount:false, // 当组件挂载时，不重新获取数据
    // refetchInterval: 10 * 1000, // 每10秒自动重新获取
    // notifyOnChangeProps: ['data', 'error', 'isLoading', 'isFetching'], // 用来通知组件重新渲染的依赖项
    ...sseOptions,
  });



  /** -----------------------------------------------
   * 手动刷新代理状态
   * @param projectId 项目ID
   */
  const refreshAgentState = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.agentState(projectId)
    });
  };


  /** -----------------------------------------------
   * 手动刷新SSE历史记录
   * @param projectId 项目ID
   */
  const refreshSSEHistory = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.sseHistory(projectId)
    });
  };


  /** -----------------------------------------------
   * 清除特定项目的所有缓存
   * @param projectId 项目ID
   */
  const clearProjectCache = () => {
    queryClient.removeQueries({
      queryKey: [...queryKeys.all, projectId]
    });
  };


  // 返回所有查询钩子和操作方法， 不建议使用useMemo，
  return useMemo(() => ({
    // 查询钩子
    
    agentStateQuery,
    sseHistoryQuery,
    
    // 操作方法
    refreshAgentState,
    refreshSSEHistory,
    clearProjectCache,
    
    // 查询键（用于外部访问）
    queryKeys,
  }), [
    queryClient,
    agentStateQuery,
    sseHistoryQuery,
    refreshAgentState,
    refreshSSEHistory,
    clearProjectCache,
  ]);
};

// 导出查询键供其他地方使用
export { queryKeys as structuringAgentQueryKeys };