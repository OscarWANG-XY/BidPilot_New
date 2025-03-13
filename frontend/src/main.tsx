import { StrictMode } from 'react'
import '@/assets/global.scss'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
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