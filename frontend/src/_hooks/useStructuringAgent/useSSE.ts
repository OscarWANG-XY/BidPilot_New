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


// 重连策略配置
export interface RetryConfig {
  enabled: boolean // 是否启用自动重连，默认 true
  maxAttempts: number // 最大重连次数，默认 5，-1 表示无限重连
  initialDelay: number // 初始重连延迟(ms)，默认 1000
  maxDelay: number // 最大重连延迟(ms)，默认 30000
  backoffFactor: number // 退避因子，默认 2 (指数退避)
  retryOnError: SSEErrorType[] // 哪些错误类型触发重连，默认所有可重试的错误
}

// Hook 的基础配置接口
export interface UseSSEConfig {
  autoConnect?: boolean  // 是否自动连接，默认 true
  keepLastMessage?: boolean // 是否保留最后一条消息，默认 ture
  keepLastError?: boolean // 是否保留最后一条错误，默认 true
  retry?: Partial<RetryConfig> // 重连配置
  debug?: boolean // 是否启用调试日志，默认 false
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

  // 重连状态
  isRetrying: boolean
  retryAttempt: number
  nextRetryIn: number // 下次重连倒计时(秒)，0 表示不重连
  
  // 操作方法
  connect: () => void
  disconnect: () => void
  clearError: () => void

  // 重连控制
  retryNow: () => void // 立即重连
  cancelRetry: () => void // 取消重连

  // 消息处理方法
  subscribe: (eventType: string, listener: MessageListener) => () => void
  subscribeToMessage: (listener: MessageListener) => () => void
  subscribeToError: (listener: ErrorListener) => () => void

}

/**
 * useSSE Hook - 基础连接管理 + 消息处理 + 错误处理 + 重连机制
 * 
 * 核心功能：
 * 1. 管理 SSE 连接的生命周期
 * 2. 提供连接状态的响应式更新
 * 3. 自动处理组件卸载时的清理
 * 4. 消息接收和处理
 * 5. 提供简洁的消息订阅机制
 * 6. 完善的错误处理和错误状态管理
 * 7. 错误分类和可重试性判断
 * 8. 智能自动重连机制
 * 9. 丰富的配置选项
 * 10. 性能优化和调试支持
 */


export function useSSE(projectId: string, config: UseSSEConfig = {}): UseSSEReturn {


  // ============================ 1. 基础连接管理 ============================

  // 解构赋值，同时使用true作为默认值
  const { 
    autoConnect = true, 
    keepLastMessage = true, 
    keepLastError = true,
    retry: retryConfig = {},
    debug = false
  } = config

  // 默认重连配置
  const defaultRetryConfig: RetryConfig = {
    enabled: true,
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryOnError: [
      SSEErrorType.CONNECTION_FAILED,
      SSEErrorType.CONNECTION_LOST,
      SSEErrorType.CONNECTION_CLOSED,
      SSEErrorType.NETWORK_ERROR
    ]
  }

  const finalRetryConfig: RetryConfig = { ...defaultRetryConfig, ...retryConfig }
  
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

  // 错误监听引用
  const errorListenersRef = useRef<Set<ErrorListener>>(new Set())

  // 最后一条错误引用
  const [lastError, setLastError] = useState<SSEError | null>(null)

  // 重连相关引用
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountdownRef = useRef<NodeJS.Timeout | null>(null)
  const isManualDisconnectRef = useRef<boolean>(false)

  // 重连状态
  const [isRetrying, setIsRetrying] = useState<boolean>(false)
  const [retryAttempt, setRetryAttempt] = useState<number>(0)
  const [nextRetryIn, setNextRetryIn] = useState<number>(0)

  // 调试日志辅助函数
  const debugLog = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[useSSE Debug] ${message}`, ...args)
    }
  }, [debug])

  // 计算重连延迟时间
  const calculateRetryDelay = useCallback((attempt: number): number => {
    const { initialDelay, maxDelay, backoffFactor } = finalRetryConfig
    const delay = Math.min(
      initialDelay * Math.pow(backoffFactor, attempt - 1),
      maxDelay
    )
    return delay
  }, [finalRetryConfig])

  // 清理重连相关状态和定时器
  const clearRetryState = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    if (retryCountdownRef.current) {
      clearInterval(retryCountdownRef.current)
      retryCountdownRef.current = null
    }
    setIsRetrying(false)
    setRetryAttempt(0)
    setNextRetryIn(0)
  }, [])

  // 执行自动重连 (执行了一堆的判定条件的检查，最后才执行重连)
  const scheduleRetry = useCallback(() => {
    const { enabled, maxAttempts, retryOnError } = finalRetryConfig
    
    // 检查是否启用重连
    if (!enabled) {
      debugLog('自动重连已禁用')
      return
    }
    
    // 检查是否为手动断开
    if (isManualDisconnectRef.current) {
      debugLog('手动断开连接，跳过自动重连')
      return
    }
    
    // 检查重连次数限制
    if (maxAttempts !== -1 && retryAttempt >= maxAttempts) {
      debugLog(`达到最大重连次数限制 (${maxAttempts})，停止重连`)
      clearRetryState()
      return
    }
    
    // 检查错误类型是否可重连
    if (lastError && !retryOnError.includes(lastError.type)) {
      debugLog(`错误类型 ${lastError.type} 不在重连列表中，跳过重连`)
      return
    }
    
    const nextAttempt = retryAttempt + 1
    const delay = calculateRetryDelay(nextAttempt)
    
    debugLog(`计划第 ${nextAttempt} 次重连，延迟 ${delay}ms`)
    
    setIsRetrying(true)
    setRetryAttempt(nextAttempt)
    setNextRetryIn(Math.ceil(delay / 1000))
    
    // 倒计时更新
    retryCountdownRef.current = setInterval(() => {
      setNextRetryIn(prev => {
        if (prev <= 1) {
          if (retryCountdownRef.current) {
            clearInterval(retryCountdownRef.current)
            retryCountdownRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // 执行重连
    retryTimeoutRef.current = setTimeout(() => {
      debugLog(`执行第 ${nextAttempt} 次重连`)
      connect()
    }, delay)
    
  }, [finalRetryConfig, retryAttempt, lastError, calculateRetryDelay, clearRetryState, debugLog])

  // 立即重连
  const retryNow = useCallback(() => {
    debugLog('立即重连')
    clearRetryState()
    connect()
  }, [clearRetryState])

  // 取消重连
  const cancelRetry = useCallback(() => {
    debugLog('取消自动重连')
    clearRetryState()
  }, [clearRetryState])

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


  // 处理错误的通用函数
  const handleError = useCallback((event: Event, customMessage?: string) => {

    const { type, retryable } = determineErrorType(event)
    const message = customMessage || `SSE ${type} error occurred` 
    const error = createError(type, message, event, retryable)

    debugLog('SSE 错误:', {
      type: error.type,
      message: error.message,
      retryable: error.retryable,
      timestamp: error.timestamp
    })

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

    // 添加重连相关机制
    if(retryable && finalRetryConfig.enabled) {
      scheduleRetry()
    }


  }, [createError, determineErrorType, keepLastError, debugLog, finalRetryConfig.enabled, scheduleRetry])




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
      debugLog('连接已存在，跳过重复连接')
      return
    }

    debugLog('开始建立 SSE 连接')
    isManualDisconnectRef.current = false  // 重置手动断开标记
    

    try {
      // 1.开始连接前，设置为"正在连接"状态
      setConnectionState(SSEConnectionState.CONNECTING)

      //清除之前的错误状态和重连状态
      if (keepLastError) {
        setLastError(null)
      }
      clearRetryState()

      
      // 2. 注册监听器（这些不会立即执行），执行是在connect以后，在onopen 和 onerror的位置触发（在API里）。  
      const handleOpen = () => {
        debugLog('SSE 连接已建立')
        setConnectionState(SSEConnectionState.CONNECTED) // 连接成功时执行
        // 连接成功后重置重连计数
        setRetryAttempt(0)
      }
      
      // 添加错误监听器 - 使用增强的错误处理函数
      const handleConnectionError = (event: Event) => {
        debugLog('SSE 连接错误:', event)
        handleError(event, 'SSE connection error')
      }
      
      // 添加监听器
      client.addOpenListener(handleOpen)  // 在SSE_API里，我们定义了Open事件监听在onopen时触发。 
      client.addErrorListener(handleConnectionError) // 在SSE_API里，我们定义了Error事件监听在onerror时触发。 
      
      // 建立连接
      client.connect()

      // 添加连接的消息监听器 （后端对应connected事件）   
      client.addEventListener('connected', (event: MessageEvent) => {
        console.log('已连接的消息:', JSON.parse(event.data));
      })

      // 添加test事件的监听器 （后端对应test事件）
      client.addEventListener('test', (event: MessageEvent) => {
        console.log('Test消息:', JSON.parse(event.data));
      })  
      
    } catch (error) {
      debugLog('创建 SSE 连接失败:', error)
      const connectionError = createError(
        SSEErrorType.CONNECTION_FAILED, // 初始连接失败
        `Failed to connect SSE: ${error}`,
        undefined,
        true
      )

      if (keepLastError) {
        setLastError(connectionError)
      }

      setConnectionState(SSEConnectionState.ERROR)

      // 启动自动重连
      if (finalRetryConfig.enabled) {
        scheduleRetry()
      }
    }
    // 在这个例子里，虽然initalizeClient永远不会变，但不添加出现： react的规范错误， ESlint错误，技术上不必要，但规范上必须声明。
    // 规范：react要求useCallback的依赖数组必须包含函数体内所使用的所有响应式值，即重新渲染时可能改变的值。 
    // 响应式值包括： state, props, 计算值， 函数返回值， 非响应式如useRef返回的值， 最后是普通常量。
  }, [initializeClient, handleError, createError, keepLastError, clearRetryState, debugLog, finalRetryConfig.enabled, scheduleRetry]) 
  




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
    debugLog(`订阅事件类型: ${eventType}`)

    // （1）初始化客户端实例
    // 在connect里，其实已经做了初始化
    // 这里初始化，是为了允许 先订阅，再连接； 有了初始化，clientRef.current 才不会是空指针。 
    const client = initializeClient()  

    
    //（2）安装内部监听函数/器（这些监听器在handleMessage里被调用执行）
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set())
    }
    listenersRef.current.get(eventType)?.add(listener)


    //（3）监听事件，并调用handleMessage进行处理
    // 创建SSE事件监听函数
    const sseListener: SSEEventListener = (event: MessageEvent) => {
      handleMessage(eventType, event)
    }

    // 注册到SSE客户端（做了连接检查，所以只有已经连接了，才注册到sse客户端）
    if (client.hasEventSource()) {
      client.addEventListener(eventType, sseListener)
    }

    // （4）返回取消订阅函数
    return () => {
      debugLog(`取消订阅事件类型: ${eventType}`)
      
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
  },[initializeClient, handleMessage, debugLog])

    // 订阅默认 message 事件的便捷方法
  const subscribeToMessage = useCallback((listener: MessageListener): (() => void) => {
    return subscribe('message', listener)
  }, [subscribe])



  // ============================ 3. 错误处理 ============================

  // 清除错误状态
  const clearError = useCallback(() => {
    debugLog('清除错误状态')
    setLastError(null)

    // 取消正在进行的重连
    clearRetryState()
    
    // 如果当前是错误状态且没有连接，重置为断开状态
    if (connectionState === SSEConnectionState.ERROR && !clientRef.current?.isConnected()) {
      setConnectionState(SSEConnectionState.DISCONNECTED)
    }
  }, [connectionState, clearRetryState, debugLog])


  
  const subscribeToError = useCallback((listener: ErrorListener): (() => void) => {
    errorListenersRef.current.add(listener)

    // 返回取消订阅函数
    return () => {
      errorListenersRef.current.delete(listener)
    }
  }, [])


  // 断开连接方法
  const disconnect = useCallback(() => {
    debugLog('主动断开 SSE 连接')
    isManualDisconnectRef.current = true  // 标记为手动断开

    if (clientRef.current) {
      clientRef.current.close()
      setConnectionState(SSEConnectionState.DISCONNECTED)

      // 清理监听器
      listenersRef.current.clear()


      // 清理错误监听器
      errorListenersRef.current.clear()

      // 清理重连状态
      clearRetryState()

      // 清理最后一条消息
      if(keepLastMessage) {
        setLastMessage(null)
      }

      // 清理最后一条错误
      if(keepLastError) {
        setLastError(null)
      }
    }
  }, [keepLastMessage, keepLastError, clearRetryState, debugLog])


  // 自动连接效果 (真正开始执行)
  useEffect(() => {
    if (autoConnect) {
      debugLog('自动连接启用，开始连接')
      connect()
    }
    
    // 组件卸载时自动清理(防泄漏)
    return () => {
      debugLog('组件卸载，清理 SSE 连接')
      disconnect()
    }
  }, [autoConnect, connect, disconnect, debugLog])
  
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

    // 重连状态
    isRetrying,
    retryAttempt,
    nextRetryIn,

    // 操作方法
    connect,
    disconnect,
    clearError,

    // 重连控制
    retryNow,
    cancelRetry,

    // 消息订阅
    subscribe,
    subscribeToMessage,
    subscribeToError
  }
}