import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskSteamingApi } from '@/components/Task/hook&APIs.tsx/streamingApi';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type {
  TaskType,
  StreamStartResponse,
  StreamStatusResponse,
  StreamResultResponse
} from '@/_types/projects_dt_stru/projectTasks_interface';
import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';


  // Stream state reducer for consolidated state management
  type StreamState = {
    id: string | null;
    content: string;
    isStreaming: boolean;
    error: string | null;
    complete: boolean;
  };

  // 以下payload代表随着action的类型传递的数据或负载。 如STREAM_STARTED, 传递的是stream_id, 如STREAM_DATA, 传递的是数据
  type StreamAction = 
  | { type: 'STREAM_STARTED'; payload: string }
  | { type: 'STREAM_DATA'; payload: string }
  | { type: 'STREAM_ERROR'; payload: string }
  | { type: 'STREAM_COMPLETE' }
  | { type: 'STREAM_RESET' };

  const streamReducer = (state: StreamState, action: StreamAction): StreamState => {
    switch (action.type) {
      case 'STREAM_STARTED':
        return {
          id: action.payload,
          content: '',
          isStreaming: true,
          error: null,
          complete: false
        };
      case 'STREAM_DATA':
        return {
          ...state,
          content: state.content + action.payload
        };
      case 'STREAM_ERROR':
        return {
          ...state,
          error: action.payload,
          isStreaming: false
        };
      case 'STREAM_COMPLETE':
        return {
          ...state,
          complete: true,
          isStreaming: false
        };
      case 'STREAM_RESET':
        return {
          id: null,
          content: '',
          isStreaming: false,
          error: null,
          complete: false
        };
      default:
        return state;
    }
  };




