import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  StructuringSSEClient, 
  createStructuringSSEClient,
  SSEEventHandlers,
  ConnectedEventData,
  StateUpdateEventData,
  TestEventData,
  ErrorEventData,
  SSEConnectionState
} from '@/_api/structuring_agent_api/SSE_api';

interface UseSSEOptions {
  baseUrl: string;  // SSE 服务端地址
  getToken?: () => string | null;  // 获取token的函数
  projectId?: string;  // 项目ID
  autoConnect?: boolean;  // 是否自动连接
  maxReconnectAttempts?: number;  // 最大重连次数
  reconnectDelay?: number;  // 重连延迟时间
}

interface UseSSEState {
  isConnected: boolean;   // 已连接
  connectionState: number | null;  // 连接内部状态码
  isConnecting: boolean;  // 连接中
  error: string | null;  // 错误信息
  reconnectAttempts: number;  // 重连次数
}

interface UseSSEData {
  connectedData: ConnectedEventData | null;  // 连接建立时的数据
  stateUpdates: StateUpdateEventData[];  // 状态更新事件数据
  testData: TestEventData | null;  // 测试消息
  latestMessage: { event: string; data: any } | null;  // 最新消息
}

interface UseSSEReturn {
  // 状态
  state: UseSSEState;
  data: UseSSEData;
  
  // 方法
  connect: (projectId: string) => void;
  disconnect: () => void;
  updateToken: () => void;
  clearData: () => void;
  
  // 客户端实例（高级用法）
  client: StructuringSSEClient | null;
}

export function useSSE(options: UseSSEOptions): UseSSEReturn {
  const {
    baseUrl,
    getToken,
    projectId,
    autoConnect = false,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000
  } = options;

  // SSE客户端实例
  const clientRef = useRef<StructuringSSEClient | null>(null);
  
  // 连接状态
  const [state, setState] = useState<UseSSEState>({
    isConnected: false,   
    connectionState: null,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0
  });

  // SSE数据状态
  const [data, setData] = useState<UseSSEData>({
    connectedData: null,
    stateUpdates: [],
    testData: null,
    latestMessage: null
  });

  // 创建SSE客户端
  const createClient = useCallback((token: string) => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    
    const client = createStructuringSSEClient(baseUrl, token);
    client.setReconnectConfig(maxReconnectAttempts, reconnectDelay);
    clientRef.current = client;
    
    return client;
  }, [baseUrl, maxReconnectAttempts, reconnectDelay]);

  // 创建事件处理器
  const createEventHandlers = useCallback((): SSEEventHandlers => ({
    onConnected: (connectedData: ConnectedEventData) => {
      console.log('SSE连接已建立:', connectedData);
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0
      }));
      setData(prev => ({
        ...prev,
        connectedData
      }));
    },

    onStateUpdate: (stateUpdate: StateUpdateEventData) => {
      console.log('收到状态更新:', stateUpdate);
      setData(prev => ({
        ...prev,
        stateUpdates: [...prev.stateUpdates, stateUpdate],
        latestMessage: { event: 'state_update', data: stateUpdate }
      }));
    },

    onTest: (testData: TestEventData) => {
      console.log('收到测试数据:', testData);
      setData(prev => ({
        ...prev,
        testData,
        latestMessage: { event: 'test', data: testData }
      }));
    },

    onError: (errorData: ErrorEventData) => {
      console.error('SSE错误:', errorData);
      setState(prev => ({
        ...prev,
        error: errorData.error,
        isConnecting: false
      }));
      setData(prev => ({
        ...prev,
        latestMessage: { event: 'error', data: errorData }
      }));
    },

    onMessage: (event: string, messageData: any) => {
      console.log('收到通用消息:', { event, data: messageData });
      setData(prev => ({
        ...prev,
        latestMessage: { event, data: messageData }
      }));
    },

    onClose: () => {
      console.log('SSE连接已关闭');
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionState: SSEConnectionState.CLOSED
      }));
    },

    onConnectionError: (error: Event) => {
      console.error('SSE连接错误:', error);
      setState(prev => ({
        ...prev,
        error: 'Connection error occurred',
        isConnecting: false,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));
    }
  }), []);

  // 连接函数
  const connect = useCallback((targetProjectId: string) => {
    if (!targetProjectId) {
      console.error('Project ID is required for SSE connection');
      return;
    }

    // 获取token
    const token = getToken ? getToken() : localStorage.getItem('token');
    if (!token) {
      setState(prev => ({
        ...prev,
        error: '未找到认证token,请重新登录',
        isConnecting: false
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isConnecting: true,
      error: null
    }));

    const client = createClient(token);
    const handlers = createEventHandlers();
    
    try {
      client.connect(targetProjectId, handlers);
      
      // 更新连接状态
      setState(prev => ({
        ...prev,
        connectionState: client.getConnectionState()
      }));
    } catch (error) {
      console.error('Failed to connect SSE:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection failed',
        isConnecting: false
      }));
    }
  }, [createClient, createEventHandlers, getToken]);

  // 断开连接函数
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionState: SSEConnectionState.CLOSED
      }));
    }
  }, []);

  // 更新token函数 - 现在重新连接以使用新token
  const updateToken = useCallback(() => {
    if (clientRef.current && clientRef.current.isConnected()) {
      const currentProjectId = projectId;
      if (currentProjectId) {
        // 先断开，然后重新连接
        disconnect();
        // 延迟一下再重连，确保断开完成
        setTimeout(() => {
          connect(currentProjectId);
        }, 100);
      }
    }
  }, [disconnect, connect, projectId]);

  // 清除数据函数
  const clearData = useCallback(() => {
    setData({
      connectedData: null,
      stateUpdates: [],
      testData: null,
      latestMessage: null
    });
  }, []);

  // 自动连接效果
  useEffect(() => {
    if (autoConnect && projectId) {
      connect(projectId);
    }

    // 清理函数
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [autoConnect, projectId, connect]);

  // 定期更新连接状态
  useEffect(() => {
    const interval = setInterval(() => {
      if (clientRef.current) {
        const connectionState = clientRef.current.getConnectionState();
        const isConnected = clientRef.current.isConnected();
        
        setState(prev => {
          if (prev.connectionState !== connectionState || prev.isConnected !== isConnected) {
            return {
              ...prev,
              connectionState,
              isConnected
            };
          }
          return prev;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    state,
    data,
    connect,
    disconnect,
    updateToken,
    clearData,
    client: clientRef.current
  };
}


