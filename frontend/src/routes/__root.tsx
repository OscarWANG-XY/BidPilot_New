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
  const isTestPage = location.pathname.startsWith('/testground')


  // 场景1：正在加载... 如, 用户正在登录中...
  if (isLoading) {
    return <div>Loading...</div>
  }

  // 场景2：(一般是加载前，或加载失败后)
  // 处在auth相关的页面（登录，注册，忘记密码），则直接渲染子路由，不带布局。
  // 以下添加了 测试页面分支，用于测试，无需登录。
  if (isAuthPage || isTestPage) {
    return <Outlet />
  }

  // 场景3:（一般是加载成功后）
  // 如果当前路径不是认证相关的页面，则返回布局（带侧边栏），并渲染子路由。 
  return (
    <SidebarProvider className="
      h-screen  /*屏幕高度*/ 
      overflow-hidden /*最外围显示滚条*/
    "> 
      {/* 应用侧边栏组件 */}
      <AppSidebar />
      
      {/* 侧边栏内容区域 */}
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="
          flex               /* 使用flex布局 */
          h-12              /* 固定高度64px */
          shrink-0          /* 禁止收缩 */
          items-center      /* 垂直居中 */
          gap-2            /* 子元素间距8px */
          transition-[width,height] /* 对宽度和高度添加过渡效果 */
          ease-linear       /* 线性过渡（匀速动画） */
          group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 
                            /* 当侧边栏折叠为图标模式时，高度变为48px */
        ">
          {/* 导航栏内部容器 */}
          <div className="
            flex             /* flex布局 */
            items-center    /* 垂直居中 */
            gap-2          /* 子元素间距8px */
            px-4           /* 水平内边距16px */
          ">
            {/* 侧边栏触发器按钮 */}
            <SidebarTrigger className="
              -ml-1         /* 左外边距-4px（微调按钮位置） */
            " />
            
            {/* 垂直分隔线 */}
            <Separator 
              orientation="vertical"  /* 垂直方向 */
              className="
                mr-2       /* 右外边距8px */
                h-4        /* 高度16px */
              " 
            />
            
            {/* 面包屑导航 */}
            <Breadcrumb>
              <BreadcrumbList>
                {/* 首页面包屑（中屏以上显示） */}
                <BreadcrumbItem className="
                  hidden      /* 默认隐藏 */
                  md:block    /* 中屏（768px）及以上显示 */
                ">
                  <BreadcrumbLink href="#">
                    执智者
                  </BreadcrumbLink>
                </BreadcrumbItem>
                
                {/* 面包屑分隔符（中屏以上显示） */}
                <BreadcrumbSeparator className="
                  hidden      /* 默认隐藏 */
                  md:block   /* 中屏及以上显示 */
                " />
                
                {/* 当前页面面包屑 */}
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    招投标项目
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        {/* 主内容区域 */}
        <div className="
          flex             /* flex布局 */
          flex-1          /* 占据剩余空间 */
          flex-col        /* 垂直排列 */
          gap-4          /* 子元素间距16px */
          p-6            /* 内边距16px */
          pt-0           /* 顶部内边距0（与header无缝连接） */
          overflow-auto   /* 内容溢出时显示滚动条 */
          h-full         /* 占满高度 */
        ">
          {/* 路由出口（渲染子路由内容） */}
          <Outlet />
        </div>
      </SidebarInset>
      
      {/* TanStack Router开发工具 */}
      <TanStackRouterDevtools 
        initialIsOpen={false}  /* 默认关闭 */
        position="bottom-right"  /* 定位在右下角 */
      />
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
    // 添加了 测试页面分支，运行其和认证页面一样，无需登录。
    if (location.pathname.startsWith('/auth') || location.pathname.startsWith('/testground')) {
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