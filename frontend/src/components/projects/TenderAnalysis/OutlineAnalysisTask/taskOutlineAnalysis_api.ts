import axiosInstance from '../../../../_api/axios_instance';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import type { 
  StreamStartResponse,
  StreamStatusResponse,
  StreamResultResponse,
  OutlineAnalysisTaskDetail,
  OutlineAnalysisTaskUpdate,
} from '@/_types/projects_dt_stru/projectTasks_interface';

// Extend the existing TaskApi object with streaming methods
export const StreamingTaskApi = {


  // Get outline analysis task status
  getOutlineAnalysisTask: async (
    projectId: string, 
    stageType: StageType
  ): Promise<OutlineAnalysisTaskDetail> => {
    console.log('📤 获取大纲分析任务:', { projectId, stageType });
    // Assuming you will create an endpoint for this
    const response = await axiosInstance.get(
      `/projects/${projectId}/stages/${stageType}/outline_analysis/`
    );
    console.log('📥 获取大纲分析任务成功:', response.data);
    return response.data;
  },

  // Update outline analysis task
  updateOutlineAnalysisTask: async (
    projectId: string, 
    stageType: StageType, 
    taskData: OutlineAnalysisTaskUpdate
  ): Promise<OutlineAnalysisTaskDetail> => {
    console.log('📤 更新大纲分析任务:', { projectId, stageType, taskData });
    // Assuming you will create an endpoint for this
    const response = await axiosInstance.patch(
      `/projects/${projectId}/stages/${stageType}/outline_analysis/`, 
      taskData
    );
    console.log('📥 更新大纲分析任务成功:', response.data);
    return response.data;
  },


// ================= 针对 流失输出 相关的API =====================

  // 启动流失分析
  startOutlineAnalysisStream: async (
    projectId: string, 
    stageType: StageType
  ): Promise<StreamStartResponse> => {
    console.log('📤 启动流式大纲分析:', { projectId, stageType });
    const response = await axiosInstance.post(
      `/projects/${projectId}/stages/${stageType}/analyze-outline-streaming/`
    );
    console.log('📥 流式大纲分析启动成功:', response.data);
    return response.data;
  },


  // Get stream status (non-streaming endpoint)
  getStreamStatus: async (
    projectId: string, 
    stageType: StageType, 
    streamId: string
  ): Promise<StreamStatusResponse> => {
    console.log('📤 获取流状态:', { projectId, stageType, streamId });
    const response = await axiosInstance.get(
      `/projects/${projectId}/stages/${stageType}/outline-analysis-status/${streamId}/`
    );
    console.log('📥 获取流状态成功:', response.data);
    return response.data;
  },



  // 获取完整的 流结果
  getStreamResult: async (
    projectId: string, 
    stageType: StageType, 
    streamId: string
  ): Promise<StreamResultResponse> => {
    console.log('📤 获取完整流结果:', { projectId, stageType, streamId });
    const response = await axiosInstance.get(
      `/projects/${projectId}/stages/${stageType}/outline-analysis-result/${streamId}/`
    );
    console.log('📥 获取完整流结果成功:', response.data);
    return response.data;
  },




  // ----------- 关键流式数据获取函数 （通过FETCH API 实现 SSE 流式数据获取） -----------
  fetchStreamingData: (
    projectId: string, 
    stageType: StageType, 
    streamId: string, 
    // callback回调函数，返回给useTaskOutlineAnalysis，根据不同的条件调用对应的函数
    callbacks: {
      onMessage: (data: string) => void;  // 接收到消息时调用
      onError: (error: string) => void;  // 发生错误时调用
      onComplete: () => void;            // 流完成时调用
    }
  ) => {

    const { onMessage, onError, onComplete } = callbacks;
    
    console.log('🔄 开始获取流式数据:', { projectId, stageType, streamId });
    
    // Create AbortController to allow cancellation
    // AbortController 是一个浏览器API，允许我们在请求进行时取消请求。 

    const controller = new AbortController();
    const signal = controller.signal;
    
    // Start fetch request with proper headers for SSE
    fetch(`/api/projects/${projectId}/stages/${stageType}/outline-analysis-stream/${streamId}/`, {
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
        
        // 将数据块按双换行符分割成多个消息
        const messages = chunk.split('\n\n').filter(msg => msg.trim());
        console.log('解析后的消息数量:', messages.length);
        
        for (const message of messages) {
          // Skip empty messages
          if (!message.trim()) continue;
          
          console.log('处理消息:', message);
          
          // 检查是否为特殊事件类型（错误，完成）
          if (message.startsWith('event: error')) {
            const errorData = message.match(/data: (.*)/)?.[1] || 'Unknown error';
            console.error('❌ 流式数据错误:', errorData);
            onError(errorData);
            continue;
          }
          
          if (message.startsWith('event: done')) {
            console.log('✅ 流式数据传输完成');
            onComplete();
            continue;
          }
          
          // Regular data message
          const dataMatch = message.match(/data: (.*)/);
          if (dataMatch && dataMatch[1]) {
            console.log('提取的数据:', dataMatch[1]);
            onMessage(dataMatch[1]);
          } else {
            console.log('无法从消息中提取数据');
          }
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