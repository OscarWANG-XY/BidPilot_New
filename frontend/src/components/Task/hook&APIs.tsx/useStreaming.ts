import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskSteamingApi } from '@/components/Task/hook&APIs.tsx/streamingApi';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface';
import type {
  StreamStartResponse,
  StreamStatusResponse,
  StreamResultResponse,
  StreamStatus
} from '@/components/Task/hook&APIs.tsx/streamingApi';
import { useEffect, useCallback, useRef, useMemo, useReducer } from 'react';



//========================== Reducer 管理流状态 （特别适合生命周期的管理） ==========================  
// StreamState定义了状态机
// StreamAction定义了状态机的行为（type表达了意图， payload代表了意图所需的负载/数据）
// reducer 定义了如何从 旧的StreamState 到 新的StreamAction

  // Stream state reducer for consolidated state management
  type StreamState = {
    id: string | null;
    content: string;
    isStreaming: boolean;
    error: string | null;
    complete: boolean;
  };

  // 以下payload代表随着action的类型传递的数据或负载。 如STREAM_STARTED, 传递的是stream_id, 如STREAM_DATA, 传递的是数据
  // 关于reducer的使用：
  // 1. 一个action 只能由一个payload， 如果多个值要传，需要合并成一个对象。 
  // 2. payload就是调用这个action时，需要传入的参数。  
  // 3. 如果没有payload，意味着这个action不需要传参
  type StreamAction = 
  | { type: 'START_STREAM'; payload: string }  // 启动流，payload=流ID
  | { type: 'ACCEPT_DATA'; payload: string }     // 接收数据，payload=新数据块
  | { type: 'CATCH_ERROR'; payload: string }    // 发生错误，payload=错误信息
  | { type: 'COMPLETE_STREAM' }                  // 流完成（无payload）
  | { type: 'RESET_STREAM' };                    // 重置流（无payload）

  const streamReducer = (state: StreamState, action: StreamAction): StreamState => {
    switch (action.type) {
      case 'START_STREAM':
        return {
          id: action.payload,  // payload（携带的货物），这里代表真正有用的负载/数据。 调用这个action时，只需要传入这个参数。 
          content: '',
          isStreaming: true,
          error: null,
          complete: false
        };
      case 'ACCEPT_DATA':
        return {
          ...state,
          content: state.content + action.payload
        };
      case 'CATCH_ERROR':
        return {
          ...state,
          error: action.payload,
          isStreaming: false
        };
      case 'COMPLETE_STREAM':
        return {
          ...state,
          complete: true,
          isStreaming: false
        };
      case 'RESET_STREAM':
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





// ========================== 针对 Reducer 本地存储 ==========================  
// 添加本地存储键名常量
const STREAM_STATE_STORAGE_KEY = 'STREAM_STATE_CACHE';

// 从本地存储加载状态的函数
const loadStreamStateFromStorage = (projectId: string, stageType: StageType, taskType: TaskType): StreamState | null => {
  try {
    const storageKey = `${STREAM_STATE_STORAGE_KEY}_${projectId}_${stageType}_${taskType}`;
    const savedState = localStorage.getItem(storageKey);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Failed to load stream state from localStorage:', error);
  }
  return null;
};

// 保存状态到本地存储的函数
const saveStreamStateToStorage = (
  state: StreamState, 
  projectId: string, 
  stageType: StageType, 
  taskType: TaskType
) => {
  try {
    const storageKey = `${STREAM_STATE_STORAGE_KEY}_${projectId}_${stageType}_${taskType}`;
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save stream state to localStorage:', error);
  }
};





// ========================== useStream 钩子主函数 ========================== 

export const useStream = (projectId: string, stageType: StageType, taskType: TaskType) => {
  const queryClient = useQueryClient();

  // 从本地存储加载初始状态
  const initialState = useMemo(() => {
    const savedState = loadStreamStateFromStorage(projectId, stageType, taskType);
    return savedState || {
      id: null,
      content: '',
      isStreaming: false,
      error: null,
      complete: false
    };
  }, [projectId, stageType, taskType]);

  // 修改 useReducer 使用加载的初始状态
  const [streamState, dispatchStreamState] = useReducer(streamReducer, initialState);
  
  // 当状态变化时保存到本地存储
  useEffect(() => {
    saveStreamStateToStorage(streamState, projectId, stageType, taskType);
  }, [streamState, projectId, stageType, taskType]);
  
  // 为了在Query里方便使用，将streamState的值解构出来。 
  const { id: streamId, content: streamContent, isStreaming, error: streamError, complete: streamComplete } = streamState;
  



  // -------- 监听流状态（轮询） -------- 
  // 如果第一次查询返回 'PENDING' 而非 'PROCESSING'，轮询不启动，即使后来变为 'PROCESSING' 也不自动开始轮询。startStreamMutation里，手动触发更新，来解决这个问题。 
  const streamStatusQuery = useQuery<StreamStatusResponse>({
    // 当queryKey变化时，会重新查询。  
    queryKey: ['streamStatus', projectId, stageType, taskType, streamId],
    queryFn: async () => {
      if (!projectId || !stageType || !taskType || !streamId) {
        throw new Error('Missing required parameters');
      }
      return TaskSteamingApi.getStreamStatus(projectId, stageType, taskType, streamId);
    },
    // 当useStream首次加载时，由于streamId为空，所以不会查询。  
    enabled: Boolean(projectId) && Boolean(stageType) && Boolean(taskType) && Boolean(streamId),
    // 仅在任务处于分析中状态时进行轮询

    // 当然了，我们可以看到这个轮询是2s一次，而在之后的useEffect, 会手动轮询， 之间存在重叠。 
    // 我暂时保留它，但将间隔改为5s,以覆盖边缘情况。（虽然可能不需要）
    refetchInterval: (query) => {
      if (query.state.error) return false;
      return query.state.data?.status === 'PROCESSING' as StreamStatus ? 2000 : false;
    },
    refetchOnWindowFocus: false,
  });




  // -------- 获取完整的流结果 --------
  // 当useStream首次加载时，由于streamId为空，所以不会查询,当streamId有了，由于enabled=false, 也不会查询
  // 当streamComplete=true时，enabled从false转为true, 会触发查询。 （enable变动触发查询时内置的机制）   
  const streamResultQuery = useQuery<StreamResultResponse>({
    queryKey: ['streamResult', projectId, stageType, taskType, streamId],
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




// ========================== 流生命周期的管理 ========================== 
  // -------- 启动流失分析任务 --------
  const startStreamMutation = useMutation({
    mutationFn: async () => {
      // 检查参数是否存在 
      if (!projectId || !stageType || !taskType) {throw new Error('Project ID||Stage Type||Task Type 是必须的');}
      // 启动流式分析任务
      return TaskSteamingApi.startStream(projectId, stageType, taskType);
    },

    // 启动成功后： 1）状态机更新 2）数据重新刷新
    onSuccess: (data: StreamStartResponse) => {
      // 更新状态机（payload=streamId）
      dispatchStreamState({ type: 'START_STREAM', payload: data.streamId });
      
      // 手动更新数据更新
      queryClient.invalidateQueries({
        queryKey: ['streamStatus', projectId, stageType, taskType, streamId]
      });
    },

    // 启动失败时： 捕捉错误，更新状态机
    onError: (error: any) => {
      // 更新状态机, 捕捉错误 （payload=错误信息）
      dispatchStreamState({ type: 'CATCH_ERROR', payload: error.message || '启动流式分析任务失败！'});
    }
  });
  

  // -------- 接收流式数据（fetchStreamChunks，未使用query） ------
  // 接受流式数据没有使用tanstack query， 因为流式数据的获取需要更精细颗粒的控制，reducer的控制更合适。  
  // 定义缓存容器 和 倾倒定时器， 这两个在后面BatchContentUpdate函数里配合使用， 但可以看到流的启动(startStreamMutation)，我们使用了tanstack query。  
  const contentBufferRef = useRef<string>('');   // 缓存的容器
  const contentUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);  // 数据倾倒的定时器， 后面定义每100ms倾倒一次。 

  // 定义流终止函数存储器
  const abortStreamRef = useRef<(() => void) | null>(null);  // 终止流的函数

  // 定义flushContentBuffer函数, 用于倾倒数据， 后面手动调用。 
  // 先检查contentBufferRef是否存在数据，如果存在，则发送指令给reducer，更新数据，然后清空, 从contentBufferRef的角度，是将缓存的数据一次性倒出。 
  const flushContentBuffer = useCallback(() => {
    if (contentBufferRef.current) {

      // 更新状态机
      // 发送指令给reducer，更新数据，从contentBufferRef得角度，是将缓存的数据一次性倒出。 
      dispatchStreamState({ type: 'ACCEPT_DATA', payload: contentBufferRef.current });

      // 清空缓存
      contentBufferRef.current = '';
    }
    contentUpdateTimeoutRef.current = null;
  }, []); //依赖为空，这样这个函数不受外部因素影响而变化。 

  // 接收流数据
  useEffect(() => {
    
    if (projectId && stageType && taskType && streamId && isStreaming) {
      
      // 如果存在之前的流，则终止之前的流，避免多个流存在。 
      if (abortStreamRef.current) {
        abortStreamRef.current();
      }
    
      // Clear any pending content updates
      if (contentUpdateTimeoutRef.current) {
        clearTimeout(contentUpdateTimeoutRef.current);
        contentUpdateTimeoutRef.current = null;
      }

      // 流数据的批量处理 （避免频繁的请求，减少网络压力）
      const batchContentUpdate = (data: string) => {
        contentBufferRef.current += data;
        
        // If no timeout is scheduled, schedule one
        if (!contentUpdateTimeoutRef.current) {
          // 每隔100ms，将缓存的数据一次性倒出。  
          // contentUpdateTimeoutRef.current 本身不存储数据，而是存储定期ID， 然后定时器触发flushContentBuffer执行。 
          contentUpdateTimeoutRef.current = setTimeout(flushContentBuffer, 100);
        }
      };

      // 开始新的流（abort发起流，同时也提供终止流的方法，这个方法来自fectch技术本身）
      // 在streamingApi.ts里，fetchStreamChunks返回了controller.abort(); 所以abort本身就是终止函数。 
      const abort = TaskSteamingApi.fetchStreamChunks(
        projectId,
        stageType,
        taskType,
        streamId,
        {
          onMessage: (data) => {
            console.log('📥  收到流式数据（原始）:', JSON.stringify(data));
            console.log('📥  收到流式数据（显示）:', data);
            batchContentUpdate(data); // 当定时器被触发时，将缓存的数据通过flushContentBuffer一次性倒出给reducer
          },
          onError: (error) => {
            console.error('❌ 流式数据错误:', error);

            // 更新状态机, 捕捉错误
            dispatchStreamState({ type: 'CATCH_ERROR', payload: error });

            // Flush any remaining content  （把剩下在buffer里的数据一次性倒出）
            flushContentBuffer(); 

            // 手动让 queryClient 重新请求流的状态，可能用于界面显示错误详情。
            queryClient.invalidateQueries({
              queryKey: ['streamStatus', projectId, stageType, taskType, streamId]
            });
          },
          onComplete: () => {
            console.log('✅ 流式数据接收完成');
            // setStreamComplete(true);  // 设置流的完成状态， 这个会触发streamResultQuery的查询
            // setIsStreaming(false);   // 停止流 （设置停止状态）
            
            // Flush any remaining content （把剩下在buffer里的数据一次性倒出）
            flushContentBuffer();

            // 更新状态机, 流完成 
            dispatchStreamState({ type: 'COMPLETE_STREAM' });

            // 重新请求数据，确保前端同步最新状态
            queryClient.invalidateQueries({
              queryKey: ['streamStatus', projectId, stageType, taskType, streamId]
            });
            queryClient.invalidateQueries({
              queryKey: ['streamResult', projectId, stageType, taskType, streamId]
            });
            queryClient.invalidateQueries({
              queryKey: ['startStream', projectId, stageType, taskType]
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
    // 可以选择是否在停止时重置状态
    // resetStreamStorage();
  }, []);



  // -------- 重置本地存储 --------
  const resetStreamStorage = useCallback(() => {
    try {
      const storageKey = `${STREAM_STATE_STORAGE_KEY}_${projectId}_${stageType}_${taskType}`;
      localStorage.removeItem(storageKey);
      dispatchStreamState({ type: 'RESET_STREAM' });
    } catch (error) {
      console.error('Failed to reset stream storage:', error);
    }
  }, [projectId, stageType, taskType]);



  // Return hook interface with added resetStreamStorage
  return useMemo(() => ({
    // 流的输出
    // Streamstate, 提供了在UI组件里进行生命周期管理苏需要的数据。 
    streamId,  // streamId 返回给UI组件其实没有什么用，它在useStreaming的其他查询时用到。 
    isStreaming,    // 启动后， isStreaming=true,  但未CatchError, CompleteStream, ResetSteam时，都是false. 
    streamContent,  // 然后，开始有streamContent,  (以打包的方式倾倒出来)
    streamError,    // 如果发生错误，则streamError=错误信息
    streamComplete, // 如果流完成，则streamComplete=true


    // StreamStatus Query 返回的信息
    streamStatus: streamStatusQuery.data,
    isLoadingStatus: streamStatusQuery.isLoading,
    statusError: streamStatusQuery.error,


    // StreamResult Query 返回的信息
    streamResult: streamResultQuery.data,
    isLoadingResult: streamResultQuery.isLoading,
    resultError: streamResultQuery.error,

    // Actions
    startStream: startStreamMutation.mutateAsync,
    isStartingStream: startStreamMutation.isPending,  // 正在启动分析
    
    // 手动停止流分析
    stopStreaming,
    
    // 添加重置存储的方法
    resetStreamStorage,
    
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
    streamResultQuery.error,
    resetStreamStorage
  ]);
};