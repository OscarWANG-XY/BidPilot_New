import React from 'react';
import { useQueries } from '../useQueries'; // 请根据实际路径调整


interface TestQueriesProps {
  projectId: string;
}

const TestQueries: React.FC<TestQueriesProps> = ({projectId}) => {

  
  const {
    agentStateQuery,
    sseHistoryQuery,
    refreshAgentState,
    refreshSSEHistory,
    clearProjectCache,
  } = useQueries(projectId);

  const agentState = agentStateQuery();
  const sseHistory = sseHistoryQuery();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 查询钩子测试面板</h2>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={refreshAgentState} style={{ marginRight: '10px', padding: '8px 15px' }}>
          🔄 刷新代理状态
        </button>
        <button onClick={refreshSSEHistory} style={{ marginRight: '10px', padding: '8px 15px' }}>
          🔄 刷新SSE历史
        </button>
        <button onClick={clearProjectCache} style={{ padding: '8px 15px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '3px' }}>
          🗑️ 清除缓存
        </button>
      </div>

      {/* 代理状态查询结果 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>🤖 代理状态查询</h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', border: '1px solid #dee2e6' }}>
          <p><strong>加载状态:</strong> {agentState.isLoading ? '⏳ 加载中...' : '✅ 完成'}</p>
          <p><strong>获取状态:</strong> {agentState.isFetching ? '🔄 获取中...' : '💤 空闲'}</p>
          <p><strong>错误状态:</strong> {agentState.error ? '❌ 有错误' : '✅ 正常'}</p>
          
          {agentState.error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              <strong>错误信息:</strong> {String(agentState.error)}
            </div>
          )}
          
          {agentState.data && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📊 查看数据</summary>
              <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '3px', overflow: 'auto', fontSize: '12px' }}>
                {JSON.stringify(agentState.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      {/* SSE历史查询结果 */}
      <div>
        <h3>📡 SSE历史查询</h3>
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', border: '1px solid #dee2e6' }}>
          <p><strong>加载状态:</strong> {sseHistory.isLoading ? '⏳ 加载中...' : '✅ 完成'}</p>
          <p><strong>获取状态:</strong> {sseHistory.isFetching ? '🔄 获取中...' : '💤 空闲'}</p>
          <p><strong>错误状态:</strong> {sseHistory.error ? '❌ 有错误' : '✅ 正常'}</p>
          
          {sseHistory.error && (
            <div style={{ color: 'red', marginTop: '10px' }}>
              <strong>错误信息:</strong> {String(sseHistory.error)}
            </div>
          )}
          
          {sseHistory.data && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📊 查看数据</summary>
              <pre style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '3px', overflow: 'auto', fontSize: '12px' }}>
                {JSON.stringify(sseHistory.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestQueries;