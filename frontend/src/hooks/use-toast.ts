//use-toast.ts 是导入shadcn-ui的toast组件是一起导入进来的。  这段代码比较难理解。
/**
* Toast 通知系统
* 用于在应用中显示临时的消息通知、提示、警告等
* 
* 功能特点：
* - 支持显示自定义标题、描述、操作按钮
* - 自动关闭和手动关闭
* - 限制最大显示数量
* - 支持更新已存在的 toast
* - 全局状态管理，可在任何组件中使用
* 
* 主要函数:
* - genId(): 生成唯一的 toast id
* - reducer(): 处理 toast 状态更新的核心函数，支持添加、更新、关闭、移除等操作
* - addToRemoveQueue(): 将 toast 添加到移除队列，处理延迟移除逻辑
* - dispatch(): 分发 action 并通知所有监听者状态更新
* - toast(): 创建新的 toast 通知
* - useToast(): React Hook，用于在组件中使用 toast 功能
* 
* useToast() 是一个 React Hook，它返回 toast() 函数给使用者
* 订阅状态更新（通过 listeners）
* 提供当前的 toasts 状态

* 当调用 toast() 函数时，它会使用 genId() 生成唯一 ID
* 使用 dispatch() 发送 action 更新状态
* 状态更新后通过 reducer 处理
* 
* 使用示例:
* ```tsx
* function Demo() {
*   const { toast } = useToast()
*   
*   return (
*     <button
*       onClick={() => {
*         toast({
*           title: "标题",
*           description: "描述内容"
*         })
*       }}
*     >
*       显示提示
*     </button>
*   )
* }
* ```
*
* @see Inspired by react-hot-toast library
*/

"use client" // 表示代码是客户端组件，如果不添加，Next.js会尝试在服务器端运行，从而导致错误。  

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"



const TOAST_LIMIT = 1  // 限制toast数量
const TOAST_REMOVE_DELAY = 1000000 // toast 消失后被移除的延迟时间

// 定义toast的核心类型
// &表示继承了ToastProps的属性，又添加了id、title、description、action属性
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode  
  description?: React.ReactNode
  action?: ToastActionElement
}

// 定义toast的action类型，末尾添加了as const，表示这些值是常量, 如果不加，actionTypes的值会变成字符串
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const


let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}


// 定义reducer函数，根据action的类型来更新state, 提供了完整的toast生命周期管理功能
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}


//使用了订阅发布模式来管理全局状态，而不是使用Context API
const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}


// 定义useToast函数，返回一个包含toast状态和操作函数的状态管理对象
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

// 这段代码是导出useToast和toast函数，供其他组件使用。
// toast是之前定义的函数，返回给用户使用。 useToast是返回给用户使用的hook函数。
export { useToast, toast }  
