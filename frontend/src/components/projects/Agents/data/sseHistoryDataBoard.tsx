import React from 'react';
import { useQueries } from '@/_hooks/useStructuringAgent.ts/useQueries';

interface StructuringAgentProps {
  projectId: string;
}

const SSEHistoryDataBoard: React.FC<StructuringAgentProps> = ({
  projectId
}) => {
  // 获取查询hook实例
  const {sseHistoryQuery } = useQueries();


  const {
    data: sseHistoryData,
    isLoading: isSSEHistoryLoading,
    error: sseHistoryError
  } = sseHistoryQuery(projectId);




  // 数据派生计算
  const derivedData = React.useMemo(() => {

    // 添加详细的调试信息
    // console.log('🔍 完整的sseHistoryData:', JSON.stringify(sseHistoryData, null, 2));
    // console.log('🔍 sseHistoryData的类型:', typeof sseHistoryData);
    // console.log('🔍 sseHistoryData的所有键:', sseHistoryData ? Object.keys(sseHistoryData) : 'null/undefined');
    // console.log('🔍 sseHistoryData?.sseHistory:', sseHistoryData?.messages);


    const sseHistory = sseHistoryData?.messages || [];

    return {

      // SSE数据分析
      latestSSEMessage: sseHistory[sseHistory.length - 1],
      errorMessages: sseHistory.filter(msg => msg.event === 'error'),
      stateUpdateMessages: sseHistory.filter(msg => msg.event === 'state_update'),
      
      // 状态标识
      hasData: !!(sseHistory.length > 0),  //双！！！ 表示强制转换为布尔值， ！也是转布尔值，但取反
      isLoading: isSSEHistoryLoading,
      hasError: !!(sseHistoryError),
      
      // 统计信息
      totalSSEMessages: sseHistory.length,
      lastMessageTime: sseHistory[sseHistory.length - 1]?.timestamp,
    };
  }, [sseHistoryData, isSSEHistoryLoading, sseHistoryError]);

  // 简单的渲染逻辑 - 专注数据展示
  if (derivedData.isLoading) {
    return <div>Loading project {projectId}...</div>;
  }

  if (derivedData.hasError) {
    const errorMessage = [
      sseHistoryError && `SSE历史错误: ${sseHistoryError.message}`
    ].filter(Boolean).join('; ');
    
    return (
      <div>
        <p>Error: {errorMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h3>--- SSE History Data Board ---</h3>
      {/* SSE历史数据 */}
      <div>
        <h4>SSE History</h4>
        <p>Total Messages: {derivedData.totalSSEMessages}</p>
        <p>State Updates: {derivedData.stateUpdateMessages.length}</p>
        <p>Errors: {derivedData.errorMessages.length}</p>
        <p>Latest Message: {derivedData.lastMessageTime}</p>
      </div>

      {/* 数据可用性指示 */}
      <div>
        <p>Data Available: {derivedData.hasData ? 'Yes' : 'No'}</p>
      </div>


    {/* 开发时数据展示 */}
    {process.env.NODE_ENV === 'development' && (
      <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '10px', color: 'red', backgroundColor: 'white' }}>
        <h4>Debug Info - sseHistoryData原始数据:</h4>
        <pre>{JSON.stringify(sseHistoryData, null, 2)}</pre>
      </div>
    )}
    </div>

  );
};

export default SSEHistoryDataBoard;