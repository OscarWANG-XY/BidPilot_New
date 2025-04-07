// src/hooks/useTestground.ts
import { 
    useQuery, 
    useMutation, 
    useQueryClient,
    UseQueryResult,
    UseMutationResult
  } from '@tanstack/react-query';
  import { TipTap, TipTapInput, tipTapApi } from './tiptap_api';
  

export const useTipTaps = () => {
  // Query keys
  const testgroundKeys = {
    all: ['testgrounds'] as const,
    detail: (id: number) => [...testgroundKeys.all, id] as const,
  };

  // Hooks for fetching testgrounds - GET ALL
  const useTipTapList = (): UseQueryResult<TipTap[], Error> => {
    return useQuery({
      queryKey: testgroundKeys.all,
      queryFn: () => tipTapApi.getAll(),
    });
  };
  
  // Hooks for fetching a single testground - GET BY ID
  const useTipTapDetail = (id: number): UseQueryResult<TipTap, Error> => {
    return useQuery({
      queryKey: testgroundKeys.detail(id),
      queryFn: () => tipTapApi.getById(id),
      enabled: !!id, // Only run the query if we have an ID
    });
  };
  
  // Hooks for mutations - CREATE
  const useTipTapCreate = (): UseMutationResult<
    TipTap,
    Error,
    TipTapInput,
    unknown
  > => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (newTipTap: TipTapInput) => tipTapApi.create(newTipTap),
      onSuccess: () => {
        // Invalidate and refetch the testgrounds list
        queryClient.invalidateQueries({ queryKey: testgroundKeys.all });
      },
    });
  };
  
  // Hooks for mutations - UPDATE
  const useTipTapUpdate = (): UseMutationResult<
    TipTap,
    Error,
    { id: number; data: TipTapInput },
    unknown
  > => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: TipTapInput }) => 
        tipTapApi.update(id, data),
      onSuccess: (data) => {
        // Update cache for this specific item
        queryClient.setQueryData(testgroundKeys.detail(data.id), data);
        // Invalidate the list to ensure it's up to date
        queryClient.invalidateQueries({ queryKey: testgroundKeys.all });
      },
    });
  };
  

  // Hooks for mutations - PARTIAL UPDATE
  const useTipTapPartialUpdate = (): UseMutationResult<
    TipTap,
    Error,
    { id: number; data: Partial<TipTapInput> },
    unknown
  > => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: Partial<TipTapInput> }) => 
        tipTapApi.partialUpdate(id, data),
      onSuccess: (data) => {
        // Update cache for this specific item
        queryClient.setQueryData(testgroundKeys.detail(data.id), data);
        // Invalidate the list to ensure it's up to date
        queryClient.invalidateQueries({ queryKey: testgroundKeys.all });
      },
    });
  };
  

  // Hooks for mutations - DELETE
  const useTipTapDelete = (): UseMutationResult<
    void,
    Error,
    number,
    unknown
  > => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (id: number) => tipTapApi.delete(id),
      onSuccess: (_, id) => {
        // Remove the item from the cache
        queryClient.removeQueries({ queryKey: testgroundKeys.detail(id) });
        // Invalidate the list to ensure it's up to date
        queryClient.invalidateQueries({ queryKey: testgroundKeys.all });
      },
    });
  };

  return {
    useTipTapList,
    useTipTapDetail,
    useTipTapCreate,
    useTipTapUpdate,
    useTipTapPartialUpdate,
    useTipTapDelete
  }
};

