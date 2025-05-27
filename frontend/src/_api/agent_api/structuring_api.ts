import fastApiInstance from '../axios_instance_fa';

// ========================= 类型定义 =========================

export interface StartAnalysisRequest {
  projectId: string;
}

export interface StartAnalysisResponse {
  success: boolean;
  message: string;
  projectId: string;
  initialState: string;
}

export interface EditDocumentRequest {
  projectId: string;
  document: Record<string, any>;
  userNotes?: string;
}

export interface EditDocumentResponse {
  success: boolean;
  message: string;
  projectId: string;
}

export interface RetryAnalysisRequest {
  projectId: string;
}

export interface RetryAnalysisResponse {
  success: boolean;
  message: string;
  projectId: string;
  currentState: string;
}

export interface StateStatusResponse {
  projectId: string;
  userState: string;
  internalState: string;
  progress: number;
  message?: string;
}

export interface SSEEventData {
  event: string;
  data: {
    projectId: string;
    internalState?: string;
    userState?: string;
    progress?: number;
    message?: string;
    error?: string;
    [key: string]: any;
  };
}

// ========================= HTTP API 端点 =========================

export class StructuringAPI {
  
  /**
   * 开始分析
   */
  static async startAnalysis(request: StartAnalysisRequest): Promise<StartAnalysisResponse> {
    try {
      console.log('🚀 [Structuring] 开始分析:', request);
      
      const response = await fastApiInstance.post('/structuring/start-analysis', request);
      
      console.log('✅ [Structuring] 分析启动成功:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Structuring] 启动分析失败:', error);
      throw new Error(error.response?.data?.detail || '启动分析失败');
    }
  }

  /**
   * 编辑文档
   */
  static async editDocument(request: EditDocumentRequest): Promise<EditDocumentResponse> {
    try {
      console.log('📝 [Structuring] 编辑文档:', request.projectId);
      
      const response = await fastApiInstance.post('/structuring/edit-document', request);
      
      console.log('✅ [Structuring] 文档编辑成功:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Structuring] 编辑文档失败:', error);
      throw new Error(error.response?.data?.detail || '编辑文档失败');
    }
  }

  /**
   * 重试分析
   */
  static async retryAnalysis(request: RetryAnalysisRequest): Promise<RetryAnalysisResponse> {
    try {
      console.log('🔄 [Structuring] 重试分析:', request);
      
      const response = await fastApiInstance.post('/structuring/retry-analysis', request);
      
      console.log('✅ [Structuring] 重试启动成功:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Structuring] 重试分析失败:', error);
      throw new Error(error.response?.data?.detail || '重试分析失败');
    }
  }

  /**
   * 获取状态
   */
  static async getStatus(projectId: string): Promise<StateStatusResponse> {
    try {
      console.log('📊 [Structuring] 获取状态:', projectId);
      
      const response = await fastApiInstance.get(`/structuring/status/${projectId}`);
      
      console.log('✅ [Structuring] 状态获取成功:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Structuring] 获取状态失败:', error);
      throw new Error(error.response?.data?.detail || '获取状态失败');
    }
  }
}

// ========================= SSE 连接管理 =========================

export interface SSEEventHandler {
  onConnected?: (projectId: string) => void;
  onStateUpdate?: (data: SSEEventData['data']) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export class StructuringSSE {
    // private 表示私有属性，只能在StructuringSSE类内部访问 
  private eventSource: EventSource | null = null;   // 可能是EventSource对象 或 null
  private projectId: string;
  private handlers: SSEEventHandler;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒
  private isManualClose = false;

  // 构造函数，用于初始化，好比__init__()函数， this.好比self. 
  constructor(projectId: string, handlers: SSEEventHandler) {
    this.projectId = projectId;
    this.handlers = handlers;
  }

  /**
   * 连接SSE流
   */
  connect(): void {
    try {
      this.isManualClose = false;
      
      // 获取认证token
      const token = localStorage.getItem('token');
      if (!token) {
        this.handlers.onError?.('未找到认证token，请重新登录');
        return;
      }

      // 构建SSE URL - 方案1: 通过URL参数传递token（推荐用于开发测试）
      const baseUrl = window.location.origin;
      const sseUrl = `${baseUrl}/fastapi/api/v1/structuring/sse/${this.projectId}?token=${encodeURIComponent(token)}`;
      
      // 方案2: 如果后端支持cookie认证，可以这样构建URL
      // const sseUrl = `${baseUrl}/fastapi/api/v1/structuring/sse/${this.projectId}`;
      
      console.log('🔌 [Structuring SSE] 连接中:', sseUrl.replace(/token=[^&]+/, 'token=***'));
      
      // 创建EventSource连接
      // 注意：EventSource不支持自定义headers，所以我们通过URL参数传递token
      this.eventSource = new EventSource(sseUrl);
      
      // 连接成功
      this.eventSource.onopen = () => {
        console.log('✅ [Structuring SSE] 连接成功');
        this.reconnectAttempts = 0;
      };

      // 接收消息
      this.eventSource.onmessage = (event) => {
        try {
          console.log('📨 [Structuring SSE] 原始消息:', event.data);
          const eventData: SSEEventData = JSON.parse(event.data);
          console.log('📨 [Structuring SSE] 解析后消息:', eventData);
          
          this.handleSSEEvent(eventData);
        } catch (error) {
          console.error('❌ [Structuring SSE] 解析消息失败:', error);
          console.error('❌ [Structuring SSE] 原始消息内容:', event.data);
          this.handlers.onError?.('消息解析失败');
        }
      };

      // 连接错误
      this.eventSource.onerror = (error) => {
        console.error('❌ [Structuring SSE] 连接错误:', error);
        
        // 检查是否是认证错误（401）
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          // 可能是认证失败，尝试刷新token
          this.handleAuthError();
          return;
        }
        
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 [Structuring SSE] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          setTimeout(() => {
            this.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        } else {
          this.handlers.onError?.('SSE连接失败');
        }
      };

    } catch (error) {
      console.error('❌ [Structuring SSE] 创建连接失败:', error);
      this.handlers.onError?.('创建SSE连接失败');
    }
  }

  /**
   * 处理认证错误
   */
  private async handleAuthError(): Promise<void> {
    try {
      console.log('🔄 [Structuring SSE] 检测到认证错误，尝试刷新token');
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        this.handlers.onError?.('认证失败，请重新登录');
        return;
      }

      // 使用axios刷新token（复用现有逻辑）
      const response = await fetch('/api/auth/token/refresh/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access);
        
        // 重新连接
        console.log('✅ [Structuring SSE] Token刷新成功，重新连接');
        setTimeout(() => this.connect(), 1000);
      } else {
        this.handlers.onError?.('Token刷新失败，请重新登录');
      }
      
    } catch (error) {
      console.error('❌ [Structuring SSE] Token刷新失败:', error);
      this.handlers.onError?.('认证失败，请重新登录');
    }
  }

