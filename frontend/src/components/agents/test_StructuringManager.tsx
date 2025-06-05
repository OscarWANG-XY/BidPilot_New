// StructuringManager 完整使用示例

import React, { useState, useEffect, useRef } from 'react';
import { StructuringManager, SSEEventHandler } from '@/_api/agent_api/structuring_api_SSE';

export interface StructuringManagerProps {
  projectId: string;
}

// SSE消息类型定义
interface SSEMessage {
  id: string;
  timestamp: Date;
  type: 'connected' | 'state_update' | 'error' | 'close';
  data: any;
  message?: string;
}

// 状态详情接口
interface StateDetails {
  internalState?: string;
  userState?: string;
  progress?: number;
  message?: string;
  error?: string;
  [key: string]: any;
}

const AnalysisComponent: React.FC<StructuringManagerProps> = ({ projectId }) => {
  // const [projectId] = useState('project-123');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // 新增：SSE消息跟踪状态
  const [sseMessages, setSseMessages] = useState<SSEMessage[]>([]);
  const [currentStateDetails, setCurrentStateDetails] = useState<StateDetails>({});
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  
  // 使用 useRef 保持 manager 实例和消息容器引用
  const managerRef = useRef<StructuringManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sseMessages]);

  // 添加SSE消息到历史记录
  const addSSEMessage = (type: SSEMessage['type'], data: any, message?: string) => {
    const newMessage: SSEMessage = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type,
      data,
      message
    };
    
    setSseMessages(prev => [...prev.slice(-49), newMessage]); // 保持最新50条消息
    setMessageCount(prev => prev + 1);
    setLastUpdateTime(new Date());
  };

  // 清空消息历史
  const clearMessages = () => {
    setSseMessages([]);
    setMessageCount(0);
  };

  // 1. 初始化 Manager
  useEffect(() => {
    managerRef.current = new StructuringManager(projectId);
    
    // 组件卸载时清理
    return () => {
      if (managerRef.current) {
        managerRef.current.closeSSE();
      }
    };
  }, [projectId]);

  // 2. 定义事件处理器
  const createSSEHandlers = (): SSEEventHandler => ({
    onConnected: (projectId) => {
      console.log('✅ SSE连接成功:', projectId);
      setIsConnected(true);
      setError(null);
      
      // 添加到消息历史
      addSSEMessage('connected', { projectId }, `SSE连接成功: ${projectId}`);
    },
    
    onStateUpdate: (data) => {
      console.log('📊 状态更新:', data);
      setProgress(data.progress || 0);
      setStatus(data.userState || 'processing');
      
      // 更新状态详情
      setCurrentStateDetails(data);
      
      // 添加到消息历史
      addSSEMessage('state_update', data, 
        `状态更新: ${data.userState || 'unknown'} (${data.progress || 0}%)`);
      
      // 根据状态更新UI
      if (data.userState === 'completed') {
        setStatus('completed');
        // 可以触发其他逻辑，如数据刷新
      }
    },
    
    onError: (error) => {
      console.error('❌ SSE错误:', error);
      setError(error);
      setIsConnected(false);
      
      // 添加到消息历史
      addSSEMessage('error', { error }, `SSE错误: ${error}`);
    },
    
    onClose: () => {
      console.log('🔌 SSE连接关闭');
      setIsConnected(false);
      
      // 添加到消息历史
      addSSEMessage('close', {}, 'SSE连接已关闭');
    }
  });

  // 3. 开始分析
  const handleStartAnalysis = async () => {
    if (!managerRef.current) return;
    
    try {
      setStatus('starting');
      setError(null);
      
      const response = await managerRef.current.startAnalysisWithSSE(
        createSSEHandlers()
      );
      
      console.log('🚀 分析启动:', response);
      setStatus('processing');
    } catch (error: any) {
      console.error('❌ 启动失败:', error);
      setError(error.message);
      setStatus('error');
    }
  };

  // 4. 重试分析
  const handleRetryAnalysis = async () => {
    if (!managerRef.current) return;
    
    try {
      setError(null);
      const response = await managerRef.current.retryAnalysis();
      console.log('🔄 重试成功:', response);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // 5. 编辑文档
  const handleEditDocument = async (document: Record<string, any>) => {
    if (!managerRef.current) return;
    
    try {
      const response = await managerRef.current.editDocument(
        document, 
        '用户修改了文档'
      );
      console.log('📝 文档编辑成功:', response);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // 6. 手动获取状态
  const handleGetStatus = async () => {
    if (!managerRef.current) return;
    
    try {
      const statusData = await managerRef.current.getStatus();
      console.log('📊 当前状态:', statusData);
      setProgress(statusData.progress);
      setStatus(statusData.userState);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // 7. 断开连接
  const handleDisconnect = () => {
    if (managerRef.current) {
      managerRef.current.closeSSE();
      setIsConnected(false);
      setStatus('disconnected');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">分析管理器示例</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：原有的控制面板 */}
        <div className="space-y-6">
          {/* 状态显示 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">控制面板</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">项目ID:</span> {projectId}
              </div>
              <div>
                <span className="font-medium">连接状态:</span> 
                <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                  {isConnected ? '已连接' : '未连接'}
                </span>
              </div>
              <div>
                <span className="font-medium">分析状态:</span> {status}
              </div>
              <div>
                <span className="font-medium">进度:</span> {progress}%
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* 错误显示 */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              ❌ {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleStartAnalysis}
                disabled={status === 'processing'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                🚀 开始分析
              </button>
              
              <button
                onClick={handleRetryAnalysis}
                disabled={!isConnected}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                🔄 重试分析
              </button>
              
              <button
                onClick={handleGetStatus}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                📊 获取状态
              </button>
              
              <button
                onClick={handleDisconnect}
                disabled={!isConnected}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                🔌 断开连接
              </button>
            </div>

            <button
              onClick={() => handleEditDocument({ 
                title: '测试文档', 
                content: '这是编辑的内容' 
              })}
              disabled={!isConnected}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              📝 编辑文档示例
            </button>
          </div>
        </div>

        {/* 右侧：新增的SSE实时信息展示模块 */}
        <div className="space-y-6">
          {/* SSE连接状态概览 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-blue-800">SSE实时监控</h3>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? '实时连接' : '连接断开'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">消息总数:</span> {messageCount}
              </div>
              <div>
                <span className="font-medium">最后更新:</span> 
                <span className="text-gray-600">
                  {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : '无'}
                </span>
              </div>
            </div>
          </div>

          {/* 当前状态详情 */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-green-800">当前状态详情</h3>
              <button
                onClick={clearMessages}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                清空日志
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              {currentStateDetails.internalState && (
                <div>
                  <span className="font-medium">内部状态:</span> 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {currentStateDetails.internalState}
                  </span>
                </div>
              )}
              {currentStateDetails.userState && (
                <div>
                  <span className="font-medium">用户状态:</span> 
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    {currentStateDetails.userState}
                  </span>
                </div>
              )}
              {currentStateDetails.message && (
                <div>
                  <span className="font-medium">消息:</span> 
                  <span className="text-gray-700">{currentStateDetails.message}</span>
                </div>
              )}
              {currentStateDetails.progress !== undefined && (
                <div>
                  <span className="font-medium">进度:</span> 
                  <span className="text-gray-700">{currentStateDetails.progress}%</span>
                </div>
              )}
            </div>
          </div>

          {/* SSE消息历史 */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-3">实时消息日志</h3>
            
            <div className="h-64 overflow-y-auto bg-black text-green-400 rounded p-3 font-mono text-xs">
              {sseMessages.length === 0 ? (
                <div className="text-gray-500">等待SSE消息...</div>
              ) : (
                sseMessages.map((msg) => (
                  <div key={msg.id} className="mb-2 border-b border-gray-700 pb-1">
                    <div className="flex justify-between items-start">
                      <span className={`font-bold ${
                        msg.type === 'connected' ? 'text-green-400' :
                        msg.type === 'state_update' ? 'text-blue-400' :
                        msg.type === 'error' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        [{msg.type.toUpperCase()}]
                      </span>
                      <span className="text-gray-500 text-xs">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {msg.message && (
                      <div className="text-white mt-1">{msg.message}</div>
                    )}
                    
                    {/* 显示详细数据 */}
                    <details className="mt-1">
                      <summary className="text-gray-400 cursor-pointer hover:text-white">
                        详细数据
                      </summary>
                      <pre className="text-gray-300 mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisComponent;