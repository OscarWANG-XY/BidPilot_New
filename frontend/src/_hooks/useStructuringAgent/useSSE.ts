import { useEffect, useRef, useState, useCallback } from 'react'
import { BaseSSEClient, SSEEventListener } from '@/_api/structuring_agent_api/sse_api'

// 连接状态枚举
export enum SSEConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting', 
  CONNECTED = 'connected',
  ERROR = 'error'
}

// SSE 错误类型枚举
export enum SSEErrorType {
  CONNECTION_FAILED = 'connection_failed',     // 初始连接失败
  CONNECTION_LOST = 'connection_lost',         // 连接中断/丢失  
  CONNECTION_CLOSED = 'connection_closed',     // 连接被关闭
  NETWORK_ERROR = 'network_error',             // 网络相关错误
  UNKNOWN_ERROR = 'unknown_error'              // 未知错误
}


// SSE 错误接口
export interface SSEError {
  type: SSEErrorType,
  message: string,
  originalEvent?: Event,
  timestamp: number,
  retryable: boolean,  // 是否可以重试
}

// SSE 消息接口
export interface SSEMessage {
  event: string;
  data: string;
}

// 消息监听器类型
export type MessageListener = (message: SSEMessage) => void
export type ErrorListener = (error: SSEError) => void


// Hook 的基础配置接口
export interface UseSSEConfig {
  autoConnect?: boolean  // 是否自动连接，默认 true
  keepLastMessage?: boolean // 是否保留最后一条消息，默认 ture
  keepLastError?: boolean // 是否保留最后一条错误，默认 true
  // 新增重连配置
  enableReconnect?: boolean  // 是否启用重连，默认 true
  maxReconnectAttempts?: number  // 最大重连次数，默认 3
  reconnectDelay?: number  // 重连延迟(ms)，默认 1000

}

// Hook 返回值接口
export interface UseSSEReturn {
  // 状态
  connectionState: SSEConnectionState
  isConnected: boolean
  isConnecting: boolean
  lastMessage: SSEMessage | null
  hasError: boolean
  lastError: SSEError | null
  
  // 新增重连状态
  isReconnecting: boolean
  reconnectAttempts: number


  // 操作方法
  connect: () => void
  disconnect: () => void
  clearError: () => void

  subscribe: (eventType: string, listener: MessageListener) => () => void
  subscribeToMessage: (listener: MessageListener) => () => void
  subscribeToError: (listener: ErrorListener) => () => void

}

/**
 * useSSE Hook - 基础连接管理 + 消息处理 + 错误处理
 * 
 * 核心功能：
 * 1. 管理 SSE 连接的生命周期
 * 2. 提供连接状态的响应式更新
 * 3. 自动处理组件卸载时的清理
 * 4. 消息接收和处理
 * 5. 提供简洁的消息订阅机制
 * 6. 完善的错误处理和错误状态管理
 * 7. 错误分类和可重试性判断
 */


