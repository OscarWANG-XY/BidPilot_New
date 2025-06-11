
 //纯净的SSE API层 - 只负责底层EventSource连接管理
 //不包含任何业务逻辑、重连策略或状态管理

// const TOKEN = localStorage.getItem('token') || ''
// const BASE_URL = window.location.origin
// const PROJECT_ID = 'f6db0cbe-e7af-4300-8335-01ba4ffdbb93'

  
  // 事件监听器类型
  export type SSEEventListener = (event: MessageEvent) => void;
  export type SSEErrorListener = (event: Event) => void;
  export type SSEOpenListener = (event: Event) => void;
 
  // SSE客户端类
  export class BaseSSEClient {
    private eventSource: EventSource | null = null;
    private eventListeners: Map<string, Set<SSEEventListener>> = new Map();  // 用来存储消息事件监听函数的集合
    private errorListeners: Set<SSEErrorListener> = new Set();  // 用来存储错误事件监听函数的集合
    private openListeners: Set<SSEOpenListener> = new Set();  // 用来存储连接打开事件监听函数的集合
    private url: string = '';
  
    constructor(public projectId: string) {
      const TOKEN = localStorage.getItem('token') || ''
      const BASE_URL = window.location.origin
      this.url = `${BASE_URL}/fastapi/api/v1/structuring/sse/${projectId}?token=${TOKEN}`
    }

    //建立SSE连接, 返回EventSource实例
    connect(): EventSource {
      // 如果已有连接，先关闭
      if (this.eventSource) {
        this.close();
      }
  
      // const url = `${BASE_URL}/fastapi/api/v1/structuring/sse/${PROJECT_ID}?token=${TOKEN}`
      try {
        this.eventSource = new EventSource(this.url);
  
        // 设置内置事件监听器
        this.setupInternalListeners();
  
        return this.eventSource;
      } catch (error) {
        throw new Error(`Failed to create SSE connection: ${error}`);
      }

    }
  
    //添加连接打开事件监听器(EventSource不存在原生的方法,所以需要自定义)
    // listener - 监听函数
    addOpenListener(listener: SSEOpenListener): void {
        this.openListeners.add(listener);
      }


    //对原生EventSource的addEventListener()的封装和增强. 
    addEventListener(eventType: string, listener: SSEEventListener): void {
      if (!this.eventSource) {
        throw new Error('SSE connection not established. Call connect() first.');
      }
  
      // 内部跟踪监听器
      // 如果没有该事件类型,先创建一个该事件类型的空集合. 
      if (!this.eventListeners.has(eventType)) {
        this.eventListeners.set(eventType, new Set());
      }
      this.eventListeners.get(eventType)!.add(listener);
  
      // 注册到EventSource
      this.eventSource.addEventListener(eventType, listener);
    }
  
     //更细颗粒度操作: 在连接的情况下,移除 具体的事件监听器
    // eventType - 事件类型
    // listener - 事件监听函数
    removeEventListener(eventType: string, listener: SSEEventListener): void {
      if (!this.eventSource) {
        return;
      }
  
      // 从内部跟踪中移除
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(eventType);
        }
      }
  
      // 从EventSource移除
      this.eventSource.removeEventListener(eventType, listener);
    }
  
    //更细颗粒度操作: 在连接的情况下,移除 具体的连接监听器 (close()后, 无法再移除)
    // listener - 监听函数
    removeOpenListener(listener: SSEOpenListener): void {
      this.openListeners.delete(listener);
    }
  
    //添加错误事件监听器 (close()后, 无法再移除)
    // listener - 监听函数
    addErrorListener(listener: SSEErrorListener): void {
      this.errorListeners.add(listener);
    }
  
     //更细颗粒度操作: 在连接的情况下,移除 具体的错误监听器 (close()后, 无法再移除)
    // listener - 监听函数
    removeErrorListener(listener: SSEErrorListener): void {
      this.errorListeners.delete(listener);
    }
  
    //关闭SSE连接 (close()本身有clear()的功能,不需要使用上面removeXXXListener()的工具)
    close(): void {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
  
      // 清理监听器跟踪
      this.eventListeners.clear();
      this.errorListeners.clear();
      this.openListeners.clear();
    }
  
    //获取连接状态, 连接状态枚举值，如果未连接返回null
    getReadyState(): number | null {
        if (!this.eventSource) {
            return null;
        }
        return this.eventSource.readyState;
    }
  
    //检查是否已连接
    isConnected(): boolean {
      return this.eventSource?.readyState === EventSource.OPEN;
    }
  
    //检查是否正在连接
    isConnecting(): boolean {
      return this.eventSource?.readyState === EventSource.CONNECTING;
    }
  
    //检查连接是否已关闭
    isClosed(): boolean {
      return !this.eventSource || this.eventSource.readyState === EventSource.CLOSED;
    }

    //获取当前连接的URL
    getUrl(): string | null {
      return this.eventSource?.url || null;
    }

    //检查EventSource实例是否存在
    hasEventSource(): boolean {
      return this.eventSource !== null;
    }
  
    ///设置内置事件监听器, 将用户注册的监听器分发到对应的事件
    private setupInternalListeners(): void {
      if (!this.eventSource) return;
  
      // 连接打开事件
      this.eventSource.onopen = (event) => {
        this.openListeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error('Error in open listener:', error);
          }
        });
      };
  
      // 连接错误事件
      this.eventSource.onerror = (event) => {
        this.errorListeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error('Error in error listener:', error);
          }
        });
      };

      // 这里无需使用onmessage再做分发了, 前面已经用了addEventListener()处理了. 

    }
  }
  