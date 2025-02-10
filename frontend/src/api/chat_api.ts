import axiosInstance from './axios_instance';
import {
  ChatSession,
  ChatSessionDetail,
  ChatMessage,
  CreateMessageRequest,
  CreateMessageResponse,
  BatchCreateMessagesRequest,
  BatchCreateMessagesResponse,
  ClearHistoryResponse,
  ChatSessionQueryParams,
  ChatMessageQueryParams
} from '@/types/chat_dt_stru';

// API 端点配置
const API_BASE_URL = '';

const endpoints = {
  sessions: `${API_BASE_URL}/sessions/`,
  messages: (sessionId: string) => `${API_BASE_URL}/sessions/${sessionId}/messages/`,
  clearHistory: (sessionId: string) => `${API_BASE_URL}/sessions/${sessionId}/clear_history/`,
  batchMessages: (sessionId: string) => `${API_BASE_URL}/sessions/${sessionId}/messages/batch_create/`,
};

export const chatApi = {
  // ====================== 会话相关 API =====================

  // 获取会话列表
  getAllSessions: async (params?: ChatSessionQueryParams): Promise<ChatSession[]> => {
    console.log('🔍 [chat_api.ts] 开始获取会话列表...', { params });
    
    try {
      const { data } = await axiosInstance.get<ChatSession[]>(endpoints.sessions, { params });
      console.log('✅ [chat_api.ts] 会话列表获取成功:', {
        count: data.length,
        sessions: data.map(s => ({ id: s.id, messageCount: s.messageCount }))
      });
      return data;
    } catch (error) {
      console.error('❌ [chat_api.ts] 获取会话列表失败:', {
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  },

  // 创建新会话
  createSession: async (): Promise<ChatSession> => {
    console.log('🔧 [chat_api.ts] 开始创建新会话...');
    
    try {
      const { data } = await axiosInstance.post<ChatSession>(endpoints.sessions);
      console.log('✅ [chat_api.ts] 新会话创建成功:', {
        sessionId: data.id,
        createdAt: data.createdAt
      });
      return data;
    } catch (error) {
      console.error('❌ [chat_api.ts] 创建会话失败:', {
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  },

  // 获取会话详情
  getSessionDetail: async (sessionId: string): Promise<ChatSessionDetail> => {
    console.log('🔍 [chat_api.ts] 获取会话详情:', { sessionId });
    
    try {
      const { data } = await axiosInstance.get<ChatSessionDetail>(`${endpoints.sessions}${sessionId}/`);
      console.log('✅ [chat_api.ts] 会话详情获取成功:', {
        sessionId: data.id,
        messageCount: data.messageCount,
        lastMessage: data.lastMessage
      });
      return data;
    } catch (error) {
      console.error('❌ [chat_api.ts] 获取会话详情失败:', {
        sessionId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  },

  // 删除会话
  deleteSession: async (sessionId: string): Promise<void> => {
    console.log('🗑️ [chat_api.ts] 开始删除会话:', { sessionId });
    
    try {
      await axiosInstance.delete(`${endpoints.sessions}${sessionId}/`);
      console.log('✅ [chat_api.ts] 会话删除成功:', { sessionId });
    } catch (error) {
      console.error('❌ [chat_api.ts] 删除会话失败:', {
        sessionId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  },

  // 清除会话历史
  clearSessionHistory: async (sessionId: string): Promise<ClearHistoryResponse> => {
    console.log('🧹 [chat_api.ts] 开始清除会话历史:', { sessionId });
    
    try {
      const { data } = await axiosInstance.post<ClearHistoryResponse>(endpoints.clearHistory(sessionId));
      console.log('✅ [chat_api.ts] 会话历史清除成功:', {
        sessionId,
        deletedMessages: data.deletedMessages
      });
      return data;
    } catch (error) {
      console.error('❌ [chat_api.ts] 清除会话历史失败:', {
        sessionId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  },

  // ====================== 消息相关 API =====================

  // 获取会话消息列表
  getSessionMessages: async (
    sessionId: string,
    params?: ChatMessageQueryParams
  ): Promise<ChatMessage[]> => {
    console.log('🔍 [chat_api.ts] 获取会话消息列表:', { sessionId, params });
    
    try {
      const { data } = await axiosInstance.get<ChatMessage[]>(
        endpoints.messages(sessionId),
        { params }
      );
      console.log('✅ [chat_api.ts] 消息列表获取成功:', {
        sessionId,
        messageCount: data.length
      });
      return data;
    } catch (error) {
      console.error('❌ [chat_api.ts] 获取消息列表失败:', {
        sessionId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  },

  // 发送消息
  sendMessage: async (
    sessionId: string,
    request: CreateMessageRequest
  ): Promise<CreateMessageResponse> => {
    console.log('📤 [chat_api.ts] 开始发送消息:', {
      sessionId,
      content: request.content.slice(0, 50) + '...' // 日志中截断显示内容
    });
    
    try {
      const { data } = await axiosInstance.post<CreateMessageResponse>(
        endpoints.messages(sessionId),
        request
      );
      console.log('✅ [chat_api.ts] 消息发送成功:', {
        sessionId,
        messageId: data.messageId,
        sequence: data.sequence
      });
      return data;
    } catch (error) {
      console.error('❌ [chat_api.ts] 发送消息失败:', {
        sessionId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  },

  // 批量发送消息
  batchSendMessages: async (
    sessionId: string,
    request: BatchCreateMessagesRequest
  ): Promise<BatchCreateMessagesResponse> => {
    console.log('📤 [chat_api.ts] 开始批量发送消息:', {
      sessionId,
      messageCount: request.messages.length
    });
    
    try {
      const { data } = await axiosInstance.post<BatchCreateMessagesResponse>(
        endpoints.batchMessages(sessionId),
        request
      );
      console.log('✅ [chat_api.ts] 批量消息发送成功:', {
        sessionId,
        sentMessages: data.messages?.length
      });
      return data;
    } catch (error) {
      console.error('❌ [chat_api.ts] 批量发送消息失败:', {
        sessionId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  },

  // 获取单条消息详情
  getMessageDetail: async (sessionId: string, messageId: string): Promise<ChatMessage> => {
    console.log('🔍 [chat_api.ts] 获取消息详情:', { sessionId, messageId });
    
    try {
      const { data } = await axiosInstance.get<ChatMessage>(
        `${endpoints.messages(sessionId)}${messageId}/`
      );
      console.log('✅ [chat_api.ts] 消息详情获取成功:', {
        sessionId,
        messageId,
        sequence: data.sequence
      });
      return data;
    } catch (error) {
      console.error('❌ [chat_api.ts] 获取消息详情失败:', {
        sessionId,
        messageId,
        error,
        status: (error as any)?.response?.status,
        response: (error as any)?.response?.data
      });
      throw error;
    }
  }
};

export default chatApi;