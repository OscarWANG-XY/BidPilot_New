// 引用：tanstack query, api, react
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  documentsApi, 
  GetDocumentResponse, 
  UpdateDocumentRequest, 
  UpdateDocumentResponse 
} from '@/_api/project_agent_api/documents_api';


// ========================= Query Keys =========================
const queryKeys = {
  all: ['documents'] as const,
  project: (projectId: string) => [...queryKeys.all, projectId] as const,
  document: (projectId: string, keyName: string) => 
    [...queryKeys.project(projectId), keyName] as const,
};

interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

interface MutationOptions {
  onSuccess?: (data: UpdateDocumentResponse) => void;
  onError?: (error: Error) => void;
  onMutate?: () => void;
}

// ========================= 新的接口定义 =========================
interface UseDocumentsOptions {
  projectId: string;
  keyName?: string;
  queryOptions?: QueryOptions;
  mutationOptions?: MutationOptions;
}

// ========================= 重构后的钩子 =========================
export const useDocuments = (options: UseDocumentsOptions) => {

  // 注意，以下赋值，只是默认值，如果没有传参进来，会取默认值。 
  const { projectId, keyName="", queryOptions = {}, mutationOptions = {} } = options;
  
  // (1) QueryClient 实例
  const queryClient = useQueryClient();

  // (2) 根据key_name直接调用相应的Hook
  const documentQuery = useQuery({
    queryKey: queryKeys.document(projectId, keyName),
    queryFn: async () => {
      console.log('🔍 开始调用api获取文档:', projectId, keyName);
      const result = await documentsApi.getDocument(projectId, keyName)
      console.log('🔍 成功获取了文档:', result);
      const content = result.content;
      return content
    },
    enabled: !!projectId && !!keyName && (queryOptions.enabled !== false),
    staleTime: queryOptions.staleTime ?? 5 * 60 * 1000, // 5分钟
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnMount: false,
    ...queryOptions,
  });

  const updateDocumentMutation = useMutation({
    mutationFn: (data: UpdateDocumentRequest) => 
      documentsApi.updateDocument(projectId, keyName, data),
    
    onMutate: async (variables) => {
      mutationOptions.onMutate?.();
      
      // 取消相关的查询以避免竞态条件
      await queryClient.cancelQueries({
        queryKey: queryKeys.document(projectId, keyName)
      });
      
      // 获取当前缓存的数据作为快照
      const previousDocument = queryClient.getQueryData(
        queryKeys.document(projectId, keyName)
      );
      
      // 乐观更新：立即更新缓存
      queryClient.setQueryData(
        queryKeys.document(projectId, keyName),
        (old: GetDocumentResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            content: variables.editedContent,
          };
        }
      );
      
      return { previousDocument };
    },
    
    onSuccess: (data) => {
      // 更新成功后，刷新相关查询
      queryClient.invalidateQueries({
        queryKey: queryKeys.document(projectId, keyName)
      });
      mutationOptions.onSuccess?.(data);
    },
    
    onError: (error, context: any) => {
      // 发生错误时，回滚到之前的数据
      if (context?.previousDocument) {
        queryClient.setQueryData(
          queryKeys.document(projectId, keyName),
          context.previousDocument
        );
      }
      mutationOptions.onError?.(error);
    },
    
    onSettled: () => {
      // 无论成功还是失败，都刷新查询
      queryClient.invalidateQueries({
        queryKey: queryKeys.document(projectId, keyName)
      });
    },
  });

  // 辅助方法
  const refreshDocument = (targetProjectId?: string, targetKeyName?: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.document(targetProjectId || projectId, targetKeyName || keyName)
    });
  };

  const refreshAllDocuments = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.all
    });
  };

  const prefetchDocument = (targetProjectId: string, targetKeyName: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.document(targetProjectId, targetKeyName),
      queryFn: () => documentsApi.getDocument(targetProjectId, targetKeyName),
      staleTime: 5 * 60 * 1000,
    });
  };

  // (5) 返回结果
  return useMemo(() => ({
    // 查询
    documentQuery,
    
    // 变更方法
    updateDocumentMutation,
    
    // 辅助方法
    refreshDocument,
    refreshAllDocuments,
    prefetchDocument,
    
    // Query Keys
    queryKeys,
  }), [
    documentQuery,
    updateDocumentMutation,
    projectId,
    keyName,
  ]);
};
