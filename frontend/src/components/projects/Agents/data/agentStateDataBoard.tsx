import React from 'react';
import { useQueries } from '@/_hooks/useStructuringAgent/useQueries';

interface StructuringAgentProps {
  projectId: string;
}

const AgentStateDataBoard: React.FC<StructuringAgentProps> = ({
  projectId
}) => {
  // 获取查询hook实例
  const { agentStateQuery } = useQueries();

  // 执行查询
  const {
    data: agentStateData,
    isLoading: isAgentStateLoading,
    error: agentStateError
  } = agentStateQuery(projectId);


  // 数据派生计算
  const derivedData = React.useMemo(() => {
    const agentState = agentStateData?.agentState;

    return {
      // 基础数据
      currentState: agentState?.state,
      progress: agentState?.overallProgress || 0,
      lastUpdated: agentState?.updatedAt,
      
      
      // 状态标识
      hasData: !!(agentState),  //双！！！ 表示强制转换为布尔值， ！也是转布尔值，但取反
      isLoading: isAgentStateLoading,
      hasError: !!(agentStateError),
    };
  }, [agentStateData, isAgentStateLoading, agentStateError]);

  // 简单的渲染逻辑 - 专注数据展示
  if (derivedData.isLoading) {
    return <div>Loading project {projectId}...</div>;
  }

  if (derivedData.hasError) {
    const errorMessage = [
      agentStateError && `Agent状态错误: ${agentStateError.message}`,
    ].filter(Boolean).join('; ');
    
    return (
      <div>
        <p>Error: {errorMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <h3>--- Agent State Data Board ---</h3>
      
      {/* Agent状态数据 */}
      <div>
        <h4>Agent State</h4>
        <p>State: {derivedData.currentState}</p>
        <p>Progress: {derivedData.progress}%</p>
        <p>Last Updated: {derivedData.lastUpdated}</p>
      </div>

      {/* 数据可用性指示 */}
      <div>
        <p>Data Available: {derivedData.hasData ? 'Yes' : 'No'}</p>
      </div>
    {/* 开发时数据展示 */}
    {process.env.NODE_ENV === 'development' && (
      <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '10px', color: 'red', backgroundColor: 'white' }}>
        <h4>Debug Info - agentStateData原始数据:</h4>
        <pre>{JSON.stringify(agentStateData, null, 2)}</pre>
      </div>
    )}
    </div>
  );
};

export default AgentStateDataBoard;