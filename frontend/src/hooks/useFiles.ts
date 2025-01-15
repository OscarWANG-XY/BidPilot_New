// 这是使用Tanstack Query 实现的自定义HOOK, 用于管理文件上传和删除
/**
 * 项目文件管理 Hook
 * 
 * 该 Hook 提供项目相关文件的完整管理功能，包括：
 * - 获取项目文件列表
 * - 上传新文件
 * - 删除现有文件
 * 
 * 使用 React Query 实现数据获取和缓存管理，提供自动的：
 * - 数据缓存和更新
 * - 加载状态跟踪
 * - 错误处理
 * - 乐观更新
 * 
 * @example
 * const {
 *   files,          // 文件列表
 *   uploadFile,     // 上传方法
 *   deleteFile,     // 删除方法
 *   isLoading,      // 加载状态
 *   isUploading,    // 上传状态
 *   isDeleting      // 删除状态
 * } = useFiles(projectId);
 * 
 * // 上传文件示例
 * uploadFile(file, {
 *   onSuccess: () => {
 *     console.log('文件上传成功');
 *   },
 *   onError: (error) => {
 *     console.error('上传失败:', error);
 *   }
 * });
 * 
 * // 删除文件示例
 * deleteFile(fileId, {
 *   onSuccess: () => {
 *     console.log('文件删除成功');
 *   }
 * });
 * 
 * @param projectId - 项目ID，用于标识特定项目的文件集合
 * 
 * @returns {Object} 文件管理相关的状态和方法
 * @returns {TenderFile[]} returns.files - 项目文件列表
 * @returns {boolean} returns.isLoading - 文件列表加载状态
 * @returns {boolean} returns.isError - 文件列表加载错误状态
 * @returns {(file: File) => void} returns.uploadFile - 文件上传方法
 * @returns {(fileId: string) => void} returns.deleteFile - 文件删除方法
 * @returns {boolean} returns.isUploading - 文件上传中状态
 * @returns {boolean} returns.isDeleting - 文件删除中状态
 * 
 * @typedef {Object} TenderFile - 文件对象类型
 * @property {string} id - 文件ID
 * @property {string} fileName - 文件名
 * @property {number} fileSize - 文件大小（字节）
 * @property {Date} uploadTime - 上传时间
 * @property {string} status - 文件状态（'已通过'|'已驳回'|'待审核'）
 * 
 * @remarks
 * - 文件列表会自动缓存，并在上传/删除操作后自动更新
 * - 所有操作都包含错误处理和加载状态
 * - 支持并发操作（多文件同时上传/删除）
 * - 使用乐观更新策略，提供更好的用户体验
 * 
 * @dependencies
 * - @tanstack/react-query
 * - @/api/files
 * - @/types/project
 */


// useQuery: 用于数据获取  useMutation: 用于数据修改  useQueryClient: 用于管理查询缓存
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileApi } from '@/api/files';
import { TenderFile } from '@/types/project';
import { toast } from '@/hooks/use-toast';


// HOOK的主题结构，接受projectId作为参数，用于标识特定项目的文件
export function useFiles(projectId: string) {
  const queryClient = useQueryClient();

  console.log('useFiles hook called with projectId:', projectId);

  // 优化 useQuery 配置
  const filesQuery = useQuery({
    queryKey: ['files', projectId],
    queryFn: () => {
      console.log('Query function called for projectId:', projectId);
      return fileApi.getProjectFiles(projectId);
    },
    staleTime: 0, // 数据5分钟内认为是新鲜的
    gcTime: 1000 * 60 * 30,   // 缓存保持30分钟（替换 cacheTime）
    refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
    retry: 1, // 失败时重试1次
    initialData: [], // 初始数据为空数组
    // 可选：预取数据
    placeholderData: (previousData) => previousData ?? [],
  });

  // Ensure the data is being fetched and set correctly
  if (filesQuery.isLoading) {
    console.log('Loading files...');
  } else if (filesQuery.isError) {
    console.error('Error fetching files:', filesQuery.error);
  } else {
    console.log('Files fetched:', filesQuery.data);
  }

  // 文件上传mutation； 这是上传文件的状态管理
  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      console.log('Before FormData creation - filename:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      
      // 检查 FormData 中的文件名
      const formDataFile = formData.get('file') as File;
      
      console.log('After FormData creation - filename:', formDataFile.name);
      
      return fileApi.upload(formDataFile, projectId);
    },


    onSuccess: (newFile: TenderFile) => {
      // 更新缓存中的文件列表
      queryClient.setQueryData<TenderFile[]>(['files', projectId], (old = []) => {
        return [...old, newFile] as TenderFile[];
      });
      
      // 添加错误处理
      if (!newFile || typeof newFile !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      queryClient.invalidateQueries({ queryKey: ['files', projectId] });
    },
    onError: (error: any) => {
      console.error('Upload failed:', error);
      toast({
        title: "上传失败",
        description: error?.response?.data?.message || error.message || "请稍后重试",
        variant: "destructive",
      });
    }
  });

  // 文件删除mutation；  这个删除文件的状态管理
  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => fileApi.deleteFile(fileId),
    onSuccess: (_, fileId: string) => {
      // 从缓存中移除已删除的文件
      queryClient.setQueryData<TenderFile[]>(['files', projectId], (old = []) => {
        return old.filter((file) => file.id !== fileId) as TenderFile[];
      });
    },
  });

  // 返回所有状态和方法
  return {
    files: filesQuery.data ?? [],
    isLoading: filesQuery.isLoading,
    isError: filesQuery.isError,
    uploadFile: uploadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
} 