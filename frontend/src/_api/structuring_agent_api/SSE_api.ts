// 定义SSE事件数据结构, 与Bidlyzer后端定义的Schema的数据结构一致. 
interface SSEEventData {
  event: string;
  data: any;
}

interface ConnectedEventData {
  projectId: string;
  userId: string;
  message: string;
}

// 对应后端Schema的StateUpdateEvent.data部分
interface StateUpdateEventData {
  projectId: string;
  fromState?: string;
  toState: string;
  updatedProgress: number;
  message: string;
}


interface TestEventData {
  projectId: string;
  message: string;
  timestamp: string;
}

interface ErrorEventData {
  projectId: string;
  error?: string;              // 保留：向后兼容
  errorAtState?: string;       // 新增：对应error_at_state
  errorAtProgress?: number;    // 新增：对应error_at_progress
  errorType?: string;          // 新增：对应error_type
  errorMessage?: string;       // 新增：对应error_message
  message?: string;            // 新增：统一的消息字段
}


// 事件回调的函数集合
// 作用: 当服务端通过SSE推送消息到前端,根据事件类型触发用户定义的回调函数,从而实现自定义处理逻辑. 
// handler的格式: 行为Key:(data)=>void, 其中,Key对应, onConnected, onStatusUpdate 等, 而void可以换成不同函数;  
// ?表示都可选的,用户可选择指调用部分函数. 
interface SSEEventHandlers {
  onConnected?: (data: ConnectedEventData) => void;
  onStateUpdate?: (data: StateUpdateEventData) => void;
  onTest?: (data: TestEventData) => void;
  onError?: (data: ErrorEventData) => void;
  onMessage?: (event: string, data: any) => void;
  onClose?: () => void;
  onConnectionError?: (error: Event) => void;
}

export class StructuringSSEClient {
  private eventSource: EventSource | null = null;
  private handlers: SSEEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second
  private baseUrl: string;
  private token: string;
  private currentProjectId: string | null = null;
  
  // constructor好比python类的__init__方法, 在创建实例时自动调用, 初始化实例的属性. 
  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }


  // 连接到SSE流, 其中SSEEventHandlers定义了事件处理函数, 它们在处理信息handleMessage()里,根据事件类型调用. 
  connect(projectId: string, handlers: SSEEventHandlers = {}): void {
    this.currentProjectId = projectId;
    this.handlers = handlers;
    this.createConnection(projectId);
  }

  private createConnection(projectId: string): void {
    try {
      // 构建URL，添加token参数
      // 在JWT+HTTPS的场景下,密钥安全有保障.
      const url = `${this.baseUrl}/api/v1/structuring/sse/${projectId}?token=${encodeURIComponent(this.token)}`;
      
      // 创建EventSource
      this.eventSource = new EventSource(url);

      // 监听连接打开事件
      this.eventSource.onopen = () => {
        console.log(`SSE连接已建立 - 项目: ${projectId}`);
        this.reconnectAttempts = 0; // 重置重连计数
      };

      // 监听消息事件
      this.eventSource.onmessage = (event) => {
        try {
          const sseData: SSEEventData = JSON.parse(event.data);
          this.handleMessage(sseData);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      // 监听错误事件
      this.eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error);
        
        if (this.handlers.onConnectionError) {
          this.handlers.onConnectionError(error);
        }

        // 尝试重连
        this.handleReconnect(projectId);
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      if (this.handlers.onConnectionError) {
        this.handlers.onConnectionError(error as Event);
      }
    }
  }

  // 处理接收到的消息, 根据事件类型调用不同的handler回调函数来处理.  
  private handleMessage(sseData: SSEEventData): void {
    const { event, data } = sseData;

    switch (event) {
      case 'connected':
        if (this.handlers.onConnected) {
          this.handlers.onConnected(data as ConnectedEventData);
        }
        break;

      case 'state_update':
        if (this.handlers.onStateUpdate) {
          this.handlers.onStateUpdate(data as StateUpdateEventData);
        }
        break;

      case 'test':
        if (this.handlers.onTest) {
          this.handlers.onTest(data as TestEventData);
        }
        break;

      case 'error':
        if (this.handlers.onError) {
          this.handlers.onError(data as ErrorEventData);
        }
        break;

      default:
        // 通用消息处理器
        if (this.handlers.onMessage) {
          this.handlers.onMessage(event, data);
        }
        console.log('Received SSE message:', { event, data });
        break;
    }
  }

  // 重连, 在eventSource.onerror里调用, 所以连接失败时会自动触发重连. 
  private handleReconnect(projectId: string): void {
    //如果还未达到重试的最大上限
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      // 先断开现有连接
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      

      setTimeout(() => {
        this.createConnection(projectId);
      }, this.reconnectDelay * this.reconnectAttempts); // 递增延迟, 其中reconnectDelay上面定义了1秒.
    } else {
      console.error('SSE重连次数已达上限');
      if (this.handlers.onClose) {
        this.handlers.onClose();
      }
    }
  }

  // 断开SSE连接 (它会调用handler的onClose回调函数)
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close(); // 关闭EventSource 连接
      this.eventSource = null;
      console.log('SSE连接已断开');
      
      // 如果定义了handler.onClose, 则调用它. 
      if (this.handlers.onClose) {
        this.handlers.onClose(); // 调用onClose回调函数
      }
    }
    this.reconnectAttempts = 0;
  }

  // 获取连接状态
  getConnectionState(): number | null {
    return this.eventSource?.readyState ?? null;
  }

  // 检查是否已连接, 根据连接状态来检查
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  // 检查EventSource实例是否存在
  hasEventSource(): boolean {
    return this.eventSource !== null;
  }

  // 更新认证token, 如果当前已连接, 则断开连接, 然后重新连接. 
  updateToken(newToken: string): void {
    this.token = newToken;
    // 如果当前已连接，重新连接以使用新token
    if (this.isConnected() && this.currentProjectId) {
      const projectId = this.currentProjectId;
      const handlers = this.handlers;
      this.disconnect();
      this.connect(projectId, handlers);
    }
  }

  // 设置重连配置, 其中maxAttempts是最大重试次数, delay是重试间隔时间. 
  setReconnectConfig(maxAttempts: number, delay: number): void {
    this.maxReconnectAttempts = maxAttempts;
    this.reconnectDelay = delay;
  }
}

/**
 * 创建SSE客户端实例的工厂函数
 */
export function createStructuringSSEClient(baseUrl: string, token: string): StructuringSSEClient {
  return new StructuringSSEClient(baseUrl, token);
}

/**
 * SSE连接状态枚举
 */
export enum SSEConnectionState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSED = 2
}

// 导出类型定义
export type {
  SSEEventData,
  ConnectedEventData,
  StateUpdateEventData,
  TestEventData,
  ErrorEventData,
  SSEEventHandlers,
};
