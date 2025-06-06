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

// ========================= 构建钩子类 =========================
export const useDocuments = () => {
  // (1) QueryClient 实例
  const queryClient = useQueryClient();

  // (2) 具体钩子
  const rawDocumentQuery = (projectId: string, options: UseDocumentOptions = {}) => 
    useQuery({
      queryKey: queryKeys.rawDocument(projectId),
      queryFn: () => documentsApi.getRawDocument(projectId),
      enabled: !!projectId && (options.enabled !== false),
      staleTime: options.staleTime ?? 5 * 60 * 1000, // 5分钟
      refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    });

  const reviewSuggestionsQuery = (projectId: string, options: UseDocumentOptions = {}) => 
    useQuery({
      queryKey: queryKeys.reviewSuggestions(projectId),
      queryFn: () => documentsApi.getReviewSuggestions(projectId),
      enabled: !!projectId && (options.enabled !== false),
      staleTime: options.staleTime ?? 5 * 60 * 1000, // 5分钟
      refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    });

  const finalDocumentQuery = (projectId: string, options: UseDocumentOptions = {}) => 
    useQuery({
      queryKey: queryKeys.finalDocument(projectId),
      queryFn: () => documentsApi.getFinalDocument(projectId),
      enabled: !!projectId && (options.enabled !== false),
      staleTime: options.staleTime ?? 1 * 60 * 1000, // 1分钟
      refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    });

  const documentQuery = (
    projectId: string,
    docType: DocumentType,
    options: UseDocumentOptions = {}
  ) => 
    useQuery({
      queryKey: queryKeys.document(projectId, docType),
      queryFn: () => documentsApi.getDocument(projectId, docType),
      enabled: !!projectId && !!docType && (options.enabled !== false),
      staleTime: options.staleTime ?? 5 * 60 * 1000, // 5分钟
      refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    });

  const batchDocumentsQuery = (
    projectId: string, 
    docTypes: DocumentType[],
    options: UseDocumentOptions = {}
  ) => 
    useQuery({
      queryKey: queryKeys.batchDocuments(projectId, docTypes),
      queryFn: async () => {
        const results = await Promise.all(
          docTypes.map(docType => documentsApi.getDocument(projectId, docType))
        );
        
        return docTypes.reduce((acc, docType, index) => {
          acc[docType] = results[index];
          return acc;
        }, {} as Record<DocumentType, GetDocumentResponse>);
      },
      enabled: !!projectId && docTypes.length > 0 && (options.enabled !== false),
      staleTime: options.staleTime ?? 5 * 60 * 1000,
      refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    });

  const updateFinalDocumentMutation = (
    projectId: string,
    options: UseUpdateFinalDocumentOptions = {}
  ) => 
    useMutation({
      mutationFn: (data: UpdateDocumentRequest) => 
        documentsApi.updateFinalDocument(projectId, data),
      
      onMutate: async (variables) => {
        options.onMutate?.();
        
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
      
    //   onError: (error, context) => {
    //     // 如果更新失败，回滚到之前的数据
    //     if (context?.previousDocument) {
    //       queryClient.setQueryData(
    //         queryKeys.finalDocument(projectId),
    //         context.previousDocument
    //       );
    //     }
    //     options.onError?.(error);
    //   },
      
      onSuccess: (data) => {
        // 更新成功后，刷新相关查询
        queryClient.invalidateQueries({
          queryKey: queryKeys.finalDocument(projectId)
        });
        options.onSuccess?.(data);
      },
      
      onSettled: () => {
        // 无论成功还是失败，都刷新查询
        queryClient.invalidateQueries({
          queryKey: queryKeys.finalDocument(projectId)
        });
      },
    });

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

  // (3) 返回便捷方法
  return useMemo(() => ({
    // 查询方法
    rawDocumentQuery,
    reviewSuggestionsQuery,
    finalDocumentQuery,
    documentQuery,
    batchDocumentsQuery,
    
    // 变更方法
    updateFinalDocumentMutation,
    
    // 工具方法
    prefetchDocument,
    refreshDocument,
    refreshAllDocuments,
    
    // Query Keys
    queryKeys,
  }), [
    queryClient,
    rawDocumentQuery,
    reviewSuggestionsQuery,
    finalDocumentQuery,
    documentQuery,
    batchDocumentsQuery,
    updateFinalDocumentMutation,
    prefetchDocument,
    refreshDocument,
    refreshAllDocuments,
  ]);
};