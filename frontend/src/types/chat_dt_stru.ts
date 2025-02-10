// chat_types.ts

// 用户基本信息接口
export interface User {
    id: string;
    phone: string;
    email?: string;
    role?: string;
  }
  
  // 消息角色类型
  export type MessageRole = 'user' | 'assistant' | 'system';
  
  // 聊天消息接口
  export interface ChatMessage {
    id: string;
    sessionId: string;
    sequence: number;
    content: string;
    role: MessageRole;
    createdAt: string;
  }
  
  // 创建消息的请求接口
  export interface CreateMessageRequest {
    content: string;
    role?: MessageRole;  // 可选，后端会强制设置为 user
  }
  
  // 创建消息的响应接口
  export interface CreateMessageResponse {
    status: 'processing' | 'error';
    messageId: string;
    sequence: number;
    message?: string;  // 错误信息
  }
  
  // 批量创建消息的请求接口
  export interface BatchCreateMessagesRequest {
    messages: Array<{
      content: string;
    }>;
  }
  
  // 批量创建消息的响应接口
  export interface BatchCreateMessagesResponse {
    status: 'processing' | 'error';
    messages?: Array<{
      messageId: string;
      sequence: number;
      content: string;
    }>;
    message?: string;  // 错误信息
  }
  
  // 聊天会话基本信息接口
  export interface ChatSession {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: User;
    messageCount: number;
    lastMessage?: ChatMessage;
  }
  
  // 聊天会话详细信息接口（包含消息列表）
  export interface ChatSessionDetail extends ChatSession {
    messages: ChatMessage[];
  }
  
  // 清除会话历史响应接口
  export interface ClearHistoryResponse {
    status: 'success' | 'error';
    deletedMessages?: number;
    message?: string;  // 错误信息
  }
  
  // API 响应状态接口
  export interface ApiResponse<T> {
    data?: T;
    status: number;
    message?: string;
  }
  
  // 聊天会话查询参数接口
  export interface ChatSessionQueryParams {
    page?: number;
    pageSize?: number;
    ordering?: string;  // 排序字段，例如: "-updatedAt"
  }
  
  // 聊天消息查询参数接口
  export interface ChatMessageQueryParams {
    page?: number;
    pageSize?: number;
    ordering?: string;  // 默认按 sequence 升序
  }
  
  // WebSocket 消息接口
  export interface WebSocketMessage {
    type: 'message' | 'status' | 'error';
    payload: ChatMessage | {
      status: string;
      messageId?: string;
      error?: string;
    };
  }
  
  // 聊天状态类型
  export type ChatStatus = 'idle' | 'sending' | 'receiving' | 'error';
  
  // 聊天上下文接口（用于 React Context）
  export interface ChatContext {
    currentSession?: ChatSession;
    messages: ChatMessage[];
    status: ChatStatus;
    error?: string;
    sendMessage: (content: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    loadMoreMessages: () => Promise<void>;
  }
  
  // Hook 返回类型接口
  export interface UseChatSession {
    session?: ChatSession;
    messages: ChatMessage[];
    status: ChatStatus;
    error?: string;
    sendMessage: (content: string) => Promise<void>;
    clearHistory: () => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    isLoading: boolean;
  }
  
  export interface UseChatSessions {
    sessions: ChatSession[];
    currentSession?: ChatSession;
    isLoading: boolean;
    error?: string;
    createSession: () => Promise<ChatSession>;
    selectSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => Promise<void>;
    refreshSessions: () => Promise<void>;
  }