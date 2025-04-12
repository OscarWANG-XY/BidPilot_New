import { StrictMode } from 'react'
import '@/assets/global.scss'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
//import { ConnectionProvider } from '@/contexts/ConnectionContext'

//通过在main.tsx中引入Toaster，可以在全局范围内使用toast


// Import the generated route tree
import { routeTree } from './routeTree.gen'


// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据过期时间，大于这个时间，数据被认为是过期的
      staleTime: 1000 * 60 * 5, // 5 minutes  

      // cacheTime：控制缓存保留时间
      gcTime: 1000 * 60 * 30, // 30 minutes

      // 在窗口重新聚焦时，不自动重新获取数据
      refetchOnWindowFocus: false,
      retry: 1, // 失败时重试1次
    },
  },
})

// 配置查询客户端持久化
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'TASK_ANALYSIS_CACHE', 
  // 自定义缓存键名， tanstack query的hooks不需要指导这个持久化的存在，它和个别查询hooks的实现是完全分离的。
  // 持久化机制在后台自动工作，对你的查询 hooks 是透明的。
  // 持久化是在persistQueryClient中自动处理。 
})

// 启用持久化
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  // 持久化配置
  maxAge: 1000 * 60 * 60 * 24, // 24小时
  // 可选：仅持久化特定查询
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // 持久化任务和分析相关的查询
      //  hooks 中使用的查询键的第一个元素需要与 shouldDehydrateQuery 中列出的值匹配，才能被持久化。
      const queryKey = query.queryKey[0];
      return queryKey === 'tasks' ||    // 查询键以 'tasks' 开头的会被持久化，比如useQuery(['tasks', id], fetchTask) 
             queryKey === 'startStreaming'||
             queryKey === 'streamStatus'||
             queryKey === 'streamResult';
    },
  },
})

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        {/* <ConnectionProvider>
          <RouterProvider router={router} />
        </ConnectionProvider> */}
        <RouterProvider router={router} />
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>
  )
}


// 注意事项和说明：
// ConnectionProvider 应该包裹 RouterProvider，这样所有路由组件都能访问连接状态。
// ConnectionProvider 放在 QueryClientProvider 内部，这样连接上下文可以访问 React Query 的功能，如果需要的话。
// Toaster 保持在外部，这样连接状态变化的通知也能正常显示。
// 查询客户端持久化配置确保页面刷新后仍能保留查询状态，包括错误状态。