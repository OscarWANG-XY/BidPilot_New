//React依赖
import React, { useState, useEffect } from 'react';
import { StructuringSSEClient, SSEEventHandlers, SSEConnectionState } from './SSE_api';

// 定义组件
const TestSSE: React.FC = () => {

    // 实例化 - 使用useState确保实例在组件生命周期内保持一致
    const baseURL = 'http://localhost:8001'
    const token = localStorage.getItem('token')||'';
    const projectId = 'f6db0cbe-e7af-4300-8335-01ba4ffdbb93'
    
    // 使用useState来管理client实例，确保它不会在每次渲染时重新创建
    const [client] = useState(() => new StructuringSSEClient(baseURL, token));

    const [stateUpdates, setStateUpdates] = useState<string[]>([]);
    const [testMessages, setTestMessages] = useState<string[]>([]);

    // 手动状态管理（用于UI反馈）
    const [Connected, setConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string|null>(null);
    
    // 真实连接状态（从client获取）
    const [realConnectionState, setRealConnectionState] = useState<number | null>(null);

    // 获取连接状态的辅助函数
    const getConnectionStateText = (state: number | null): string => {
        if (state === null) return '未初始化';
        switch (state) {
            case SSEConnectionState.CONNECTING: return '连接中';
            case SSEConnectionState.OPEN: return '已连接';
            case SSEConnectionState.CLOSED: return '已关闭';
            default: return '未知状态';
        }
    };

    // 刷新真实连接状态
    const refreshRealConnectionState = () => {
        const state = client.getConnectionState();
        const isConnected = client.isConnected();
        setRealConnectionState(state);
        console.log('🔍 当前真实连接状态:', state, getConnectionStateText(state), 'isConnected:', isConnected);
    };

    // 定时刷新连接状态
    useEffect(() => {
        const interval = setInterval(() => {
            refreshRealConnectionState();
        }, 1000); // 每秒检查一次

        // 组件卸载时清理定时器和连接
        return () => {
            clearInterval(interval);
            client.disconnect(); // 确保组件卸载时断开连接
        };
    }, [client]);


    // 连接测试
    // 以下显性定义了回调函数
    const handleConnect=()=>{
        console.log('🔌 执行handleConnect');
        const handlers: SSEEventHandlers = {
            onConnected: (data) => {
            console.log('✅ 连接成功:', data);
            alert(`SSE 已连接: ${data.message}`);
            setConnected(true);
            setConnectionError(null);
            refreshRealConnectionState(); // 立即刷新真实状态
            },
            onStateUpdate: (data) => {
                console.log('📡 状态更新:', data);
                setStateUpdates((prev) => [...prev, `[${data.updatedProgress}%] ${data.message}`]);
              },
            onTest: (data) => {
                console.log('🧪 测试事件:', data);
                setTestMessages((prev) => [...prev, `[${data.timestamp}] ${data.message}`]);
            },
            onClose: () => {
                console.log('🔌 SSE 连接已关闭');
                setConnected(false);
                alert('SSE 连接已断开');
                refreshRealConnectionState(); // 立即刷新真实状态
            },
            onConnectionError: (error) => {
                console.error('❌ SSE 连接错误:', error);
                setConnected(false);
                setConnectionError('连接出错，正在重试...');
                refreshRealConnectionState(); // 立即刷新真实状态
            }
        };
        console.log('🔌 执行client.connect');
        client.connect(projectId, handlers);
        
        // 连接后立即刷新状态
        setTimeout(() => refreshRealConnectionState(), 100);
    }


    const handleDisconnect=()=>{
        console.log('🔌 执行client.disconnect');
        client.disconnect();
        setConnected(false);
        setConnectionError(null);
        refreshRealConnectionState(); // 立即刷新真实状态
    }

    // 手动检查连接状态
    const handleCheckStatus = () => {
        refreshRealConnectionState();
        const isConnected = client.isConnected();
        const state = client.getConnectionState();
        console.log('🔍 isConnected()返回:', isConnected);
        console.log('🔍 getConnectionState()返回:', state);
        alert(`手动检查结果:\n连接状态: ${getConnectionStateText(state)}\nisConnected(): ${isConnected}\nEventSource实例: ${client.hasEventSource() ? '存在' : '不存在'}`);
    };

    

  // 组件的JSX渲染
  return (
    <div className="p-4">
        <h1 className="text-xl font-bold mb-2">SSE 测试</h1>
        
        <div className="space-x-2 mb-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleConnect}>
                连接 SSE
            </button>

            <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleDisconnect}>
                断开 SSE
            </button>
            
            <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={handleCheckStatus}>
                检查状态
            </button>
        </div>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">连接状态信息</h3>
            <p className="font-medium">手动状态: <span className={Connected ? 'text-green-600' : 'text-red-600'}>{Connected ? '已连接' : '未连接'}</span></p>
            <p className="font-medium">真实状态: <span className={realConnectionState === SSEConnectionState.OPEN ? 'text-green-600' : 'text-red-600'}>{getConnectionStateText(realConnectionState)}</span> (状态码: {realConnectionState})</p>
            <p className="font-medium">isConnected(): <span className={client.isConnected() ? 'text-green-600' : 'text-red-600'}>{client.isConnected() ? 'true' : 'false'}</span></p>
            {connectionError && <p className="text-red-500">连接错误: {connectionError}</p>}
        </div>


        <div className="mt-4">
            <h2 className="text-lg font-semibold">状态更新</h2>
            <ul className="list-disc ml-6">
                {stateUpdates.map((msg, idx) => (
                <li key={idx}>{msg}</li>
                ))}
            </ul>
        </div>

        <div className="mt-4">
            <h2 className="text-lg font-semibold">测试消息</h2>
            <ul className="list-disc ml-6">
                {testMessages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
                ))}
            </ul>
        </div>

    </div>
  );
};

//导出
export default TestSSE;