  /**
   * 处理SSE事件
   */
  private handleSSEEvent(eventData: SSEEventData): void {
    const { event, data } = eventData;

    // 验证数据结构
    if (!event) {
      console.error('❌ [Structuring SSE] 消息缺少event字段:', eventData);
      return;
    }

    if (!data) {
      console.error('❌ [Structuring SSE] 消息缺少data字段:', eventData);
      return;
    }

    switch (event) {
      case 'connected':
        console.log('🎉 [Structuring SSE] 连接确认');
        if (data.projectId) {
          this.handlers.onConnected?.(data.projectId);
        } else {
          console.error('❌ [Structuring SSE] 连接确认消息缺少projectId');
        }
        break;

      case 'state_update':
        console.log('📊 [Structuring SSE] 状态更新:', data);
        this.handlers.onStateUpdate?.(data);
        break;

      case 'error':
        console.error('❌ [Structuring SSE] 服务器错误:', data.error);
        this.handlers.onError?.(data.error || '服务器错误');
        break;

      default:
        console.log('📨 [Structuring SSE] 未知事件:', event, data);
        // 对于未知事件，也尝试作为状态更新处理
        this.handlers.onStateUpdate?.(data);
        break;
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.isManualClose = true;
    
    if (this.eventSource) {
      console.log('🔌 [Structuring SSE] 关闭连接');
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.handlers.onClose?.();
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * 获取连接状态
   */
  getReadyState(): number | null {
    return this.eventSource?.readyState || null;
  }
}

// ========================= 便捷方法 =========================

/**
 * 创建SSE连接的便捷方法
 */
export function createStructuringSSE(
  projectId: string, 
  handlers: SSEEventHandler
): StructuringSSE {
  return new StructuringSSE(projectId, handlers);
}

/**
 * 完整的分析流程管理器
 */
export class StructuringManager {
  private projectId: string;
  private sse: StructuringSSE | null = null;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * 开始分析并监听进度
   */
  async startAnalysisWithSSE(handlers: SSEEventHandler): Promise<StartAnalysisResponse> {
    // 先建立SSE连接
    this.sse = createStructuringSSE(this.projectId, handlers);
    this.sse.connect();

    // 等待连接建立
    await new Promise((resolve) => {
      const originalOnConnected = handlers.onConnected;
      handlers.onConnected = (projectId) => {
        originalOnConnected?.(projectId);
        resolve(void 0);
      };
    });

    // 开始分析
    return await StructuringAPI.startAnalysis({ projectId: this.projectId });
  }

  /**
   * 重试分析
   */
  async retryAnalysis(): Promise<RetryAnalysisResponse> {
    return await StructuringAPI.retryAnalysis({ projectId: this.projectId });
  }

  /**
   * 编辑文档
   */
  async editDocument(document: Record<string, any>, userNotes?: string): Promise<EditDocumentResponse> {
    return await StructuringAPI.editDocument({
      projectId: this.projectId,
      document,
      userNotes
    });
  }

  /**
   * 获取状态
   */
  async getStatus(): Promise<StateStatusResponse> {
    return await StructuringAPI.getStatus(this.projectId);
  }

  /**
   * 关闭SSE连接
   */
  closeSSE(): void {
    if (this.sse) {
      this.sse.close();
      this.sse = null;
    }
  }

  /**
   * 检查SSE连接状态
   */
  isSSEConnected(): boolean {
    return this.sse?.isConnected() || false;
  }
}

// ========================= 导出 =========================

export default {
  StructuringAPI,
  StructuringSSE,
  StructuringManager,
  createStructuringSSE
};
