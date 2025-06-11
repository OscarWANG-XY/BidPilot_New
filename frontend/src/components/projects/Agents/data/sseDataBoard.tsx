import React from 'react';
import { useSSE } from '@/_hooks/useStructuringAgent/useSSE';

interface SSEDataBoardProps {
  projectId: string;
}

const SSEDataBoard: React.FC<SSEDataBoardProps> = ({ projectId }) => {
    
  // 使用useSSE hook获取实时SSE数据
  const {
    state,
    data,
    connect,
    disconnect,
    clearData
  } = useSSE({
    baseUrl: process.env.REACT_APP_SSE_BASE_URL || 'http://localhost:8001', // 配置SSE服务地址
    // token: 'your-auth-token', // 实际应用中从认证状态获取
    projectId,
    autoConnect: true, // 自动连接
    maxReconnectAttempts: 5,
    reconnectDelay: 2000
  });

  // 数据派生计算
  const derivedData = React.useMemo(() => {
    const { stateUpdates, latestMessage, connectedData, testData } = data;
    const { isConnected, isConnecting, error, reconnectAttempts } = state;

    return {
      // SSE连接状态
      connectionStatus: isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected',
      isActive: isConnected && !error,
      hasError: !!error,
      
      // SSE数据统计
      totalStateUpdates: stateUpdates.length,
      latestStateUpdate: stateUpdates[stateUpdates.length - 1] || null,
      hasRecentActivity: !!latestMessage,
      lastActivity: latestMessage?.event || 'none',
      
      // 连接信息
      connectedProjectId: connectedData?.projectId,
      connectedUserId: connectedData?.userId,
      reconnectCount: reconnectAttempts,
      
      // 测试数据
      hasTestData: !!testData,
      testMessage: testData?.message,
      
      // 原始数据（用于调试）
      rawState: state,
      rawData: data
    };
  }, [state, data]);

  // 手动连接控制
  const handleConnect = () => {
    if (projectId) {
      connect(projectId);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleClearData = () => {
    clearData();
  };

  // 渲染连接状态指示器
  const renderConnectionStatus = () => {
    const { connectionStatus, hasError, reconnectCount } = derivedData;
    
    let statusColor = 'gray';
    let statusText = 'Disconnected';
    
    switch (connectionStatus) {
      case 'connected':
        statusColor = 'green';
        statusText = 'Connected';
        break;
      case 'connecting':
        statusColor = 'orange';
        statusText = 'Connecting...';
        break;
      case 'disconnected':
        statusColor = hasError ? 'red' : 'gray';
        statusText = hasError ? 'Error' : 'Disconnected';
        break;
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div 
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: statusColor
          }}
        />
        <span>{statusText}</span>
        {reconnectCount > 0 && (
          <span style={{ color: 'orange', fontSize: '12px' }}>
            (重连: {reconnectCount})
          </span>
        )}
      </div>
    );
  };

  // 渲染最新消息
  const renderLatestMessage = () => {
    if (!data.latestMessage) {
      return <p>暂无消息</p>;
    }

    const { event, data: messageData } = data.latestMessage;
    
    return (
      <div style={{ border: '1px solid #eee', padding: '8px', borderRadius: '4px' }}>
        <p><strong>事件类型:</strong> {event}</p>
        <p><strong>时间:</strong> {new Date().toLocaleTimeString()}</p>
        <details>
          <summary>查看数据</summary>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(messageData, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  // 渲染状态更新历史
  const renderStateUpdates = () => {
    if (data.stateUpdates.length === 0) {
      return <p>暂无状态更新</p>;
    }

    return (
      <div>
        <p>共 {data.stateUpdates.length} 条状态更新</p>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {data.stateUpdates.slice(-5).map((update, index) => (
            <div key={index} style={{ 
              border: '1px solid #ddd', 
              margin: '4px 0', 
              padding: '8px',
              fontSize: '12px'
            }}>
              <div><strong>状态:</strong> {update.internalState || 'unknown'}</div>
              <div><strong>进度:</strong> {update.progress || 0}%</div>
              <div><strong>消息:</strong> {update.message || 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3>--- SSE Data Board (实时数据) ---</h3>
      
      {/* 连接控制 */}
      <div style={{ marginBottom: '16px' }}>
        <h4>连接控制</h4>
        {renderConnectionStatus()}
        <div style={{ marginTop: '8px', gap: '8px', display: 'flex' }}>
          <button onClick={handleConnect} disabled={derivedData.isActive}>
            连接
          </button>
          <button onClick={handleDisconnect} disabled={!derivedData.isActive}>
            断开
          </button>
          <button onClick={handleClearData}>
            清除数据
          </button>
        </div>
        {state.error && (
          <p style={{ color: 'red', fontSize: '12px' }}>
            错误: {state.error}
          </p>
        )}
      </div>

      {/* 连接信息 */}
      <div style={{ marginBottom: '16px' }}>
        <h4>连接信息</h4>
        <p>项目ID: {derivedData.connectedProjectId || projectId}</p>
        <p>用户ID: {derivedData.connectedUserId || 'N/A'}</p>
        <p>连接状态: {derivedData.connectionStatus}</p>
      </div>

      {/* 实时数据统计 */}
      <div style={{ marginBottom: '16px' }}>
        <h4>数据统计</h4>
        <p>状态更新数: {derivedData.totalStateUpdates}</p>
        <p>最近活动: {derivedData.lastActivity}</p>
        <p>测试数据: {derivedData.hasTestData ? '有' : '无'}</p>
        {derivedData.testMessage && (
          <p>测试消息: {derivedData.testMessage}</p>
        )}
      </div>

      {/* 最新消息 */}
      <div style={{ marginBottom: '16px' }}>
        <h4>最新消息</h4>
        {renderLatestMessage()}
      </div>

      {/* 状态更新历史 */}
      <div style={{ marginBottom: '16px' }}>
        <h4>状态更新历史 (最近5条)</h4>
        {renderStateUpdates()}
      </div>

      {/* 开发时数据展示 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginTop: '20px', 
          border: '1px solid #ddd', 
          padding: '10px', 
          color: 'red', 
          backgroundColor: 'white' 
        }}>
          <h4>Debug Info - SSE原始数据:</h4>
          <details>
            <summary>查看状态 (state)</summary>
            <pre>{JSON.stringify(derivedData.rawState, null, 2)}</pre>
          </details>
          <details>
            <summary>查看数据 (data)</summary>
            <pre>{JSON.stringify(derivedData.rawData, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default SSEDataBoard;
