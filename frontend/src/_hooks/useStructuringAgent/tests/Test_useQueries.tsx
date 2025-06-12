
import { useQueries } from '../useQueries';

// 定义 Props 接口
interface Props {
    projectId: string;
}

// 方法2: 直接类型注解（推荐）
const TestAgentData = ({ projectId }: Props): JSX.Element => {
    // 使用 useQueries hook，传入必需的 projectId 参数
    const {
        agentStateQuery,
        sseHistoryQuery,
        refreshAgentState,
        refreshSSEHistory,
        clearProjectCache,
        queryKeys,
    } = useQueries(projectId);

    // 获取查询结果
    const agentState = agentStateQuery();
    const sseHistory = sseHistoryQuery();

    const handleRefreshAgentState = () => {
        console.log('🔄 刷新代理状态');
        refreshAgentState();
    };

    const handleRefreshSSEHistory = () => {
        console.log('🔄 刷新SSE历史记录');
        refreshSSEHistory();
    };

    const handleClearCache = () => {
        console.log('🗑️ 清除项目缓存');
        clearProjectCache();
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>useQueries 测试组件</h1>
            <p><strong>项目ID:</strong> {projectId}</p>
            
            {/* 代理状态查询结果 */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h3>🤖 代理状态查询</h3>
                <p><strong>加载中:</strong> {agentState.isLoading ? '是' : '否'}</p>
                <p><strong>获取中:</strong> {agentState.isFetching ? '是' : '否'}</p>
                <p><strong>错误:</strong> {agentState.isError ? '是' : '否'}</p>
                <p><strong>成功:</strong> {agentState.isSuccess ? '是' : '否'}</p>
                {agentState.error && (
                    <p style={{ color: 'red' }}>
                        <strong>错误信息:</strong> {String(agentState.error)}
                    </p>
                )}
                {agentState.data && (
                    <details>
                        <summary><strong>数据内容:</strong></summary>
                        <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
                            {JSON.stringify(agentState.data, null, 2)}
                        </pre>
                    </details>
                )}
                <button onClick={handleRefreshAgentState} style={{ marginTop: '10px' }}>
                    刷新代理状态
                </button>
            </div>

            {/* SSE历史记录查询结果 */}
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h3>📜 SSE历史记录查询</h3>
                <p><strong>加载中:</strong> {sseHistory.isLoading ? '是' : '否'}</p>
                <p><strong>获取中:</strong> {sseHistory.isFetching ? '是' : '否'}</p>
                <p><strong>错误:</strong> {sseHistory.isError ? '是' : '否'}</p>
                <p><strong>成功:</strong> {sseHistory.isSuccess ? '是' : '否'}</p>
                {sseHistory.error && (
                    <p style={{ color: 'red' }}>
                        <strong>错误信息:</strong> {String(sseHistory.error)}
                    </p>
                )}
                {sseHistory.data && (
                    <details>
                        <summary><strong>数据内容:</strong></summary>
                        <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
                            {JSON.stringify(sseHistory.data, null, 2)}
                        </pre>
                    </details>
                )}
                <button onClick={handleRefreshSSEHistory} style={{ marginTop: '10px' }}>
                    刷新SSE历史
                </button>
            </div>

            {/* 操作按钮 */}
            <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h3>🔧 操作面板</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={handleClearCache} style={{ color: 'red' }}>
                        清除项目缓存
                    </button>
                </div>
                
                <div style={{ marginTop: '15px' }}>
                    <h4>查询键信息:</h4>
                    <p><strong>代理状态键:</strong> {JSON.stringify(queryKeys.agentState(projectId))}</p>
                    <p><strong>SSE历史键:</strong> {JSON.stringify(queryKeys.sseHistory(projectId))}</p>
                </div>
            </div>
        </div>
    );
};

export default TestAgentData;