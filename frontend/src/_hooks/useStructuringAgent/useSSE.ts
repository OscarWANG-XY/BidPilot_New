import { useEffect, useRef, useState, useCallback } from 'react'
import { BaseSSEClient, SSEEventListener } from '@/_api/structuring_agent_api/sse_api'

// 连接状态枚举
export enum SSEConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting', 
  CONNECTED = 'connected',
  ERROR = 'error'
}

// SSE 消息接口
export interface SSEMessage {
  event: string;
  data: string;
}

// 消息监听器类型
export type MessageListener = (message: SSEMessage) => void


// Hook 的基础配置接口
export interface UseSSEConfig {
  autoConnect?: boolean  // 是否自动连接，默认 true
  keepLastMessage?: boolean // 是否保留最后一条消息，默认 ture
}

// Hook 返回值接口
export interface UseSSEReturn {
  // 状态
  connectionState: SSEConnectionState
  isConnected: boolean
  isConnecting: boolean
  lastMessage: SSEMessage | null
  
  // 操作方法
  connect: () => void
  disconnect: () => void

  subscribe: (eventType: string, listener: MessageListener) => () => void
  subscribeToMessage: (listener: MessageListener) => () => void

}

/**
 * useSSE Hook - 第一步：基础连接管理
 * 
 * 核心功能：
 * 1. 管理 SSE 连接的生命周期
 * 2. 提供连接状态的响应式更新
 * 3. 自动处理组件卸载时的清理
 * 4. 消息接收和处理
 * 5. 提供简洁的消息订阅机制
 */


export function useSSE(projectId: string, config: UseSSEConfig = {}): UseSSEReturn {


  // ============================ 1. 基础连接管理 ============================

  // 解构赋值，同时使用true作为默认值
  const { autoConnect = true, keepLastMessage = true } = config
  
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

      // 添加连接的消息监听器 （后端对应connected事件）   
      client.addEventListener('connected', (event: MessageEvent) => {
        console.log('已连接的消息:', JSON.parse(event.data));
      })

      // 添加test事件的监听器 （后端对应test事件）
      client.addEventListener('test', (event: MessageEvent) => {
        console.log('Test消息:', JSON.parse(event.data));
      })  
      
    } catch (error) {
      console.error('Failed to connect SSE:', error)
      setConnectionState(SSEConnectionState.ERROR)
    }
    // 在这个例子里，虽然initalizeClient永远不会变，但不添加出现： react的规范错误， ESlint错误，技术上不必要，但规范上必须声明。
    // 规范：react要求useCallback的依赖数组必须包含函数体内所使用的所有响应式值，即重新渲染时可能改变的值。 
    // 响应式值包括： state, props, 计算值， 函数返回值， 非响应式如useRef返回的值， 最后是普通常量。
  }, [initializeClient]) 
  




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
          console.error('Error in message listener:', error)
        }
    })
    }
  },[convertMessage, keepLastMessage])



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

    // 返回取消订阅函数
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


  // 断开连接方法
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.close()
      setConnectionState(SSEConnectionState.DISCONNECTED)

      // 清理监听器
      listenersRef.current.clear()

      // 清理最后一条消息
      if(keepLastMessage) {
        setLastMessage(null)
      }
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
    lastMessage,

    // 操作方法
    connect,
    disconnect,

    // 消息订阅
    subscribe,
    subscribeToMessage
  }
}