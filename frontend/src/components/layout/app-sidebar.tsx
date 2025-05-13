"use client" // 表示代码是客户端组件，如果不添加，Next.js会尝试在服务器端运行，从而导致错误。 
import * as React from "react"
import { NavProjects } from "@/components/layout/nav-projects"
import { NavUser } from "@/components/layout/nav-user"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useProjects } from "@/_hooks/useProjects/useProjects"
import { useAuth } from "@/_hooks/auth-context" // 使用你已有的 auth-context
import { UserResponse } from "@/_types/user_dt_stru"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // 使用 sidebarProjectsQuery 钩子获取项目列表
  const { sidebarProjectsQuery } = useProjects()
  const { data: sidebarProjects, isLoading: isProjectsLoading } = sidebarProjectsQuery()
  
  // 使用你已有的 useAuth 钩子获取当前用户信息
  const { user, isLoading: isUserLoading } = useAuth()

  return (
    // 侧边栏容器
    <Sidebar collapsible="icon" {...props}>
      {/* 顶部区域 */}
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      {/* 内容区域 */}
      <SidebarContent>
        {isProjectsLoading ? (
          <div className="px-4 py-2 text-sm text-muted-foreground">加载项目中...</div>
        ) : (
          <NavProjects projects={sidebarProjects || []} />
        )}
      </SidebarContent>
      {/* 底部区域 */}
      <SidebarFooter>
        {isUserLoading ? (
          <div className="px-4 py-2 text-sm text-muted-foreground">加载用户信息...</div>
        ) : (
          <NavUser user={user as UserResponse} />
        )}
      </SidebarFooter>
      {/* 轨道 */}
      <SidebarRail />
    </Sidebar>
  )
}