export function useSSE(projectId: string, config: UseSSEConfig = {}): UseSSEReturn {


  // ============================ 1. 基础连接管理 ============================

  // 解构赋值，同时使用true作为默认值
  const { 
    autoConnect = true, 
    keepLastMessage = true, 
    keepLastError = true,
    enableReconnect = true,
    maxReconnectAttempts = 3,
    reconnectDelay = 1000
  } = config
  
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

  // 新增重连状态
  const [isReconnecting, setIsReconnecting] = useState(false)  // 监控"正在重连中"的状态, 这是过程状态 
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)


  // 错误监听引用
  const errorListenersRef = useRef<Set<ErrorListener>>(new Set())

  // 最后一条错误引用
  const [lastError, setLastError] = useState<SSEError | null>(null)

  // 创建错误对象的辅助函数
  const createError = useCallback((
    type: SSEErrorType,
    message: string,
    originalEvent?: Event,
    retryable: boolean = true
  ): SSEError => {
    return {
      type, 
      message, 
      originalEvent, 
      timestamp: Date.now(), 
      retryable
    }
  },[])

  // 判断错误类型的辅助函数
  const determineErrorType = useCallback((event: Event): { type: SSEErrorType; retryable: boolean } => {

    // event.type是DOM事件属性，指向触发事件的对象，由于event来自EventSource，所以event.target是EventSource对象。 
    const eventSource = event.target as EventSource

    if (!eventSource) {
      return { type: SSEErrorType.UNKNOWN_ERROR, retryable: false }
    }

    // 根据连接状态判断错误类型
    switch (eventSource.readyState) {
      case EventSource.CONNECTING:
        // 正在连接时出错 - 连接中断/丢失
        return { type: SSEErrorType.CONNECTION_LOST, retryable: true }
      case EventSource.CLOSED:
        // 连接已关闭状态出错 - 连接被关闭
        return { type: SSEErrorType.CONNECTION_CLOSED, retryable: true }
      case EventSource.OPEN:
        // 连接正常但出错 - 网络错误
        return { type: SSEErrorType.NETWORK_ERROR, retryable: true }
      default:
        return { type: SSEErrorType.UNKNOWN_ERROR, retryable: false }
    }
  }, [])




  // 重连逻辑 - 修复闭包陷阱
  const attemptReconnect = useCallback(() => {
    if (!enableReconnect) {
      setIsReconnecting(false)
      return
    }

    // 🌟 在setState回调中处理所有逻辑，避免闭包陷阱
    // 这里setState的参数是一个函数（回调函数）
    // 这个回调函数，以prevAttempts（先前的值）为参数。 这样就可以避免
    setReconnectAttempts(prevAttempts => {

      console.log('prevAttempts', prevAttempts)

      if (prevAttempts >= maxReconnectAttempts) {
        console.log('🛑 达到最大重连次数，停止重连')
        setIsReconnecting(false)
        return prevAttempts
      }

      const nextAttempts = prevAttempts + 1
      console.log(`🔄 尝试重连... (${nextAttempts}/${maxReconnectAttempts})`)

      setIsReconnecting(true)
      // setReconnectAttempts(prev => prev + 1)

      // 延迟重连
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('执行了connect')
        connect()
      }, reconnectDelay)

      console.log('nextAttempts', nextAttempts)
      return nextAttempts  // 请注意这里还在回调函数里，所以回调函数返回的值+1了， 下一次再执行时，prevAttempts就是+1后的值。 
    })
  }, [enableReconnect, maxReconnectAttempts, reconnectDelay])


  // 处理错误的通用函数
  const handleError = useCallback((event: Event, customMessage?: string) => {
    console.log('执行handleError')
    const { type, retryable } = determineErrorType(event)
    const message = customMessage || `SSE ${type} error occurred` 
    const error = createError(type, message, event, retryable)

    // 更新错误状态
    if (keepLastError) {
      setLastError(error)
    }

    // 更新连接状态
    setConnectionState(SSEConnectionState.ERROR)

    // 通知所有错误监听器
    errorListenersRef.current.forEach(listener => {
      try {
        listener(error)
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError)
      }
    })

    // 打印错误日志
    console.error('SSE Error:', {
      type: error.type,
      message: error.message,
      retryable: error.retryable,
      timestamp: error.timestamp,
      originalEvent: event
    })

    // 如果错误可重试，则尝试重连
    if (retryable && enableReconnect) {
      attemptReconnect()
    }


  }, [createError, determineErrorType, keepLastError, enableReconnect, attemptReconnect])


  // 初始化客户端实例（这里只是定义了一个函数，没有运行，到connect被调用时才真的运行）
  const initializeClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new BaseSSEClient(projectId)
    }
    return clientRef.current 
  }, []) // 没有依赖，这里和不添加 [] 是一样的, 而添加[]更明确



  // 连接方法 (这个是一个依赖函数，被初始化，但不会自动运行，真正运行要等到useEffect中调用)
  const connect = useCallback(() => {
    console.log('执行了connect')

    const client = initializeClient() 
    
    // 防止重复连接
    if (client.isConnected() || client.isConnecting()) {
      return
    }


    // 下面这种方式不能避免connect的闭包陷阱而无限循环的情况，需要让attemptReconnect控制。 
    // // 防止重连时的无限循环 
    // if (isReconnecting && reconnectAttempts >= maxReconnectAttempts) {
    //   setIsReconnecting(false)
    //   return
    // }


    try {
      // 1.开始连接前，设置为"正在连接"状态
      setConnectionState(SSEConnectionState.CONNECTING)

      // 2. 建立连接（注意：这会清空所有已注册的监听器）
      // 这个connect必须放在addErrorListener之前，否则connect会清空监听器，导致错误监听器失效，从而不会重连。 
      console.log('尝试建立连接')
      client.connect()


      // 3. 重新注册监听器（必须在connect之后，因为connect会清空监听器）
      const handleOpen = () => {
        setConnectionState(SSEConnectionState.CONNECTED) // 连接成功时执行
        // 重连成功，重置重连状态
        setIsReconnecting(false)
        setReconnectAttempts(0)
        // 清除重连定时器
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }
      
      // 添加错误监听器 - 使用增强的错误处理函数
      const handleConnectionError = (event: Event) => {
        console.error('SSE connection error:', event)
        handleError(event, 'SSE connection error')
      }
      
      // 重新添加监听器（这是关键修复点）
      client.addOpenListener(handleOpen)  
      client.addErrorListener(handleConnectionError) 




      // 添加连接的消息监听器 （后端对应connected事件）   
      client.addEventListener('connected', (event: MessageEvent) => {
        console.log('已连接的消息:', JSON.parse(event.data));
      })

      // 添加test事件的监听器 （后端对应test事件）
      client.addEventListener('test', (event: MessageEvent) => {
        console.log('Test消息:', JSON.parse(event.data));
      })  
      
    } catch (error) {
      console.log('执行了connect但捕捉到错误')
      const connectionError = createError(
        SSEErrorType.CONNECTION_FAILED, // 初始连接失败
        `Failed to connect SSE: ${error}`,
        undefined,
        false
      )

      if (keepLastError) {
        setLastError(connectionError)
      }

      setConnectionState(SSEConnectionState.ERROR)
      console.error('Failed to connect SSE:', error)

      // 通知所有错误监听器
    }
    // 在这个例子里，虽然initalizeClient永远不会变，但不添加出现： react的规范错误， ESlint错误，技术上不必要，但规范上必须声明。
    // 规范：react要求useCallback的依赖数组必须包含函数体内所使用的所有响应式值，即重新渲染时可能改变的值。 
    // 响应式值包括： state, props, 计算值， 函数返回值， 非响应式如useRef返回的值， 最后是普通常量。
  }, [initializeClient, handleError, createError, keepLastError])
  




  // ============================ 2. 消息订阅管理 ============================

  // 消息监听器引用 - 用于清理
  const listenersRef = useRef<Map<string, Set<MessageListener>>>(new Map())  // MAP里是键值对， （new MAP()）初始化为空的键值对

  // 最后一条消息引用
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null)

  // 数据转化函数, 是将原生的MessageEvent转换为自定义的SSEMessage接口，方便组件使用。 
  const convertMessage = useCallback((event: MessageEvent): SSEMessage => {
    return {
      event: event.type,
      data: event.data
    }
  }, [])

  // 处理消息的通用函数
  const handleMessage = useCallback((eventType: string, event: MessageEvent) => {
    try{
    console.log('执行handleMessage', eventType, event)

    // (1)获取和转化数据
    const message = convertMessage(event)

    // (2)更新最后消息状态
    if (keepLastMessage) {
      setLastMessage(message)
    }

    // (3)通知所有该事件类型的监听器 来 处理
    const listeners = listenersRef.current.get(eventType)
    if (listeners) {
      listeners.forEach(listener => {
        try{
         listener(message)
        } catch (error) {
          console.error(`Error in ${eventType} message listener:`, error)
          // 消息处理错误不应该影响连接状态。 
        }
      })
    }
    } catch (error) {
      // 消息解析错误
      const parseError = createError(
        SSEErrorType.UNKNOWN_ERROR,
        `Failed to parse ${eventType} message: ${error}`,
        event,
        false
      )
      
      if (keepLastError) {
        setLastError(parseError)
      }
      
      console.error('Message parsing error:', error)
    }
  },[convertMessage, keepLastMessage, createError, keepLastError])



  // 订阅特定事件类型的消息, 语法：(()=void)是返回值类型的声明，表明是一个不接受参数无返回值的函数，通常是用户取消订阅。 
  const subscribe = useCallback((eventType: string, listener: MessageListener):(() => void) => {
    console.log('执行订阅', eventType)

    // （1）初始化客户端实例
    // 在connect里，其实已经做了初始化
    // 这里初始化，是为了允许 先订阅，再连接； 有了初始化，clientRef.current 才不会是空指针。 
    const client = initializeClient()  

    
    //（2）安装内部监听函数/器（这些监听器在handleMessage里被调用执行）
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set())
    }
    listenersRef.current.get(eventType)?.add(listener)
    console.log('listenersRef', listenersRef.current)


    //（3）监听事件，并调用handleMessage进行处理
    // 创建SSE事件监听函数
    const sseListener: SSEEventListener = (event: MessageEvent) => {
      console.log('执行sseListener', eventType, event)
      handleMessage(eventType, event)
    }

    // 注册到SSE客户端（做了连接检查，所以只有已经连接了，才注册到sse客户端）
    if (client.hasEventSource()) {
      console.log('执行addEventListener', eventType)
      client.addEventListener(eventType, sseListener)
    }

    // （4）返回取消订阅函数
    return () => {
      //从内部跟踪中移除
      const listeners = listenersRef.current.get(eventType)
      if(listeners) {
        listeners.delete(listener)
        if(listeners.size === 0) {
          listenersRef.current.delete(eventType)
        }
      }

      // 移除SSE监听器
      if (client.hasEventSource()) {
        client.removeEventListener(eventType, sseListener)
      }
  
    }
  },[initializeClient, handleMessage])

    // 订阅默认 message 事件的便捷方法
  const subscribeToMessage = useCallback((listener: MessageListener): (() => void) => {
    return subscribe('message', listener)
  }, [subscribe])



  // ============================ 3. 错误处理 ============================

  // 清除错误状态
  const clearError = useCallback(() => {
    setLastError(null)
    
    // 如果当前是错误状态且没有连接，重置为断开状态
    if (connectionState === SSEConnectionState.ERROR && !clientRef.current?.isConnected()) {
      setConnectionState(SSEConnectionState.DISCONNECTED)
    }
  }, [connectionState])

  const subscribeToError = useCallback((listener: ErrorListener): (() => void) => {
    errorListenersRef.current.add(listener)

    // 返回取消订阅函数
    return () => {
      errorListenersRef.current.delete(listener)
    }
  }, [])


  // 修改 disconnect 函数，清理重连状态
  const disconnect = useCallback(() => {
    // 清理重连定时器
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // 重置重连状态
    setIsReconnecting(false)
    setReconnectAttempts(0)

    if (clientRef.current) {
      clientRef.current.close()
      setConnectionState(SSEConnectionState.DISCONNECTED)

      // 现有的清理逻辑...
      listenersRef.current.clear()
      errorListenersRef.current.clear()

      if (keepLastMessage) {
        setLastMessage(null)
      }

      if (keepLastError) {
        setLastError(null)
      }
    }
  }, [keepLastMessage, keepLastError])


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
  const hasError = connectionState === SSEConnectionState.ERROR || lastError !== null
  
  return {
    // 状态
    connectionState,
    isConnected,
    isConnecting,
    lastMessage,
    hasError,
    lastError,

    // 新增重连状态
    isReconnecting,
    reconnectAttempts,

    // 操作方法
    connect,
    disconnect,
    clearError,

    // 消息订阅
    subscribe,
    subscribeToMessage,
    subscribeToError
  }
}

// ==== 状态流转示例 ====
// // 连接断开
// isConnected: false
// isReconnecting: false

// // 开始重连
// isConnected: false  
// isReconnecting: true  // 👈 用户看到"正在重连..."

// // 重连成功
// isConnected: true     // 👈 这已经表示连接恢复了
// isReconnecting: false // 👈 重连过程结束


// 关于重连的代码： attemptReconnect 函数,  1)在handleError里被调用attemptReconnect, 2)connect里添加重置和定时器清除  3）disconnect里添加重置和定时器清除
// handleError -> attemptReconnect -> connect -> handleError -> attemptReconnect -> ... 这种依赖会造成无限循环
// 这个死循环没有办法通过依赖来解决，只能通过业务层面控制逻辑来切断。 
// 在connect里，我们在满足条件时，让isReconnecting = false ， 从而切断循环运行。 
// 但上面不能解决闭包陷阱
// 所谓闭包陷阱，是因为异步环境下，但一个参数被快速调用时，可能还是在用旧值。 通过setState的回调函数使用prev的值，这个值是最新的。
// 除了闭包，这里还有一个概念叫竞态条件，就是多个操作快速执行是，竞争执行顺序，导致程序行为依赖于不确定时序，最终可能出错。  