import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    StructuringActionsApi,
    StartAnalysisRequest,
    StartAnalysisResponse,
    RetryAnalysisRequest,
    RetryAnalysisResponse
} from '@/_api/project_agent_api/actions_api';

// ------------- Query Keys -------------
export const STRUCTURING_ACTIONS_KEYS = {
    all: ['structuring-actions'] as const,
    startAnalysis: (projectId: string) => [...STRUCTURING_ACTIONS_KEYS.all, 'start-analysis', projectId] as const,
    retryAnalysis: () => [...STRUCTURING_ACTIONS_KEYS.all, 'retry-analysis'] as const,
} as const;

// ------------- Mutation Hooks -------------

/**
 * 开始分析的 mutation hook
 * 用于用户上传文件后点击分析按钮触发分析流程
 */
export const useStartAnalysis = () => {
    const queryClient = useQueryClient();
    
    return useMutation<
        StartAnalysisResponse,
        Error,
        { projectId: string; requestData?: StartAnalysisRequest }
    >({
        mutationFn: ({ projectId, requestData = {} }) => 
            StructuringActionsApi.startAnalysis(projectId, requestData),
        onSuccess: (data, variables) => {
            console.log('✅ [Hook] 开始分析成功:', data);
            
            // 可以根据需要在这里更新相关的查询缓存
            // 例如更新项目状态查询
            queryClient.invalidateQueries({
                queryKey: ['structuring-state', variables.projectId]
            });
        },
        onError: (error) => {
            console.error('❌ [Hook] 开始分析失败:', error);
        },
    });
};

/**
 * 重试分析的 mutation hook
 * 用于当流程出现错误时，用户可以点击重新开始
 */
export const useRetryAnalysis = () => {
    const queryClient = useQueryClient();
    
    return useMutation<
        RetryAnalysisResponse,
        Error,
        RetryAnalysisRequest
    >({
        mutationFn: (requestData) => 
            StructuringActionsApi.retryAnalysis(requestData),
        onSuccess: (data, variables) => {
            console.log('✅ [Hook] 重试分析成功:', data);
            
            // 重试成功后，刷新相关的查询缓存
            queryClient.invalidateQueries({
                queryKey: ['structuring-state', variables.projectId]
            });
            
            // 也可以刷新其他相关查询
            queryClient.invalidateQueries({
                queryKey: STRUCTURING_ACTIONS_KEYS.all
            });
        },
        onError: (error) => {
            console.error('❌ [Hook] 重试分析失败:', error);
        },
    });
};

// ------------- 复合 Hooks (可选) -------------

/**
 * 提供所有分析相关操作的复合 hook
 * 方便在组件中统一使用
 */
export const useStructuringActions = () => {
    const startAnalysis = useStartAnalysis();
    const retryAnalysis = useRetryAnalysis();
    
    return {
        startAnalysis,
        retryAnalysis,
        
        // 便捷的状态检查
        isAnyLoading: startAnalysis.isPending || retryAnalysis.isPending,
        isStartingAnalysis: startAnalysis.isPending,
        isRetryingAnalysis: retryAnalysis.isPending,
    };
};

// ------------- 类型导出 -------------
export type UseStartAnalysisReturn = ReturnType<typeof useStartAnalysis>;
export type UseRetryAnalysisReturn = ReturnType<typeof useRetryAnalysis>;
export type UseStructuringActionsReturn = ReturnType<typeof useStructuringActions>;
