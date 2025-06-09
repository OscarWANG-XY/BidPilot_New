//React依赖
import React, { useState } from 'react';
import { StructuringSSEClient, SSEEventHandlers } from './SSE_api';

// 定义组件
const TestSSE: React.FC = () => {

    // 实例化
    const baseURL = 'http://localhost:8001'
    const token = localStorage.getItem('token')||'';
    const projectId = 'f6db0cbe-e7af-4300-8335-01ba4ffdbb93'
    const client = new StructuringSSEClient(baseURL, token);


    const [stateUpdates, setStateUpdates] = useState<string[]>([]);
    const [testMessages, setTestMessages] = useState<string[]>([]);

    // const [Connected, setConnected] = useState(false);
    // const [connectionError, setConnectionError] = useState<string|null>(null);


    // 连接测试
    // 以下显性定义了回调函数
    const handleConnect=()=>{
        console.log('🔌 执行handleConnect');
        const handlers: SSEEventHandlers = {
            onConnected: (data) => {
            console.log('✅ 连接成功:', data);
            alert(`SSE 已连接: ${data.message}`);
            // setConnected(true);
            // setConnectionError(null);
            },
            onStateUpdate: (data) => {
                console.log('📡 状态更新:', data);
                setStateUpdates((prev) => [...prev, `[${data.updatedProgress}%] ${data.message}`]);
              },
            onTest: (data) => {
                console.log('🧪 测试事件:', data);
                setTestMessages((prev) => [...prev, `[${data.timestamp}] ${data.message}`]);
            },
            // onClose: () => {
            //     console.warn('🔌 SSE 连接已关闭');
            //     setConnected(false);
            // },
            // onConnectionError: (error) => {
            //     console.error('❌ SSE 连接错误:', error);
            //     setConnected(false);
            //     setConnectionError('连接出错，正在重试...');
            // }
        };
        console.log('🔌 执行client.connect');
        client.connect(projectId, handlers);
    }


    const handleDisconnect=()=>{
        console.log('🔌 执行client.disconnect');
        client.disconnect();
        // setConnected(false);
        // setConnectionError(null);
    }

    

  // 组件的JSX渲染
  return (
    <div className="p-4">
        <h1 className="text-xl font-bold mb-2">SSE 测试</h1>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleConnect}>
            连接 SSE
        </button>

        <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleDisconnect}>
            断开 SSE
        </button>
        {/* <p>连接状态: {Connected ? '已连接' : '未连接'}</p>
        <p>连接错误: {connectionError || '无错误'}</p> */}


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