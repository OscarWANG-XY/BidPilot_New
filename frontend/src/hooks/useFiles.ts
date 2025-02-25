// useQuery: 用于数据获取  useMutation: 用于数据修改  useQueryClient: 用于管理查询缓存
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileApi } from '@/api/files_api';
import { FileRecord } from '@/types/files_dt_stru';
import { toast } from '@/hooks/use-toast';


// ================================ 文件上传管理 hook  ============================================ 
// useFiles 是自定义的HOOKS，用来返回与文件相关的数据 和 操作函数。
export function useFiles() {

  // 获取react-query的客户端实例，用于管理和操作缓存数据， 上传成功时会用到
  //
  const queryClient = useQueryClient();
  console.log('🔄 [useFiles.ts] 初始化 useFiles hook');

  // ---------------查询文件的Query管理 --------------- 
  const filesQuery = useQuery({
    // 缓存的唯一标识符，在useQuery被初始化时配置。 
    queryKey: ['fileskey'], 
    // 查询函数，返回所有文件，然后放进缓存。
    // 直到缓存数据被判定过期，否则新的API请求不会被触发，而是直接调用缓存数据。
    queryFn: async () => {
      console.log('📥 [useFiles.ts] 开始获取所有文件');
      const result = await fileApi.getAllFiles();
      console.log('📦 [useFiles.ts] 获取文件结果:', result);
      return result;
    },

    //其他关于缓存的配置参数
    staleTime: 1000 * 60 * 5, // 有效/新鲜的时间，例如 1000 * 60 * 5 是5分钟
    gcTime: 1000 * 60 * 30,   // 缓存保持时间（替换 cacheTime），例如 1000 * 60 * 30 是30分钟
    refetchOnWindowFocus: false, // 窗口聚焦时重新请求
    retry: 1, // 失败时重试1次
    //initialData: [], // 初始数据为空数组
    // 可选：用placeholderData预取数据
    //placeholderData: (previousData) => previousData ?? [],
  });

  // Ensure the data is being fetched and set correctly
  if (filesQuery.isLoading) {
    console.log('⏳ [useFiles.ts] 文件加载中...');
  } else if (filesQuery.isError) {
    console.error('❌ [useFiles.ts] 获取文件失败:', {
      error: filesQuery.error,
      message: filesQuery.error instanceof Error ? filesQuery.error.message : '未知错误'
    });
  } else {
    console.log('✅ [useFiles.ts] 文件获取成功:', {
      fileCount: filesQuery.data?.length,
      cacheStatus: filesQuery.status
    });
  }


  // ----------- 上传文件的Query管理 （done check!） -------------
  const uploadMutation = useMutation({

    // 上传文件的Mutation函数, 参数file是从用户选择上传的文件对象, 是browser的File类型
    mutationFn: (inputfile: File) => {
      console.log('📤 [useFiles.ts] 开始上传文件:', {
        fileName: inputfile.name,
        fileSize: inputfile.size,
        fileType: inputfile.type
      });
      // 调用fileApi.upload上传文件
      return fileApi.uploadFile(inputfile);
    },

    // newFile是上传成功后服务器返回的文件信息(FileRecord类型)给到mutationFn, 不是文件对象本身（与file不同）
    // mutationFn将服务器返回的结果，再给到onSuccess. 
    // 注意：在组件末尾，返回的uploadFile函数，使用.mutate()，本身不返回promise对象; 如果需要返回promise对象，则需要使用.mutateAsync()
    onSuccess: (newFile: FileRecord) => {
      console.log('✅ [useFiles.ts] 文件上传成功:', {
        fileId: newFile.id,
        fileName: newFile.name
      });

      // 在queryClient中设置缓存数据，与useQuery中的filesQuery的缓存数据是同一个
      // 使用.setQueryData()方法，参数1是缓存唯一标识符，参数2是回调函数，用于更新缓存数据
      console.log('💾 [useFiles.ts] 更新缓存数据 - 添加新文件');
      queryClient.setQueryData<FileRecord[]>(
        // 缓存的唯一标识符，在useQuery被初始化时配置。 
        ['fileskey'], 
        // 以下是回调函数，用于更新缓存数据，
        // 缓存数据是响应式的，所有调用它的组件都会自动更新。
        // 同时，这个更新会让缓存时间刷新，造成需要下一次过期，才会重新请求API。
        // 于是需要之后的手动invalidateQeueries处理。
        // 而以下上传的文件信息放入缓存的另外一个作用是让客户没有明显的等待时间。
        // 但这会有极度短暂的不一致 
        (old = []) => {
          const newData = [...old, newFile];
          console.log('📊 [useFiles.ts] 缓存更新结果:', {
            oldCount: old.length,
            newCount: newData.length
          });
          return newData;
        }
      );
      // 手动让缓存数据过期，然后重新请求API
      // 只有这样，上传后的缓存数据与服务器的数据才会一致。
      console.log('🔄 [useFiles.ts] 使缓存失效，准备重新获取数据');
      queryClient.invalidateQueries({ queryKey: ['fileskey'] });
    },

    onError: (error: any) => {
      console.error('❌ [useFiles.ts]  上传失败:', {
        error,
        response: error?.response?.data,
        message: error?.response?.data?.message || error.message
      });
      toast({
        title: "上传失败",
        description: error?.response?.data?.message || error.message || "请稍后重试",
        variant: "destructive",
      });
    }
  });

  // ----------- 修改删除 mutation (done check!)-------------
  const deleteMutation = useMutation({
    // 删除文件的Mutation函数, fileIds作为参数传入，调用fileApi.deleteFile向服务器发出删除请求。
    mutationFn: (fileIds: string | string[]) => {
      const ids = Array.isArray(fileIds) ? fileIds : [fileIds];
      console.log('🗑️ [useFiles.ts] 开始删除文件:', ids);
      // 使用 Promise.all 并行删除多个文件
      return Promise.all(ids.map(id => fileApi.deleteFile(id)));
    },

    // 修改成功处理逻辑, 从缓存中移除已删除的文件
    // 第一个参数是缓存标识符queryKey, 第二个是回调函数()=>{}, old作为传参, 默认为[]    
    // 修正类型定义，response 是后端响应数组
    onSuccess: (response: any[], fileIds: string | string[]) => {
      const ids = Array.isArray(fileIds) ? fileIds : [fileIds];
      console.log('✅ [useFiles.ts] 文件删除成功:', {
        ids,
        response
      });

      queryClient.setQueryData<FileRecord[]>(
        // 缓存的唯一标识符，在useQuery被初始化时配置。 
        ['fileskey'], 
        // 回调函数，用于更新缓存数据（通过.filter()返回一个新数组，新数组中不包含已删除的文件）
        // (file) => file.id !== fileId 是过滤条件，它会遍历old数组里的每一个file, 如果file.id不等于fileId, 则保留file, 否则删除file
      //  (old = []) => old.filter((file) => file.id !== fileId)
      //);

        (old = []) => {
          const newData = old.filter((file) => !ids.includes(file.id));
          console.log('📊 [useFiles.ts] 缓存更新结果:', {
            oldCount: old.length,
            newCount: newData.length,
            removedFileIds: ids
          });
          return newData;
        }
      );


      // 手动让缓存数据过期，然后重新请求API
      // 只有这样，上传后的缓存数据与服务器的数据才会一致。
      console.log('🔄 [useFiles.ts] 使缓存失效，准备重新获取数据');
      queryClient.invalidateQueries({ queryKey: ['fileskey'] });
    },

    onError: (error: any) => {
      console.error('❌ [useFiles.ts] 删除失败:', {
        error,
        response: error?.response?.data,
        message: error?.response?.data?.message || error.message
      });
      toast({
        title: "删除失败",
        description: error?.response?.data?.message || error.message || "请稍后重试",
        variant: "destructive",
      });
    }
  });

  // 添加获取单个文件详情的 Query hook
  const useFileDetail = (fileId: string, presigned: boolean = false) => {
    return useQuery({
      // 使用数组作为 queryKey，包含文件ID和presigned参数
      queryKey: ['file', fileId, presigned],
      queryFn: async () => {
        console.log('📥 [useFiles.ts] 开始获取文件详情:', { fileId, presigned });
        const result = await fileApi.getFileDetail(fileId, presigned);
        console.log('📦 [useFiles.ts] 获取文件详情结果:', result);
        return result;
      },
      staleTime: 1000 * 60 * 5, // 5分钟内认为数据是新鲜的
      gcTime: 1000 * 60 * 30,   // 30分钟后清除缓存
      refetchOnWindowFocus: false,
      retry: 1,
    });
  };

  // --------------- 返回所有状态和方法 --------------- 
  return {

    // 这里是upload.tsx里的files的来源， 通过useQuery获取，放在filesQuery的缓存里，即.data里
    files: filesQuery.data ?? [],  
    isLoading: filesQuery.isLoading,
    isError: filesQuery.isError,

    // .mutate() 本身不返回promise对象, 如果需要返回promise对象，则需要使用.mutateAsync()
    // 这里建议使用.mutateAsync() 更符合现代JavaScript的异步编程风格。 
    // 这样的好处是：调用者可以选择是否等待操作完成，可再调用处使用try/catch来处理错误; 可获取到操作返回的数据
    uploadFile: uploadMutation.mutateAsync,  
    deleteFile: deleteMutation.mutateAsync,
    
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // 添加新的 hook 函数
    useFileDetail,

    // 在组件里添加刷新按钮,调用refecth() 可实现强制刷新数据
    refecth: filesQuery.refetch,  

  };
} 