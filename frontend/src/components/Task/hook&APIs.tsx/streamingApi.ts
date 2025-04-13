import axiosInstance from '../../../_api/axios_instance';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface';

// 流式分析任务状态枚举 - 与后端utils.redis_manager.py 对齐
export enum StreamStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}


export interface StreamStartResponse {
  taskId: string;
  streamId: string;
  status: StreamStatus;
  message: string;
}

export interface StreamStatusResponse {
  status: StreamStatus;
  start_time: string;
  update_time?: string;
  error?: string;
  model?: string;
  celery_task_id?: string;
  project_id?: string;
  task_type?: string;
  // Any other metadata returned from the server
}

export interface StreamResultResponse {
  status: StreamStatus;
  content: string;
  chunks_count: number;
  metadata: {
    model?: string;
    celery_task_id?: string;
    project_id?: string;
    task_type?: string;
    [key: string]: any;
  };
} 

export const TaskSteamingApi = {

// ================= 针对 流失输出 相关的API =====================
    // 启动流分析
    // axiosInstance.post(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/start-stream/`)
    startStream: async (
      projectId: string, 
      stageType: StageType,
      taskType: TaskType
    ): Promise<StreamStartResponse> => {
      console.log('📤 streamingApi-startStream 启动流式大纲分析:', { projectId, stageType, taskType });
      const response = await axiosInstance.post(
        //`/projects/${projectId}/stages/${stageType}/analyze-outline-streaming/`
        `/projects/${projectId}/stages/${stageType}/tasks/${taskType}/start-stream/`
      );
      console.log('📥 streamingApi-startStream 流式大纲分析启动成功:', response.data);
      return response.data;
    },

    // 获取流状态
    // axiosInstance.get(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/stream-status/${streamId}/`)
    getStreamStatus: async (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType,
      streamId: string
    ): Promise<StreamStatusResponse> => {
      console.log('📤 streamingApi-getStreamStatus 开始获取流状态:', { projectId, stageType, taskType, streamId });
      const response = await axiosInstance.get(
        //`/projects/${projectId}/stages/${stageType}/outline-analysis-status/${streamId}/`
        `/projects/${projectId}/stages/${stageType}/tasks/${taskType}/stream-status/${streamId}/`
      );
      console.log('📥 streamingApi-getStreamStatus 成功获取流状态:', response.data);
      return response.data;
    },

    // 获取流结果
    // axiosInstance.get(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/stream-result/${streamId}/`)
    getStreamResult: async (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType,
      streamId: string
    ): Promise<StreamResultResponse> => {
      console.log('📤 streamingApi-getStreamResult 开始获取完整流结果:', { projectId, stageType, taskType, streamId });
      const response = await axiosInstance.get(
        //`/projects/${projectId}/stages/${stageType}/outline-analysis-result/${streamId}/`
        `/projects/${projectId}/stages/${stageType}/tasks/${taskType}/stream-result/${streamId}/`
      );
      console.log('📥 streamingApi-getStreamResult 成功获取完整流结果:', response.data);
      return response.data;
    },

    // ----------- 关键流式数据获取函数 （通过FETCH API 实现 SSE 流式数据获取） -----------
    // fetch-get(`/projects/${projectId}/stages/${stageType}/tasks/${taskType}/stream-chunks/${streamId}/`)
    fetchStreamChunks: (
      projectId: string, 
      stageType: StageType, 
      taskType: TaskType,
      streamId: string, 
      // callback回调函数，返回给useTaskOutlineAnalysis，根据不同的条件调用对应的函数
      callbacks: {
        onMessage: (data: string) => void;  // 接收到消息时调用
        onError: (error: string) => void;  // 发生错误时调用
        onComplete: () => void;            // 流完成时调用
      }
    ) => {

      const { onMessage, onError, onComplete } = callbacks;
      
      console.log('🔄 streamingApi-fetchStreamChunks 开始获取流式数据:', { projectId, stageType, taskType, streamId });
      
      // Create AbortController to allow cancellation
      // AbortController 是一个浏览器API，允许我们在请求进行时取消请求。 

      const controller = new AbortController();
      const signal = controller.signal;
      
      // Start fetch request with proper headers for SSE
      //fetch(`/api/projects/${projectId}/stages/${stageType}/outline-analysis-stream/${streamId}/`, {
      fetch(`/api/projects/${projectId}/stages/${stageType}/tasks/${taskType}/stream-chunks/${streamId}/`, {
        method: 'GET',
        headers: {
          //'Accept': 'text/event-stream',
          'Accept': '*/*',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          // Add authentication header if needed
          'Authorization': `Bearer ${localStorage.getItem('token')}`  //注意不是access_token, 命名上需要和axios_instance里的一致
        },
        signal // 将 AbortSignal 传递给 fetch 请求， 运行我们需要的时候取消fetch请求 
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // response.body.getReader() 返回一个 ReadableStreamDefaultReader 对象， 
        // 它允许我们读取流中的数据块, 如果为空，则抛出错误
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }
        
        // 引入解析流数据的函数，在后面被调用处理reader返回的数据
        // 它接受一个 ReadableStreamReadResult<Uint8Array> 类型的参数，
        // 返回一个 Promise<void> 类型的结果
        const processStream = ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {

          // 如果流完成，则调用 onComplete 回调函数
          if (done) {
            console.log('✅ 流式数据获取完成');
            onComplete();
            return Promise.resolve();
          }
          
          // 将数据块（Uint8Array类型）解码为文本 
          const chunk = new TextDecoder().decode(value);
          console.log('接收到原始数据块:', chunk);
          console.log('接收到原始数据块(字节长度):', chunk.length);
          console.log('接收到原始数据块(转义显示):', JSON.stringify(chunk));
          
          // 检查是否包含特殊事件
          if (chunk.includes('event: error')) {
            const errorMatch = chunk.match(/event: error\s*\ndata: (.*)/);
            const errorData = errorMatch?.[1] || 'Unknown error';
            console.error('❌ 流式数据错误:', errorData);
            onError(errorData);
            return reader.read().then(processStream);
          }
          
          if (chunk.includes('event: done')) {
            console.log('✅ 流式数据传输完成');
            onComplete();
            return reader.read().then(processStream);
          }
          
          // 处理常规数据，保留原始格式
          // 我们发现，在SSE传输到前端API的过程中，chunk的内容会多出两个换行符，因此以下需要.replace(/\n\n$/, '')
          const content = chunk.replace(/^data: /gm, '').replace(/\n\n$/, '');
          if (content.trim()) {
            console.log('提取的数据(完整内容):', content);
            console.log('提取的数据(字节长度):', content.length);
            console.log('提取的数据(转义显示):', JSON.stringify(content));
            onMessage(content);
          }
          
          // 递归读取流数据，不断解析新数据直到流结束
          return reader.read().then(processStream);
        };
        
        // 开始读取流数据
        return reader.read().then(processStream);
      })
      // 捕获错误（错误处理）
      .catch(error => {
        console.error('❌ 流式数据获取失败:', error);
        onError(error.message || 'Failed to fetch streaming data');
      });
      
      // FetchSteamingData 返回一个闭包，它会取消正在进行的流失请求。 
      return () => {
        console.log('🛑 取消流式数据获取');
        controller.abort();
      };
    }
  };