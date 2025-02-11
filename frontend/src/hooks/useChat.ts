import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import chatApi from '@/api/chat_api';
import type {
  ChatSession,
  ChatSessionDetail,
  ChatMessage,
  UseChatSession,
  ChatStatus
} from '@/types/chat_dt_stru';

// 查询键常量
const QUERY_KEYS = {
  sessions: ['chat-sessions'] as const,
  session: (id: string) => ['chat-session', id] as const,
  messages: (sessionId: string) => ['chat-messages', sessionId] as const,
};

/**
 * useChat hook for managing chat sessions and messages
 */
export function useChat(sessionId?: string): UseChatSession {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string>();

  // 查询当前会话详情
  const sessionQuery: UseQueryResult<ChatSessionDetail> = useQuery({
    queryKey: QUERY_KEYS.session(sessionId || ''),
    queryFn: async () => {
      console.log('🔍 [useChat] 查询会话详情:', sessionId);
      const result = sessionId ? await chatApi.getSessionDetail(sessionId) : null;
      console.log('📥 [useChat] 会话详情结果:', result);
      return result;
    },
    enabled: !!sessionId,
    staleTime: 1000 * 60, // 1 minute
  });

  // 查询会话消息列表
  const messagesQuery = useQuery({
    queryKey: QUERY_KEYS.messages(sessionId || ''),
    queryFn: async () => {
      console.log('🔍 [useChat] 查询会话消息:', sessionId);
      const result = sessionId ? await chatApi.getSessionMessages(sessionId) : [];
      console.log('📥 [useChat] 消息列表结果:', result);
      return result;
    },
    enabled: !!sessionId,
    staleTime: 1000 * 30, // 30 seconds
  });

  // 发送消息的 mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log('📤 [useChat] 发送消息:', { sessionId, content });
      if (!sessionId) throw new Error('No active session');
      
      // 先乐观更新用户消息
      queryClient.setQueryData<ChatMessage[]>(
        QUERY_KEYS.messages(sessionId),
        (old = []) => [
          ...old,
          {
            id: `temp-${Date.now()}`, // 临时ID
            sessionId: sessionId,
            sequence: (old.length + 1) * 2 - 1,
            content: content,
            role: 'user',
            createdAt: new Date().toISOString(),
          },
        ]
      );

      const result = await chatApi.sendMessage(sessionId, { content });
      console.log('📥 [useChat] 发送消息结果:', result);
      return result;
    },
    onMutate: () => {
      setStatus('sending');
      setError(undefined);
    },
    onSuccess: async (response) => {
      console.log('📥 [useChat] 消息发送成功，服务器响应:', response);
      
      if (!response) {
        setStatus('error');
        setError('Invalid server response');
        return;
      }
      
      setStatus('receiving');
      
      // 开始轮询获取AI响应
      const pollInterval = 1000; // 1秒
      const maxAttempts = 30; // 最大尝试次数
      let attempts = 0;

      const pollForResponse = async () => {
        if (attempts >= maxAttempts) {
          setStatus('error');
          setError('Response timeout');
          return;
        }

        attempts++;
        
        try {
          // 刷新消息列表
          await queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.messages(sessionId!),
          });

          // 获取最新消息
          const messages = queryClient.getQueryData<ChatMessage[]>(QUERY_KEYS.messages(sessionId!));
          const latestMessage = messages?.[messages.length - 1];

          // 如果最新消息是AI的响应且有内容，则停止轮询
          if (latestMessage?.role === 'assistant' && latestMessage?.content) {
            setStatus('idle');
            return;
          }

          // 继续轮询
          setTimeout(pollForResponse, pollInterval);
        } catch (error) {
          console.error('轮询出错:', error);
          setStatus('error');
          setError('Failed to get AI response');
        }
      };

      // 开始轮询
      setTimeout(pollForResponse, pollInterval);
    },
    onError: (error) => {
      setStatus('error');
      setError(error.message);
    },
  });

  // 清除历史记录的 mutation
  const clearHistoryMutation = useMutation({
    mutationFn: () => {
      if (!sessionId) throw new Error('No active session');
      return chatApi.clearSessionHistory(sessionId);
    },
    onSuccess: () => {
      // 清除消息列表缓存
      queryClient.setQueryData(QUERY_KEYS.messages(sessionId!), []);
      // 更新会话详情
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.session(sessionId!),
      });
    },
  });

  // 发送消息的处理函数
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    await sendMessageMutation.mutateAsync(content);
  }, [sessionId, sendMessageMutation]);

  // 清除历史记录的处理函数
  const clearHistory = useCallback(async () => {
    await clearHistoryMutation.mutateAsync();
  }, [sessionId, clearHistoryMutation]);

  // 加载更多消息的处理函数
  const loadMoreMessages = useCallback(async () => {
    if (!sessionId) return;
    // 这里可以实现分页加载逻辑
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.messages(sessionId),
    });
  }, [sessionId, queryClient]);

  return {
    session: sessionQuery.data,
    messages: messagesQuery.data || [],
    status,
    error,
    sendMessage,
    clearHistory,
    loadMoreMessages,
    isLoading: sessionQuery.isLoading || messagesQuery.isLoading,
  };
}

/**
 * Hook for managing chat sessions list
 */
export function useChatSessions() {
  const queryClient = useQueryClient();

  // 查询会话列表
  const sessionsQuery = useQuery({
    queryKey: QUERY_KEYS.sessions,
    queryFn: async () => {
      console.log('🔍 [useChatSessions] 查询所有会话');
      const result = await chatApi.getAllSessions();
      console.log('📥 [useChatSessions] 会话列表结果:', result);
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 创建会话的 mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      console.log('📤 [useChatSessions] 创建新会话');
      const result = await chatApi.createSession();
      console.log('📥 [useChatSessions] 创建会话结果:', result);
      return result;
    },
    onSuccess: (newSession) => {
      // 更新会话列表缓存
      queryClient.setQueryData<ChatSession[]>(
        QUERY_KEYS.sessions,
        (old = []) => [newSession, ...old]
      );
    },
  });

  // 删除会话的 mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      console.log('🗑️ [useChatSessions] 删除会话:', sessionId);
      const result = await chatApi.deleteSession(sessionId);
      console.log('📥 [useChatSessions] 删除会话结果:', result);
      return result;
    },
    onSuccess: (_, deletedSessionId) => {
      // 更新会话列表缓存
      queryClient.setQueryData<ChatSession[]>(
        QUERY_KEYS.sessions,
        (old = []) => old.filter(session => session.id !== deletedSessionId)
      );
    },
  });

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    createSession: createSessionMutation.mutateAsync,
    deleteSession: deleteSessionMutation.mutateAsync,
    refreshSessions: () => queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.sessions,
    }),
  };
}

// Optional: Provide a context provider for global chat state
export function useChatContext() {
  const { sessions } = useChatSessions();
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const chat = useChat(currentSessionId);

  return {
    ...chat,
    sessions,
    currentSessionId,
    setCurrentSessionId,
  };
}