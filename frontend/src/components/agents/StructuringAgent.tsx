import React, { useState, useEffect, useRef } from 'react';
import { Play, Edit3, Check, AlertCircle, Loader2, X } from 'lucide-react';
import { 
  StructuringManager, 
  SSEEventHandler, 
  SSEEventData,
  StateStatusResponse 
} from '../../_api/agent_api/structuring_api_SSE';

// 定义消息类型
interface WorkflowMessage {
  id: string;
  type: 'status' | 'result' | 'error';
  content: string;
  timestamp: Date;
  status: 'processing' | 'completed' | 'waiting' | 'confirmed' | 'edited' | 'error';
  needsInput?: boolean;
  inputType?: 'confirmation' | 'edit';
  data?: any;
}

interface StructuringAgentProps {
  projectId: string;
}

const StructuringAgent: React.FC<StructuringAgentProps> = ({ projectId }) => {
  const [messages, setMessages] = useState<WorkflowMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<StateStatusResponse | null>(null);
  const [structuringManager, setStructuringManager] = useState<StructuringManager | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初始化StructuringManager
  useEffect(() => {
    if (projectId) {
      const manager = new StructuringManager(projectId);
      setStructuringManager(manager);
      
      return () => {
        manager.closeSSE();
      };
    }
  }, [projectId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 添加消息到列表
  const addMessage = (message: Omit<WorkflowMessage, 'id' | 'timestamp'>) => {
    const newMessage: WorkflowMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  // 更新消息
  const updateMessage = (messageId: string, updates: Partial<WorkflowMessage>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates }
          : msg
      )
    );
  };

  // SSE事件处理器
  const sseHandlers: SSEEventHandler = {
    onConnected: (connectedProjectId) => {
      console.log('SSE连接成功:', connectedProjectId);
      setIsConnected(true);
      addMessage({
        type: 'status',
        content: '已连接到AI工作流系统',
        status: 'completed'
      });
    },

    onStateUpdate: (data) => {
      console.log('状态更新:', data);
      
      // 更新当前状态
      if (data.userState || data.internalState) {
        setCurrentStatus(prev => ({
          projectId: data.projectId || projectId,
          userState: data.userState || prev?.userState || '',
          internalState: data.internalState || prev?.internalState || '',
          progress: data.progress || prev?.progress || 0,
          message: data.message || prev?.message
        }));
      }

      // 根据不同的状态添加相应的消息
      if (data.message) {
        let messageType: WorkflowMessage['type'] = 'status';
        let messageStatus: WorkflowMessage['status'] = 'processing';
        let needsInput = false;

        // 根据用户状态判断消息类型和是否需要用户输入
        if (data.userState) {
          switch (data.userState) {
            case 'waiting_for_document_edit':
              messageType = 'result';
              messageStatus = 'waiting';
              needsInput = true;
              break;
            case 'analysis_completed':
              messageType = 'result';
              messageStatus = 'completed';
              break;
            case 'error':
              messageType = 'error';
              messageStatus = 'error';
              break;
            default:
              messageType = 'status';
              messageStatus = 'processing';
          }
        }

        addMessage({
          type: messageType,
          content: data.message,
          status: messageStatus,
          needsInput,
          inputType: needsInput ? 'confirmation' : undefined,
          data: data
        });
      }
    },

    onError: (error) => {
      console.error('SSE错误:', error);
      setIsConnected(false);
      addMessage({
        type: 'error',
        content: `连接错误: ${error}`,
        status: 'error'
      });
    },

    onClose: () => {
      console.log('SSE连接关闭');
      setIsConnected(false);
      addMessage({
        type: 'status',
        content: 'AI工作流连接已断开',
        status: 'completed'
      });
    }
  };

  // 开始分析
  const startAnalysis = async () => {
    if (!structuringManager) {
      console.error('StructuringManager未初始化');
      return;
    }

    try {
      addMessage({
        type: 'status',
        content: '正在启动AI工作流...',
        status: 'processing'
      });

      const response = await structuringManager.startAnalysisWithSSE(sseHandlers);
      
      addMessage({
        type: 'status',
        content: `工作流启动成功: ${response.message}`,
        status: 'completed'
      });

    } catch (error: any) {
      console.error('启动分析失败:', error);
      addMessage({
        type: 'error',
        content: `启动失败: ${error.message}`,
        status: 'error'
      });
      setIsConnected(false);
    }
  };

  // 处理用户确认
  const handleConfirm = async (messageId: string) => {
    updateMessage(messageId, { status: 'confirmed', needsInput: false });
    
    if (!structuringManager) return;

    try {
      // 如果是文档编辑确认，可以继续后续流程
      const response = await structuringManager.retryAnalysis();
      
      addMessage({
        type: 'status',
        content: `继续执行: ${response.message}`,
        status: 'processing'
      });
    } catch (error: any) {
      console.error('确认操作失败:', error);
      addMessage({
        type: 'error',
        content: `操作失败: ${error.message}`,
        status: 'error'
      });
    }
  };

  // 处理用户编辑
  const handleEdit = async (messageId: string, newContent: string, messageData?: any) => {
    updateMessage(messageId, { content: newContent, status: 'edited' });
    
    if (!structuringManager || !messageData) return;

    try {
      // 如果有文档数据，进行编辑提交
      if (messageData.document || messageData.data) {
        await structuringManager.editDocument(
          messageData.document || messageData.data,
          newContent
        );
        
        addMessage({
          type: 'status',
          content: '文档编辑已提交，继续分析...',
          status: 'processing'
        });
      }
    } catch (error: any) {
      console.error('编辑提交失败:', error);
      addMessage({
        type: 'error',
        content: `编辑失败: ${error.message}`,
        status: 'error'
      });
    }
  };

  // 断开连接
  const disconnect = () => {
    if (structuringManager) {
      structuringManager.closeSSE();
      setIsConnected(false);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: WorkflowMessage['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'waiting':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'edited':
        return <Edit3 className="w-4 h-4 text-purple-500" />;
      case 'error':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // 消息组件
  const MessageItem: React.FC<{ message: WorkflowMessage }> = ({ message }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    const handleSave = () => {
      handleEdit(message.id, editContent, message.data);
      setIsEditing(false);
    };

    return (
      <div className={`mb-6 p-4 rounded-lg border-l-4 ${
        message.type === 'status' 
          ? 'bg-gray-50 border-l-gray-400' 
          : message.type === 'error'
          ? 'bg-red-50 border-l-red-400'
          : 'bg-blue-50 border-l-blue-400'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon(message.status)}
            <span className="text-sm text-gray-500">
              {message.timestamp.toLocaleTimeString()}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              message.type === 'status' 
                ? 'bg-gray-200 text-gray-700' 
                : message.type === 'error'
                ? 'bg-red-200 text-red-700'
                : 'bg-blue-200 text-blue-700'
            }`}>
              {message.type === 'status' ? '状态' : message.type === 'error' ? '错误' : '结果'}
            </span>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存修改
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-gray-800 whitespace-pre-line mb-3">
              {message.content}
            </div>
            
            {message.needsInput && message.status !== 'confirmed' && message.status !== 'edited' && (
              <div className="flex space-x-3 pt-3 border-t">
                <button
                  onClick={() => handleConfirm(message.id)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4 mr-2" />
                  确认结果
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  编辑内容
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col bg-white">
      {/* 头部 */}
      <div className="flex-shrink-0 bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">AI结构化分析工作流</h1>
            <p className="text-sm text-gray-500">项目ID: {projectId}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* 连接状态 */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
              isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {isConnected ? '已连接' : '未连接'}
              </span>
            </div>
            
            {/* 进度显示 */}
            {currentStatus && currentStatus.progress > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentStatus.progress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{currentStatus.progress}%</span>
              </div>
            )}
            
            {/* 操作按钮 */}
            {!isConnected ? (
              <button
                onClick={startAnalysis}
                disabled={!projectId}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-2" />
                开始分析
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                断开连接
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>点击"开始分析"启动AI结构化分析流程</p>
              <p className="text-sm mt-2">系统将自动分析文档并提供结构化结果</p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StructuringAgent;