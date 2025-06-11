import { useEffect, useRef, useState, useCallback } from 'react'
import { BaseSSEClient } from '@/_api/structuring_agent_api/sse_api'

// 连接状态枚举
export enum SSEConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting', 
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Hook 的基础配置接口
export interface UseSSEConfig {
  autoConnect?: boolean  // 是否自动连接，默认 true
}

// Hook 返回值接口
export interface UseSSEReturn {
  // 状态
  connectionState: SSEConnectionState
  isConnected: boolean
  isConnecting: boolean
  
  // 操作方法
  connect: () => void
  disconnect: () => void
}

/**
 * useSSE Hook - 第一步：基础连接管理
 * 
 * 核心功能：
 * 1. 管理 SSE 连接的生命周期
 * 2. 提供连接状态的响应式更新
 * 3. 自动处理组件卸载时的清理
 */


export function useSSE(projectId: string, config: UseSSEConfig = {}): UseSSEReturn {

  // 解构赋值，同时使用true作为默认值
  const { autoConnect = true } = config
  
  // SSE 客户端实例引用
  // 整个生命周期返回同一个引用，适用于与渲染无关的持久化对象上。 
  // 虽然useState也存储实例，但state的修改（比如连接，重连）会触发组件的重新渲染， 所以这里用useRef更合适 
  // useRef的实质是多包裹了一层current（唯一属性）, 所以即时改 ref.current 的值, 外层的ref被组件感知的仍是同一个。 
  // 反过来多了这一层，初始化也就变成了两步。 
  const clientRef = useRef<BaseSSEClient | null>(null)
  
  // 连接状态
  const [connectionState, setConnectionState] = useState<SSEConnectionState>(
    SSEConnectionState.DISCONNECTED
  )
  
  // 初始化客户端实例（这里只是定义了一个函数，没有运行，到connect被调用时才真的运行）
  const initializeClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new BaseSSEClient(projectId)
    }
    return clientRef.current 
  }, []) // 没有依赖，这里和不添加 [] 是一样的, 而添加[]更明确
  
  // 连接方法 (这个是一个依赖函数，被初始化，但不会自动运行，真正运行要等到useEffect中调用)
  const connect = useCallback(() => {

    const client = initializeClient() 
    
    // 防止重复连接
    if (client.isConnected() || client.isConnecting()) {
      return
    }
    
    try {
      // 1.开始连接前，设置为"正在连接"状态
      setConnectionState(SSEConnectionState.CONNECTING)
      
      // 2. 注册监听器（这些不会立即执行），执行是在connect以后，在onopen 和 onerror的位置触发（在API里）。  
      const handleOpen = () => {
        setConnectionState(SSEConnectionState.CONNECTED) // 连接成功时执行
      }
      
      const handleError = (event: Event) => {
        console.error('SSE connection error:', event)
        setConnectionState(SSEConnectionState.ERROR)   // 连接失败时执行
      }
      
      // 添加监听器
      client.addOpenListener(handleOpen)  // 在SSE_API里，我们定义了Open事件监听在onopen时触发。 
      client.addErrorListener(handleError) // 在SSE_API里，我们定义了Error事件监听在onerror时触发。 
      
      // 建立连接
      client.connect()
      
    } catch (error) {
      console.error('Failed to connect SSE:', error)
      setConnectionState(SSEConnectionState.ERROR)
    }
    // 在这个例子里，虽然initalizeClient永远不会变，但不添加出现： react的规范错误， ESlint错误，技术上不必要，但规范上必须声明。
    // 规范：react要求useCallback的依赖数组必须包含函数体内所使用的所有响应式值，即重新渲染时可能改变的值。 
    // 响应式值包括： state, props, 计算值， 函数返回值， 非响应式如useRef返回的值， 最后是普通常量。
  }, [initializeClient]) 
  
  // 断开连接方法
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.close()
      setConnectionState(SSEConnectionState.DISCONNECTED)
    }
  }, [])
  
  // 自动连接效果 (真正开始执行)
  useEffect(() => {
    if (autoConnect) {
      connect()
    }
    
    // 组件卸载时自动清理(防泄漏)
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])
  
  // 计算派生状态
  const isConnected = connectionState === SSEConnectionState.CONNECTED
  const isConnecting = connectionState === SSEConnectionState.CONNECTING
  
  return {
    // 状态
    connectionState,
    isConnected,
    isConnecting,
    
    // 操作方法
    connect,
    disconnect
  }
}