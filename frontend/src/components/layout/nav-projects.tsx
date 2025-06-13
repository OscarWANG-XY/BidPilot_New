"use client" // 表示代码是客户端组件，如果不添加，Next.js会尝试在服务器端运行，从而导致错误。 
import {Building2, MoreHorizontal, PenLine, Star} from "lucide-react"
import { useLocation, Link, useNavigate } from "@tanstack/react-router"

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
  const navigate = useNavigate()
  const pathname = location.pathname

  // 获取当前路径中的projectId
  const getCurrentProjectId = () => {
    // 假设URL格式为 /projects/:projectId 或 /project/:projectId
    const pathSegments = pathname.split('/').filter(Boolean)
    const projectIndex = pathSegments.findIndex(segment => 
      segment === 'projects' || segment === 'project'
    )
    
    if (projectIndex !== -1 && pathSegments[projectIndex + 1]) {
      return pathSegments[projectIndex + 1]
    }
    
    // 也可以通过正则表达式匹配
    const projectIdMatch = pathname.match(/\/projects?\/([^\/]+)/)
    return projectIdMatch ? projectIdMatch[1] : null
  }

  const currentProjectId = getCurrentProjectId()

  // 检查项目是否被选中
  const isProjectSelected = (item: ProjectsSidebarItem) => {
    if (!currentProjectId) return false
    
    // 方法1: 如果item有id字段
    if (item.id) {
      return item.id === currentProjectId
    }
    
    // 方法2: 从URL中提取projectId进行比较
    const urlMatch = item.url.match(/\/projects?\/([^\/]+)/)
    const itemProjectId = urlMatch ? urlMatch[1] : null
    
    return itemProjectId === currentProjectId
  }



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

        {/* <SidebarMenuItem className="mb-2">
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
        </SidebarMenuItem> */}

        {/* <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <a href="/chat" className={`w-full flex items-center gap-2 px-2 ${pathname === '/chat' ? 'bg-gray-100 rounded' : ''}`}>
              <Building2 className="h-4 w-4" /> 
              <span className="text-lg">聊天机器人</span>
            </a>

          </SidebarMenuButton>
        </SidebarMenuItem> */}


      </SidebarMenu>
    </SidebarGroup>


    {/* 收藏项目+历史项目 */}
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {/* <SidebarGroupLabel className="font-sans font-semibold text-gray-900">收藏项目</SidebarGroupLabel> 
      <SidebarMenu className="mb-4">
        {projects.filter(item=>item.starred === true).map((item) => (
          <SidebarMenuItem key={item.name}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                <SidebarMenuButton asChild>
                    <a href={item.url} className={`w-full flex items-center justify-between ${
                      isProjectSelected(item) ? 'bg-blue-100 border-l-4 border-l-blue-500 text-blue-700' : 'hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Star className={`flex-shrink-0 size-3 ${
                          isProjectSelected(item) ? 'text-blue-600' : ''
                        }`}/>
                        <span className={`truncate ${
                          isProjectSelected(item) ? 'text-blue-700 font-medium' : 'text-gray-500'
                        }`}>{item.name}</span>
                      </div>
                      <span className={`text-xs ml-2 flex-shrink-0 ${
                        isProjectSelected(item) ? 'text-blue-600' : 'text-gray-400'
                      }`}>{item.status}</span>
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
      </SidebarMenu> */}

      <SidebarGroupLabel className="font-sans font-semibold text-gray-900">最近项目</SidebarGroupLabel> 
      <SidebarMenu className="mb-4">
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={`w-full flex items-center justify-between ${
                        isProjectSelected(item) ? 'bg-blue-100 border-l-4 border-l-blue-500 text-blue-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <PenLine className={`flex-shrink-0 size-3 ${
                          isProjectSelected(item) ? 'text-blue-600' : ''
                        }`}/>
                        <span className={`truncate ${
                          isProjectSelected(item) ? 'text-blue-700 font-medium' : 'text-gray-500'
                        }`}>{item.name}</span>
                      </div>
                      <span className={`text-xs ml-2 flex-shrink-0 ${
                        isProjectSelected(item) ? 'text-blue-600' : 'text-gray-400'
                      }`}>{item.status}</span>
                    </Link>
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
          <SidebarMenuButton 
            className="text-sidebar-foreground/70"
            onClick={() => navigate({ to: '/projects' })}
          >
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>查看全部项目</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

    </SidebarGroup>
  </>
  )
}
