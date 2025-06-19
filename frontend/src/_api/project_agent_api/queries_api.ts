import fastApiInstance from '../axios_instance_fa';

// 定义枚举类型（需要与后端保持一致）
export enum StateEnum {
  // 根据后端的 StateEnum 枚举值来定义
}



// 定义响应类型接口，对应后端的响应模型
export interface AgentStateData {
  projectId: string;
  state: StateEnum;
  overallProgress: number;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface StateStatusResponse {
  projectId: string;
  agentState: AgentStateData;
}

// 定义SSE消息记录的接口，对应后端的SSEMessageRecord, 和SSEHistoryResponse模型
export interface SSEMessageRecord {
  messageId: string;
  event: string; // "state_update" | "error"
  data: Record<string, any>;   //Record<string, any> 表示一个键值对对象, 可用来表示python的Dict
  timestamp: string; // ISO datetime string
}

export interface SSEHistoryResponse {
  projectId: string;
  messages: SSEMessageRecord[];
  totalMessages: number;
  lastUpdated: string;
}

// ================================ queriesApi 模块 ===================================
export const queriesApi = {
  /**
   * 获取项目的代理状态
   * @param projectId 项目ID
   * @returns Promise<StateStatusResponse>
   */
  getAgentState: async (projectId: string): Promise<StateStatusResponse> => {
    console.log('📤 进入API端点getAgentState:');
    const response = await fastApiInstance.get<StateStatusResponse>(
      `/projects/${projectId}/agent-state`
    );
    console.log('📥 获取AgentState结果:', response.data);
    return response.data;
  },

  /**
   * 获取项目的SSE历史记录
   * @param projectId 项目ID
   * @returns Promise<SSEHistoryResponse>
   */
  getSSEHistory: async (projectId: string): Promise<SSEHistoryResponse> => {
    console.log('📤 进入API端点getSSEHistory:');
    const response = await fastApiInstance.get<SSEHistoryResponse>(
      `/projects/${projectId}/agent-message-history`
    );
    console.log('📥 获取SSEHistory结果:', response.data);
    return response.data;
  },
};

// 导出便捷函数（保持向后兼容）
export const getAgentState = queriesApi.getAgentState;
export const getSSEHistory = queriesApi.getSSEHistory;