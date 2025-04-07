export class SSEService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  
  connect(channel: string) {
    if (this.eventSource) {
      this.disconnect();
    }
    
    this.eventSource = new EventSource(`/events/?channel=${channel}`);
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const eventType = data.type;
        const eventData = data.data;
        
        if (this.listeners.has(eventType)) {
          this.listeners.get(eventType)?.forEach(callback => {
            callback(eventData);
          });
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.disconnect();
      // 可以添加重连逻辑
      setTimeout(() => this.connect(channel), 5000);
    };
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
  
  addEventListener(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback);
  }
  
  removeEventListener(eventType: string, callback: (data: any) => void) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)?.delete(callback);
    }
  }
}

// 创建单例
export const sseService = new SSEService(); 