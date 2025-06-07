// 引用：tanstack query, api, react
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  documentsApi, 
  GetDocumentResponse, 
  UpdateDocumentRequest, 
  UpdateDocumentResponse 
} from '@/_api/structuring_agent_api/documents_api';

// ========================= Query Keys =========================
const queryKeys = {
  all: ['documents'] as const,
  project: (projectId: string) => [...queryKeys.all, projectId] as const,
  document: (projectId: string, docType: string) => 
    [...queryKeys.project(projectId), docType] as const,
  rawDocument: (projectId: string) => 
    queryKeys.document(projectId, 'raw-document'),
  reviewSuggestions: (projectId: string) => 
    queryKeys.document(projectId, 'review-suggestions'),
  finalDocument: (projectId: string) => 
    queryKeys.document(projectId, 'final-document'),
  batchDocuments: (projectId: string, docTypes: string[]) => 
    [...queryKeys.project(projectId), 'batch', docTypes.sort()],
};

// ========================= 类型定义 =========================
export type DocumentType = 'raw-document' | 'review-suggestions' | 'final-document';

interface UseDocumentOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

interface UseUpdateFinalDocumentOptions {
  onSuccess?: (data: UpdateDocumentResponse) => void;
  onError?: (error: Error) => void;
  onMutate?: () => void;
}

// ========================= 新的接口定义 =========================
interface UseDocumentsOptions {
  projectId: string;
  docType?: DocumentType;
  queryOptions?: UseDocumentOptions;
  mutationOptions?: UseUpdateFinalDocumentOptions;
}

// ========================= 重构后的钩子 =========================
export const useDocuments = (options: UseDocumentsOptions) => {
  const { projectId, docType, queryOptions = {}, mutationOptions = {} } = options;
  
  // (1) QueryClient 实例
  const queryClient = useQueryClient();

  // (2) 根据docType直接调用相应的Hook
  const rawDocumentQuery = useQuery({
    queryKey: queryKeys.rawDocument(projectId),
    queryFn: async () => {
      console.log('🔍 开始调用api获取原始文档:', projectId);
      const result = await documentsApi.getRawDocument(projectId)
      console.log('🔍 成功获取了原始文档:', result);
      return result
    },
    enabled: !!projectId && (queryOptions.enabled !== false) && (docType === 'raw-document' || !docType),
    staleTime: queryOptions.staleTime ?? 5 * 60 * 1000, // 5分钟
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnMount: false,
    ...queryOptions,
  });

  const reviewSuggestionsQuery = useQuery({
    queryKey: queryKeys.reviewSuggestions(projectId),
    queryFn: async () => {
      console.log('🔍 开始调用api获取审查建议文档:', projectId);
      const result = await documentsApi.getReviewSuggestions(projectId)
      console.log('🔍 成功获取了审查建议文档:', result);
      return result
    },
    enabled: !!projectId && (queryOptions.enabled !== false) && (docType === 'review-suggestions' || !docType),
    staleTime: queryOptions.staleTime ?? 5 * 60 * 1000, // 5分钟
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnMount: false,
    ...queryOptions,
  });

  const finalDocumentQuery = useQuery({
    queryKey: queryKeys.finalDocument(projectId),
    queryFn: async () => {
      console.log('🔍 开始调用api获取最终文档:', projectId);
      const result = await documentsApi.getFinalDocument(projectId)
      console.log('🔍 成功获取了最终文档:', result);
      return result
    },
    enabled: !!projectId && (queryOptions.enabled !== false) && (docType === 'final-document' || !docType),
    staleTime: queryOptions.staleTime ?? 1 * 60 * 1000, // 1分钟
    refetchOnWindowFocus: queryOptions.refetchOnWindowFocus ?? false,
    refetchOnMount: false,
    ...queryOptions,
  });

  const updateFinalDocumentMutation = useMutation({
    mutationFn: (data: UpdateDocumentRequest) => 
      documentsApi.updateFinalDocument(projectId, data),
    
    onMutate: async (variables) => {
      mutationOptions.onMutate?.();
      
      // 取消相关的查询以避免竞态条件
      await queryClient.cancelQueries({
        queryKey: queryKeys.finalDocument(projectId)
      });
      
      // 获取当前缓存的数据作为快照
      const previousDocument = queryClient.getQueryData(
        queryKeys.finalDocument(projectId)
      );
      
      // 乐观更新：立即更新缓存
      queryClient.setQueryData(
        queryKeys.finalDocument(projectId),
        (old: GetDocumentResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            document: variables.editedDocument,
          };
        }
      );
      
      return { previousDocument };
    },
    
    onSuccess: (data) => {
      // 更新成功后，刷新相关查询
      queryClient.invalidateQueries({
        queryKey: queryKeys.finalDocument(projectId)
      });
      mutationOptions.onSuccess?.(data);
    },
    
    onSettled: () => {
      // 无论成功还是失败，都刷新查询
      queryClient.invalidateQueries({
        queryKey: queryKeys.finalDocument(projectId)
      });
    },
  });

  // (3) 工具方法
  const prefetchDocument = (projectId: string, docType: DocumentType) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.document(projectId, docType),
      queryFn: () => documentsApi.getDocument(projectId, docType),
      staleTime: 5 * 60 * 1000,
    });
  };

  const refreshDocument = (projectId: string, docType?: DocumentType) => {
    if (docType) {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.document(projectId, docType)
      });
    } else {
      return queryClient.invalidateQueries({
        queryKey: queryKeys.project(projectId)
      });
    }
  };

  const refreshAllDocuments = () => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.all
    });
  };

  // (4) 根据docType返回相应的查询结果
  const currentDocumentQuery = useMemo(() => {
    switch (docType) {
      case 'raw-document':
        return rawDocumentQuery;
      case 'review-suggestions':
        return reviewSuggestionsQuery;
      case 'final-document':
      default:
        return finalDocumentQuery;
    }
  }, [rawDocumentQuery, reviewSuggestionsQuery, finalDocumentQuery, docType]);

  // (5) 返回结果
  return useMemo(() => ({
    // 当前文档查询
    currentDocumentQuery,
    
    // 所有查询（用于特定需求）
    rawDocumentQuery,
    reviewSuggestionsQuery,
    finalDocumentQuery,
    
    // 变更方法
    updateFinalDocumentMutation,
    
    // 工具方法
    prefetchDocument,
    refreshDocument,
    refreshAllDocuments,
    
    // Query Keys
    queryKeys,
  }), [
    currentDocumentQuery,
    rawDocumentQuery,
    reviewSuggestionsQuery,
    finalDocumentQuery,
    updateFinalDocumentMutation,
    prefetchDocument,
    refreshDocument,
    refreshAllDocuments,
  ]);
};
