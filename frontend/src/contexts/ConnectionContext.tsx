// src/contexts/ConnectionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 定义连接状态类型
type ConnectionStatus = 'connected' | 'unstable' | 'disconnected';
type SyncStatus = 'synced' | 'syncing' | 'failed';

// 定义上下文类型
interface ConnectionContextType {
  isConnected: boolean;
  isStable: boolean;
  connectionStatus: ConnectionStatus;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  checkConnection: () => Promise<boolean>;
}

// 创建上下文，设置默认值
const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: true,
  isStable: true,
  connectionStatus: 'connected',
  syncStatus: 'synced',
  lastSyncTime: null,
  checkConnection: async () => true,
});

// Provider Props 类型
interface ConnectionProviderProps {
  children: ReactNode;
  pingEndpoint?: string;
  stableThreshold?: number; // 连续成功次数阈值，用于判断连接稳定性
  checkInterval?: number; // 检查间隔（毫秒）
  onStatusChange?: (status: ConnectionStatus) => void; // 状态变化回调
}

// 连接提供者组件
export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({
  children,
  pingEndpoint = '/api/ping',
  stableThreshold = 3,
  checkInterval = 30000, // 默认30秒
  onStatusChange,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [successiveChecks, setSuccessiveChecks] = useState(stableThreshold);

  // 连接检查函数
  const checkConnection = async (): Promise<boolean> => {
    try {
      setSyncStatus('syncing');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch(pingEndpoint, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const connected = response.ok;
      
      if (connected) {
        // 更新连续成功次数
        const newSuccessiveChecks = Math.min(successiveChecks + 1, stableThreshold + 1);
        setSuccessiveChecks(newSuccessiveChecks);
        
        // 更新连接状态
        const newStatus: ConnectionStatus = 
          newSuccessiveChecks >= stableThreshold ? 'connected' : 'unstable';
          
        if (newStatus !== connectionStatus) {
          setConnectionStatus(newStatus);
          onStatusChange?.(newStatus);
        }
        
        setLastSyncTime(new Date());
        setSyncStatus('synced');
      } else {
        setSuccessiveChecks(0);
        setSyncStatus('failed');
        
        if (connectionStatus !== 'disconnected') {
          setConnectionStatus('disconnected');
          onStatusChange?.('disconnected');
        }
      }
      
      return connected;
    } catch (error) {
      setSuccessiveChecks(0);
      setSyncStatus('failed');
      
      if (connectionStatus !== 'disconnected') {
        setConnectionStatus('disconnected');
        onStatusChange?.('disconnected');
      }
      
      console.error('Connection check failed:', error);
      return false;
    }
  };

  // 初始连接检查
  useEffect(() => {
    checkConnection();
  }, []);

  // 定期检查连接
  useEffect(() => {
    const intervalId = setInterval(checkConnection, checkInterval);
    return () => clearInterval(intervalId);
  }, [checkInterval, successiveChecks, connectionStatus]);

  // 计算派生状态
  const isConnected = connectionStatus !== 'disconnected';
  const isStable = connectionStatus === 'connected';

  // 提供上下文值
  const contextValue: ConnectionContextType = {
    isConnected,
    isStable,
    connectionStatus,
    syncStatus,
    lastSyncTime,
    checkConnection,
  };

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
};

// 使用连接上下文的钩子
export const useConnection = () => useContext(ConnectionContext);

// 连接保护状态钩子
export function useConnectionProtectedState<T>(
  initialState: T,
  onChange?: (newState: T) => void,
  options?: {
    requireStable?: boolean; // 是否要求稳定连接才能更新
    validateChange?: (oldState: T, newState: T) => boolean; // 自定义验证函数
  }
): [T, (newState: T | ((prevState: T) => T)) => Promise<void>] {
  const [state, setState] = useState<T>(initialState);
  const [pendingState, setPendingState] = useState<T | null>(null);
  const { isConnected, isStable, checkConnection } = useConnection();
  
  const { requireStable = false, validateChange } = options || {};
  
  // 更新状态（带连接保护）
  const updateState = async (newState: T | ((prevState: T) => T)) => {
    // 解析新状态值
    const resolvedNewState = typeof newState === 'function' 
      ? (newState as ((prevState: T) => T))(state)
      : newState;
      
    // 如果新状态与当前相同，则跳过
    if (JSON.stringify(resolvedNewState) === JSON.stringify(state)) {
      return;
    }
    
    // 如果提供了验证函数，则验证更改
    if (validateChange && !validateChange(state, resolvedNewState)) {
      console.warn('状态变更验证失败', { oldState: state, newState: resolvedNewState });
      return;
    }
    
    // 检查连接
    const connected = await checkConnection();
    
    if (!connected) {
      // 存储待处理的变更
      setPendingState(resolvedNewState);
      console.log('连接已断开，状态更改已存储为待处理');
      return;
    }
    
    // 如果要求稳定连接但连接不稳定
    if (requireStable && !isStable) {
      // 存储待处理的变更
      setPendingState(resolvedNewState);
      console.log('连接不稳定，状态更改已存储为待处理');
      return;
    }
    
    // 应用更改
    setState(resolvedNewState);
    
    // 如果提供了onChange回调，则调用
    if (onChange) {
      onChange(resolvedNewState);
    }
  };
  
  // 在连接恢复时尝试应用待处理的状态更改
  useEffect(() => {
    if (pendingState && isConnected && (!requireStable || isStable)) {
      setState(pendingState);
      
      // 调用onChange回调
      if (onChange) {
        onChange(pendingState);
      }
      
      // 清除待处理状态
      setPendingState(null);
      console.log('连接已恢复，已应用待处理的状态更改');
    }
  }, [isConnected, isStable, pendingState, onChange, requireStable]);
  
  return [state, updateState];
}

// 连接状态指示器组件
export const ConnectionStatusIndicator: React.FC = () => {
  const { connectionStatus, lastSyncTime, syncStatus } = useConnection();
  
  let statusColor = 'text-green-500';
  let statusText = '已连接';
  
  if (connectionStatus === 'disconnected') {
    statusColor = 'text-red-500';
    statusText = '已断开连接';
  } else if (connectionStatus === 'unstable') {
    statusColor = 'text-yellow-500';
    statusText = '连接不稳定';
  }
  
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${statusColor}`} />
      <span className="text-sm">{statusText}</span>
      {lastSyncTime && (
        <span className="text-xs text-gray-500">
          最后同步: {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
      {syncStatus === 'syncing' && (
        <span className="text-xs text-blue-500 animate-pulse">正在同步...</span>
      )}
    </div>
  );
};