export const useStream = (projectId: string, stageType: StageType, taskType: TaskType) => {
  const queryClient = useQueryClient();


  //  ------ 管理了流的完整生命周期 -------
  // Stream state 
  // const [streamId, setStreamId] = useState<string | null>(null);
  // const [streamContent, setStreamContent] = useState<string>('');
  // const [isStreaming, setIsStreaming] = useState<boolean>(false);
  // const [streamError, setStreamError] = useState<string | null>(null);
  // const [streamComplete, setStreamComplete] = useState<boolean>(false);
  
  // 以上生命周期管理的状态值，被打包到一起，用reducer管理； reducer意思是"降维" 
  // 而之前的streamReducer 定义了这些值变化的场景。 
  // streamState值得修改，我们命名为dispatch, 因为是dispatch（发送）一个指令给reducer 去修改。 
  const [streamState, dispatchStreamState] = useReducer(streamReducer, {
    id: null,  //stream_id
    content: '',
    isStreaming: false,
    error: null,
    complete: false
  });
  
  // Destructure for convenience in the hook
  const { id: streamId, content: streamContent, isStreaming, error: streamError, complete: streamComplete } = streamState;
  
  // 轮询控制
  const [shouldPoll, setShouldPoll] = useState<boolean>(true);

  // 存储终止流式请求的函数， 在需要的时候调用
  const abortStreamRef = useRef<(() => void) | null>(null);


  // Content buffer for batching updates
  // contentBufferRef 是用于缓存流式数据的， 当有数据时，先缓存到contentBufferRef
  // contentUpdateTimeoutRef 是用于定时发送缓存数据， 每隔100ms（在后面有设定），将缓存的数据一次性倒出。 
  // 这两个得配合使用在后面得BatchContentUpdate函数里。
  const contentBufferRef = useRef<string>('');
  const contentUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize parameters to prevent unnecessary effect triggers 
  // 将参数打包成一个对象，如果没有值变化，则返回之前缓存得对象，从而避免不必要得计算，或者是组件重新渲染。
  // 在后面得代码引用里，我们可以避免不必要得查询。
  const streamParams = useMemo(() => ({
    projectId,
    stageType,
    streamId
  }), [projectId, stageType, streamId]);


  // Batch content updates function
  const flushContentBuffer = useCallback(() => {
    if (contentBufferRef.current) {
      // 发送指令给reducer，更新数据，从contentBufferRef得角度，是将缓存的数据一次性倒出。 
      dispatchStreamState({ type: 'STREAM_DATA', payload: contentBufferRef.current });
      contentBufferRef.current = '';
    }
    contentUpdateTimeoutRef.current = null;
  }, []);


  // -------- 启动流失分析任务 --------
  const startStreamMutation = useMutation({
    mutationFn: async () => {
      if (!projectId || !stageType || !taskType) {
        throw new Error('Project ID and Stage Type and Task Type are required');
      }
      return TaskSteamingApi.startStream(projectId, stageType, taskType);
    },

    // 启动成功的处理
    onSuccess: (data: StreamStartResponse) => {
      console.log('✅ [useOutlineAnalysisStream] 流式分析任务启动成功:', data);
      
      // Fix: Use data.streamId instead of data.stream_id
      dispatchStreamState({ type: 'STREAM_STARTED', payload: data.streamId });

      // 检查状态初始化后
      console.log('成功启动分析，流状态初始化完毕:', {
        streamId: data.streamId,
        isStreaming: true
      });
      
      // 使之前的缓存数据时效，促使数据更新。
      queryClient.invalidateQueries({
        queryKey: ['outlineAnalysisTask', projectId, stageType]
      });
    },

    // 启动失败的处理
    onError: (error: any) => {
      console.error('❌ [useOutlineAnalysisStream] 启动流式分析任务失败:', error);
      // setStreamError(error.message || '启动流式分析任务失败');
      // setIsStreaming(false);
      dispatchStreamState({ 
        type: 'STREAM_ERROR', 
        payload: error.message || 'Failed to start stream analysis task'
      });
    }
  });
  

  
  // -------- 监听流状态（轮询） -------- 
  // 虽然有useEffect, 但比如网络突然中断，useEffect无法监听到，需要streamStatusQuery来监听。
  // enable条件要求在整个生命周期都监听，直到流状态为COMPLETED, FAILED, CANCELLED时（由shouldPoll控制），才停止轮询。
  const streamStatusQuery = useQuery<StreamStatusResponse>({
    queryKey: ['streamStatus', streamParams.projectId, streamParams.stageType, streamParams.streamId],
    queryFn: async () => {
      if (!projectId || !stageType || !taskType || !streamId) {
        throw new Error('Missing required parameters');
      }
      return TaskSteamingApi.getStreamStatus(projectId, stageType, taskType, streamId);
    },
    // enabled 控制是否启用查询， 只有当项目id，阶段类型，流id都存在，并且流没有在运行，并且需要轮询时，才启用查
    enabled: Boolean(projectId) && Boolean(stageType) && Boolean(taskType) && Boolean(streamId) && shouldPoll,
    // 轮询间隔
    refetchInterval: shouldPoll ? 2000 : false,
    // 窗口重新获得焦点时是否重新请求 
    refetchOnWindowFocus: false,
  });
  



  // -------- 获取完整的流结果 --------
  const streamResultQuery = useQuery<StreamResultResponse>({
    queryKey: ['streamResult', streamParams.projectId, streamParams.stageType, streamParams.streamId],
    queryFn: async () => {
      if (!projectId || !stageType || !taskType || !streamId) {
        throw new Error('Missing required parameters');
      }
      return TaskSteamingApi.getStreamResult(projectId, stageType, taskType, streamId);
    },
    enabled: Boolean(projectId) && Boolean(stageType) && Boolean(taskType) && Boolean(streamId) && streamComplete,
    // Only fetch once when stream is complete
    staleTime: Infinity,
  });
  


  // ----------- 接收流式数据 -----------
  // 这里监听的只是数据，而不是流状态。

  useEffect(() => {
    
    if (projectId && stageType && streamId && isStreaming) {
      
      // 如果存在之前的流，则终止之前的流，避免多个流存在。 
      if (abortStreamRef.current) {
        abortStreamRef.current();
      }
    
      // Clear any pending content updates
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
        contentUpdateTimeoutRef.current = null;
      }

      // Batch stream data updates
      const batchContentUpdate = (data: string) => {
        contentBufferRef.current += data;
        
        // If no timeout is scheduled, schedule one
        if (!contentUpdateTimeoutRef.current) {
          // 每隔100ms，将缓存的数据一次性倒出。  
          // contentUpdateTimeoutRef.current 本身不存储数据，而是存储定期ID， 然后定时器触发flushContentBuffer执行。 
          contentUpdateTimeoutRef.current = setTimeout(flushContentBuffer, 100);
        }
      };

      
      // 开始新的流 
      const abort = TaskSteamingApi.fetchStreamingData(
        projectId,
        stageType,
        taskType,
        streamId,
        {
          onMessage: (data) => {
            console.log('📥 [useOutlineAnalysisStream] 收到流式数据:', data);
            batchContentUpdate(data); // 当定时器被触发时，将缓存的数据通过flushContentBuffer一次性倒出给reducer
          },
          onError: (error) => {
            console.error('❌ [useOutlineAnalysisStream] 流式数据错误:', error);
              // setStreamError(error);   // 记录错误
              // setIsStreaming(false);   // 停止流 （设置停止状态）

            dispatchStreamState({ type: 'STREAM_ERROR', payload: error });

            // Flush any remaining content  （把剩下在buffer里的数据一次性倒出）
            flushContentBuffer(); 

            // 手动让 queryClient 重新请求流的状态，可能用于界面显示错误详情。
            queryClient.invalidateQueries({
              queryKey: ['streamStatus', projectId, stageType, streamId]
            });
          },
          onComplete: () => {
            console.log('✅ [useOutlineAnalysisStream] 流式数据接收完成');
            // setStreamComplete(true);  // 设置流的完成状态， 这个会触发streamResultQuery的查询
            // setIsStreaming(false);   // 停止流 （设置停止状态）
            
            // Flush any remaining content （把剩下在buffer里的数据一次性倒出）
            flushContentBuffer();

            dispatchStreamState({ type: 'STREAM_COMPLETE' });

            // 重新请求数据，确保前端同步最新状态
            queryClient.invalidateQueries({
              queryKey: ['streamStatus', projectId, stageType, streamId]
            });
            queryClient.invalidateQueries({
              queryKey: ['streamResult', projectId, stageType, streamId]
            });
            queryClient.invalidateQueries({
              queryKey: ['outlineAnalysisTask', projectId, stageType]
            });
          }
        }
      );
      
      // 存储终止流的函数，用于下次可以终止流。 
      abortStreamRef.current = abort;
      
      // 卸载或参数变化时清除 （stream_id从1到2, 则需要清除1, 或者组件关闭/卸载）
      return () => {
        if (abort) {
          abort();
        }
      };
    }
  }, [projectId, streamId, isStreaming, flushContentBuffer]);
  // projectId 项目切换， streamID 流任务切换， isStreaming 流的开启和关闭， 导出动作发生时， 都会触发这个useEffect


  // -------- 手动停止流式分析 --------
  const stopStreaming = useCallback(() => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
      abortStreamRef.current = null;
    }
    // No dispatch needed here as the abort will trigger onError or onComplete
    // which will update the streaming state
    //dispatchStreamState({ type: 'STREAM_RESET' });
  }, []);



    // 监听查询结果，根据状态控制shouldPoll, 从而控制 streamStatusQuery 是否继续轮询
  useEffect(() => {
    const status = streamStatusQuery.data?.status;
    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      if(shouldPoll) {
        setShouldPoll(false);
      }
    }
  }, [streamStatusQuery.data, shouldPoll]);


  // Return hook interface

  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Stream state
    streamId,
    streamContent,
    isStreaming,    // 正在分析中
    streamError,
    streamComplete,
    streamStatus: streamStatusQuery.data,
    streamResult: streamResultQuery.data,
    
    // Actions
    startStream: startStreamMutation.mutateAsync,
    stopStreaming,
    isStartingStream: startStreamMutation.isPending,  // 正在启动分析
    
    // Status queries
    isLoadingStatus: streamStatusQuery.isLoading,
    isLoadingResult: streamResultQuery.isLoading,
    
    // Errors
    statusError: streamStatusQuery.error,
    resultError: streamResultQuery.error,
  }), [
    streamId,
    streamContent,
    isStreaming,
    streamError,
    streamComplete,
    streamStatusQuery.data,
    streamResultQuery.data,
    startStreamMutation.mutateAsync,
    stopStreaming,
    startStreamMutation.isPending,
    streamStatusQuery.isLoading,
    streamResultQuery.isLoading,
    streamStatusQuery.error,
    streamResultQuery.error
  ]);
};