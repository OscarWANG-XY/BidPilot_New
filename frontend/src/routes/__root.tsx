// 主要两个模块： 
// 1. AuthenticatedLayout() 管理 认证前，认证中，认证后，不同阶段的页面渲染
// 2. createRootRoute() 创建根路由，beforeLoad管理认证前导向， 而根路由主要管理认证后的页面和内容加载。

import { createRootRoute, Outlet, redirect, useLocation} from '@tanstack/react-router'    // 引入路由器
import { TanStackRouterDevtools } from '@tanstack/router-devtools'  // 引入路由器调试工具
import { useAuth, AuthProvider } from '@/contexts/auth-context'  // 引入认证上下文
import { AppSidebar } from "@/components/layout/app-sidebar"  // 引入自定义的侧边栏组件
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"  // 引入ui面包屑组件
import { Separator } from "@/components/ui/separator"  // 引入ui分割线组件
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"  // 引入ui侧边栏组件



// ---------------------- AuthenticatedLayout负责渲染 不同认证状态下 的用户界面 ----------------------
function AuthenticatedLayout() {
  
  // 获取认证状态， 用于下面根据 “加载中...” 和 “非加载中...”的非同场景进行不同的渲染。
  const { isLoading } = useAuth()

  // 检查当前路径是否是认证相关的页面
  // 在当前应用里，以 /auth 开头的路径，有登录（/auth/login）、注册（/auth/register），以及忘记密码（/auth/forgot-password）。 
  const location = useLocation()
  const isAuthPage = location.pathname.startsWith('/auth')


  // 场景1：正在加载... 如, 用户正在登录中...
  if (isLoading) {
    return <div>Loading...</div>
  }

  // 场景2：(一般是加载前，或加载失败后)
  // 处在auth相关的页面（登录，注册，忘记密码），则直接渲染子路由，不带布局。 
  if (isAuthPage) {
    return <Outlet />
  }

  // 场景3:（一般是加载成功后）
  // 如果当前路径不是认证相关的页面，则返回布局（带侧边栏），并渲染子路由。 
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">执智者</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>招投标项目</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
      <TanStackRouterDevtools initialIsOpen={false} position="bottom-right" />
    </SidebarProvider>
  )
}

// ========================= 创建根路由 ================================
// 布局实现封装在AuthenticatedLayout组件中. 
export const Route = createRootRoute({
  component: () => (
    // AuthProvider 作为第二道防线，负责更复杂的认证状态管理：token有效性，过期检查，自动刷新，登出，提供用户信息。
    <AuthProvider>
      <AuthenticatedLayout />
    </AuthProvider>
  ),


  // BeforeLoad 是一道防线，确保用户至少有一个token才能访问 非AUTH页面
  beforeLoad: ({ location }) => {

    // 业务逻辑：如果是认证页面，直接进入根路由，在认证页面，根路由渲染的是 登录前的页面。 
    // location是经过路由库封装过的对象，不完全等同于window.location, 虽然是全局但作为参数输入是一种依赖注入的实践
    // 认证页面包括：登录（/auth/login）、注册（/auth/register），以及忘记密码（/auth/forgot-password）。 
    if (location.pathname.startsWith('/auth')) {
      return
    }


    // 业务逻辑：如果无token，导向登入页面，要求用户进行登入
    // 业务逻辑：如果有token，直接进行根路由，根据AuthenProvider的上下文，认证为登录状态，渲染登录后的页面。
    // localStorage 是 Web Storage API 的一部分
    // 它允许在浏览器中存储数据，这些数据在页面刷新后仍然可用。
    // 它通常用于存储用户会话、偏好设置等数据。
    // 在JavaScript中，localStorage 是一个全局对象，提供了 setItem、getItem、removeItem 和 clear 等方法。
    // 这些方法用于在 localStorage 中存储和检索数据。
    const token = localStorage.getItem('token')
    if (!token) {
      throw redirect({
        to: '/auth/login',
      })
    }
  },
})