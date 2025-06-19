//React依赖
import React, { useEffect, useState } from 'react';
import {useQueries} from '@/_hooks/useProjectAgent/useQueries'
import {useSSE, SSEMessage} from '@/_hooks/useProjectAgent/useSSE'


interface BidPilotProps {
    projectId: string;
}


// 定义组件
const BidPilot: React.FC<BidPilotProps> = ({projectId}) => {
    // 获取SSE历史数据
    const {sseHistoryQuery} = useQueries(projectId)
    const {data: sseHistory, isLoading: isLoadingHistory, error: historyError} = sseHistoryQuery()
    
    // SSE连接管理
    const {
        connectionState, 
        isConnected, 
        isConnecting, 
        lastMessage,
        hasError,
        lastError,
        isReconnecting,
        reconnectAttempts,
        connect, 
        disconnect,
        subscribe, 
        subscribeToMessage,
        clearError, 
        subscribeToError,
    } = useSSE(projectId, {
        autoConnect: true, // 挂载后自动连接
        keepLastMessage: true,
        keepLastError: true,
        enableReconnect: true,
        maxReconnectAttempts: 3,
        reconnectDelay: 1000
    })

    // 实时消息列表状态
    const [realtimeMessages, setRealtimeMessages] = useState<SSEMessage[]>([])

    // 订阅实时消息
    useEffect(() => {
        // 订阅默认消息事件
        const unsubscribeMessage = subscribeToMessage((message: SSEMessage) => {
            console.log('收到实时消息:', message)
            setRealtimeMessages(prev => [...prev, message])
        })

        // 订阅特定事件类型（根据你的后端实现调整）
        const unsubscribeTest = subscribe('test', (message: SSEMessage) => {
            console.log('收到test消息:', message)
            setRealtimeMessages(prev => [...prev, message])
        })

        const unsubscribeConnected = subscribe('connected', (message: SSEMessage) => {
            console.log('收到连接确认消息:', message)
            setRealtimeMessages(prev => [...prev, message])
        })

        // 订阅错误处理
        const unsubscribeError = subscribeToError((error) => {
            console.error('SSE错误:', error)
        })

        // 清理函数
        return () => {
            unsubscribeMessage()
            unsubscribeTest()
            unsubscribeConnected()
            unsubscribeError()
        }
    }, [subscribe, subscribeToMessage, subscribeToError])

    // 渲染连接状态
    const renderConnectionStatus = () => {
        if (isConnecting || isReconnecting) {
            return (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded mb-4">
                    {isReconnecting ? `正在重连... (${reconnectAttempts}/3)` : '正在连接...'}
                </div>
            )
        }
        
        if (hasError) {
            return (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
                    <div>连接错误: {lastError?.message}</div>
                    <button 
                        onClick={clearError}
                        className="mt-2 bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                        清除错误
                    </button>
                </div>
            )
        }
        
        if (isConnected) {
            return (
                <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4">
                    ✅ SSE已连接
                </div>
            )
        }
        
        return (
            <div className="bg-gray-100 border border-gray-400 text-gray-700 px-3 py-2 rounded mb-4">
                未连接
            </div>
        )
    }

    // 渲染历史消息
    const renderHistoryMessages = () => {
        if (isLoadingHistory) {
            return <div className="text-gray-500">加载历史消息中...</div>
        }
        
        if (historyError) {
            return <div className="text-red-500">历史消息加载失败: {String(historyError)}</div>
        }
        
        if (!sseHistory || !sseHistory.messages || sseHistory.messages.length === 0) {
            return <div className="text-gray-500">暂无历史消息</div>
        }

        return (
            <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">历史消息:</h3>
                {sseHistory.messages.map((message, index) => (
                    <div key={`history-${index}`} className="bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                        <div className="text-xs text-gray-500 mb-1">
                            历史 - {message.event || 'message'} - {message.timestamp || 'unknown time'}
                        </div>
                        <div className="text-sm">
                            <pre className="whitespace-pre-wrap">{JSON.stringify(message.data, null, 2)}</pre>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // 渲染实时消息
    const renderRealtimeMessages = () => {
        if (realtimeMessages.length === 0) {
            return <div className="text-gray-500">暂无实时消息</div>
        }

        return (
            <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">实时消息:</h3>
                {realtimeMessages.map((message, index) => (
                    <div key={`realtime-${index}`} className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                        <div className="text-xs text-gray-500 mb-1">
                            实时 - {message.event} - {new Date().toLocaleTimeString()}
                        </div>
                        <div className="text-sm">
                            <pre className="whitespace-pre-wrap">{message.data}</pre>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    // 组件的JSX渲染
    return (
        <div className="p-0 pt-4 overflow-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">BidPilot</h1>
                <div className="flex gap-2">
                    <button
                        onClick={connect}
                        disabled={isConnected || isConnecting}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                    >
                        连接
                    </button>
                    <button
                        onClick={disconnect}
                        disabled={!isConnected}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                    >
                        断开
                    </button>
                </div>
            </div>

            {/* 连接状态 */}
            {renderConnectionStatus()}

            {/* 消息显示区域 */}
            <div className="space-y-6">
                {/* 历史消息 */}
                <div className="bg-white border rounded-lg p-4">
                    {renderHistoryMessages()}
                </div>

                {/* 实时消息 */}
                <div className="bg-white border rounded-lg p-4">
                    {renderRealtimeMessages()}
                </div>
            </div>

            {/* 调试信息 */}
            <div className="mt-6 p-4 bg-gray-50 rounded text-xs text-gray-600">
                <div>连接状态: {connectionState}</div>
                <div>项目ID: {projectId}</div>
                <div>历史消息数量: {sseHistory?.messages?.length || 0}</div>
                <div>实时消息数量: {realtimeMessages.length}</div>
                {lastMessage && (
                    <div>最后消息: {lastMessage.event} - {lastMessage.data}</div>
                )}
            </div>
        </div>
    );
};

//导出
export default BidPilot;