"use client" // 表示代码是客户端组件，如果不添加，Next.js会尝试在服务器端运行，从而导致错误。 
import {Building2, MoreHorizontal, PenLine, Star} from "lucide-react"
import { useLocation } from "@tanstack/react-router"

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

import { CreateProjectDialog } from "@/components/projects/Project/_01_ProjectCreate"
import { ProjectsSidebarItem } from "@/_types/projects_dt_stru/projects_interface"

export function NavProjects({
projects,
}: {
  projects: ProjectsSidebarItem[]
}) {
  const location = useLocation()
  const pathname = location.pathname

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

        <SidebarMenuItem className="mb-2">
          <SidebarMenuButton asChild>
            <a href="/company" className={`w-full flex items-center gap-2 px-2 ${pathname === '/company' ? 'bg-gray-100 rounded' : ''}`}>
              <Building2 className="h-4 w-4" /> 
              <span className="text-lg">公司档案</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>


        <SidebarMenuItem className="mb-2">
          <SidebarMenuButton asChild>
            <a href="/projects_manager" className={`w-full flex items-center gap-2 px-2 ${pathname === '/projects_manager' ? 'bg-gray-100 rounded' : ''}`}>
              <Building2 className="h-4 w-4" /> 
              <span className="text-lg">项目管理后台</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>


        <SidebarMenuItem className="mb-2">
          <SidebarMenuButton asChild>
            <a href="/files_manager" className={`w-full flex items-center gap-2 px-2 ${pathname === '/files_manager' ? 'bg-gray-100 rounded' : ''}`}>
              <Building2 className="h-4 w-4" /> 
              <span className="text-lg">文件管理后台</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>

        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a href="/chat" className={`w-full flex items-center gap-2 px-2 ${pathname === '/chat' ? 'bg-gray-100 rounded' : ''}`}>
              <Building2 className="h-4 w-4" /> 
              <span className="text-lg">聊天机器人</span>
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
