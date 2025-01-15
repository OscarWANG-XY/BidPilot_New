/**
* 项目导航组件 (NavProjects)
* 
* 功能描述:
* - 显示项目列表，每个项目包含图标和名称
* - 每个项目项都有一个悬停显示的操作菜单（三个点）
* - 操作菜单提供：查看项目、分享项目、删除项目等功能
* - 列表末尾有一个"More"项
* - 响应式设计，根据移动端状态调整下拉菜单位置
* 
* 组件结构:
* SidebarGroup                    // 侧边栏组容器(在图标折叠模式下隐藏)
*   └── SidebarMenu              // 菜单容器
*        ├── SidebarMenuItem     // 项目菜单项
*        │    ├── SidebarMenuButton  // 项目按钮(包含图标和名称)
*        │    └── DropdownMenu       // 项目操作下拉菜单
*        │         ├── DropdownMenuTrigger  // 触发器(三个点图标)
*        │         └── DropdownMenuContent  // 下拉菜单内容
*        │              └── DropdownMenuItem // 菜单选项
*        │
*        └── SidebarMenuItem     // "More"菜单项
*
* 使用的组件:
* - Sidebar 相关组件(@/components/ui/sidebar):
*   SidebarGroup, SidebarMenu, SidebarMenuItem,
*   SidebarMenuButton, SidebarMenuAction
* 
* - DropdownMenu 相关组件(@/components/ui/dropdown-menu):
*   DropdownMenu, DropdownMenuContent, DropdownMenuItem,
*   DropdownMenuSeparator, DropdownMenuTrigger
* 
* - Lucide 图标组件:
*   Folder, Forward, MoreHorizontal, Trash2
* 
* @param {Object[]} projects - 项目配置数组
* @param {string} projects[].name - 项目名称
* @param {string} projects[].url - 项目链接
* @param {LucideIcon} projects[].icon - 项目图标组件
*/

"use client" // 表示代码是客户端组件，如果不添加，Next.js会尝试在服务器端运行，从而导致错误。 
import {Building2, MoreHorizontal, PenLine, Star} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { CreateProjectDialog } from "@/components/project/create_project"

export function NavProjects({
projects,
}: {
  projects: {
    name: string
    url: string
    status: string
    created: string
    starred: boolean
  }[]
}) {

  return (
  <>
    {/* 新建项目 + 公司档案*/}
    <SidebarGroup>
      <SidebarMenu className="mb-1">
        <SidebarMenuItem className="mb-2">
          <SidebarMenuButton asChild>
            {/* 新建项目 在create_project.tsx中实现*/}
            <CreateProjectDialog/>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a href="/company" className="w-full flex items-center gap-2 px-2">
              <Building2 className="h-4 w-4" /> 
              <span className="text-lg">公司档案</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>

    {/* 收藏项目+历史项目 */}
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="font-sans font-semibold text-gray-900">收藏项目</SidebarGroupLabel> 
      <SidebarMenu className="mb-4">
        {projects.filter(item=>item.starred === true).map((item) => (
          <SidebarMenuItem key={item.name}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Star className="flex-shrink-0 size-3"/>
                        <span className="text-gray-500 truncate">{item.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{item.status}</span>
                    </a>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarGroupLabel className="font-sans font-semibold text-gray-900">最近项目</SidebarGroupLabel> 
      <SidebarMenu className="mb-4">
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild>
                  <a href={item.url} className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <PenLine className="flex-shrink-0 size-3"/>
                        <span className="text-gray-500 truncate">{item.name}</span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{item.status}</span>
                    </a>
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarMenu className="mb-4">
      <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>查看全部项目</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

    </SidebarGroup>
  </>
  )
}
