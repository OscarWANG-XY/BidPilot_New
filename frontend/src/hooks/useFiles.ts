
// useQuery: 用于数据获取  useMutation: 用于数据修改  useQueryClient: 用于管理查询缓存
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fileApi } from '@/api/files_api';
import { FileRecord } from '@/types/files_dt_stru';
import { toast } from '@/hooks/use-toast';


// ================================ 文件上传管理 hook  ============================================ 
export function useFiles() {

  // 获取react-query的客户端实例，用于管理和操作缓存数据
  // 在后面上传成功时会用到
  const queryClient = useQueryClient();

 


  // ---------------查询文件的Query管理 --------------- 
  const filesQuery = useQuery({
    // 缓存的唯一标识符，在useQuery被初始化时配置。 
    queryKey: ['fileskey'], 
    // 查询函数，返回所有文件，然后放进缓存。
    // 直到缓存数据被判定过期，否则新的API请求不会被触发，而是直接调用缓存数据。
    queryFn: () => fileApi.getAllFiles(),

    //其他关于缓存的配置参数
    staleTime: 0, // 有效/新鲜的时间，例如 1000 * 60 * 5 是5分钟
    gcTime: 0,   // 缓存保持时间（替换 cacheTime），例如 1000 * 60 * 30 是30分钟
    refetchOnWindowFocus: true, // 窗口聚焦时重新请求
    retry: 1, // 失败时重试1次
    initialData: [], // 初始数据为空数组
    // 可选：用placeholderData预取数据
    //placeholderData: (previousData) => previousData ?? [],
  });

  // Ensure the data is being fetched and set correctly
  if (filesQuery.isLoading) {
    console.log('Loading files...');
  } else if (filesQuery.isError) {
    console.error('Error fetching files:', filesQuery.error);
  } else {
    console.log('Files fetched:', filesQuery.data);
  }


  // ----------- 上传文件的Query管理 （done check!） -------------
  const uploadMutation = useMutation({

    // 上传文件的Mutation函数, 参数file是从用户选择上传的文件对象 
    mutationFn: (file: File) => {
      // 调用fileApi.upload上传文件
      return fileApi.uploadFile(file);
    },

    // newFile是上传成功后返回的文件信息，是TenderFile类型， 不是文件对象本身（与file不同）
    // newFile是mutationFn返回的结果，通常是服务器返回的关于新上传文件的详细信息（如文件名、大小、类型等）
    onSuccess: (newFile: FileRecord) => {

      // 在queryClient中设置缓存数据，与useQuery中的filesQuery的缓存数据是同一个
      // 使用.setQueryData()方法，参数1是缓存唯一标识符，参数2是回调函数，用于更新缓存数据
      queryClient.setQueryData<FileRecord[]>(
        // 缓存的唯一标识符，在useQuery被初始化时配置。 
        ['fileskey'], 
        // 以下是回调函数，用于更新缓存数据，
        // 缓存数据是响应式的，所有调用它的组件都会自动更新。
        // 同时，这个更新会让缓存时间刷新，造成需要下一次过期，才会重新请求API。
        // 于是需要之后的手动invalidateQeueries处理。
        // 而以下上传的文件信息放入缓存的另外一个作用是让客户没有明显的等待时间。
        // 但这会有极度短暂的不一致 
        (old = []) => {return [...old, newFile] as FileRecord[];}

      );
      // 手动让缓存数据过期，然后重新请求API
      // 只有这样，上传后的缓存数据与服务器的数据才会一致。
      queryClient.invalidateQueries({ queryKey: ['fileskey'] });
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

  // ----------- 修改删除 mutation (done check!)-------------
  const deleteMutation = useMutation({
    // 删除文件的Mutation函数, fileId作为参数传入，调用fileApi.deleteFile向服务器发出删除请求。
    mutationFn: (fileId: string) => fileApi.deleteFile(fileId),

    // 删除成功后，从缓存中移除已删除的文件
    onSuccess: (_, fileId: string) => {

      // 第一个参数是缓存标识符queryKey, 第二个是回调函数()=>{}, old作为传参, 默认为[]
      queryClient.setQueryData<FileRecord[]>(
        // 缓存的唯一标识符，在useQuery被初始化时配置。 
        ['fileskey'], 
        // 回调函数，用于更新缓存数据（通过.filter()返回一个新数组，新数组中不包含已删除的文件）
        // (file) => file.id !== fileId 是过滤条件，它会遍历old数组里的每一个file, 如果file.id不等于fileId, 则保留file, 否则删除file
        (old = []) => {return old.filter((file) => file.id !== fileId);}
      );
      // 手动让缓存数据过期，然后重新请求API
      // 只有这样，上传后的缓存数据与服务器的数据才会一致。
      queryClient.invalidateQueries({ queryKey: ['fileskey'] });
    },

    onError: (error: any) => {
      console.error('Delete failed:', error);
      toast({
        title: "删除失败",
        description: error?.response?.data?.message || error.message || "请稍后重试",
        variant: "destructive",
      });
    }
  });



  // --------------- 返回所有状态和方法 --------------- 
  return {
    // 这里是upload.tsx里的files的来源， 通过useQuery获取，放在filesQuery的缓存里，即.data里
    files: filesQuery.data ?? [],  
    isLoading: filesQuery.isLoading,
    isError: filesQuery.isError,
    uploadFile: uploadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refecth: filesQuery.refetch,  // 在组件里添加刷新按钮,调用refecth() 可实现强制刷新数据
  };
} 