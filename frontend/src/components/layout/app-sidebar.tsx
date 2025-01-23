
"use client" // 表示代码是客户端组件，如果不添加，Next.js会尝试在服务器端运行，从而导致错误。 
import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"
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

// This is sample data.
const data = {
  user: {
    name: "王晖",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "执智者",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  projects: [
    {
      name: "北京地铁春节粮油招标",
      url: "#",
      status: "完成",
      created: "2024-12-10",
      starred: true
    },
    {
      name: "江苏大学2025春节福利",
      url: "#",
      status: "暂定",
      created: "2025-01-01",
      starred: false
    },
      {
        name: "中国移动2025年度食堂招标 - 上海办公室徐汇区",
        url: "#",
        status: "进行中",
        created: "2025-01-11",
        starred: false
      },
      {
        name: "上海核工业食堂招标",
        url: "#",
        status: "进行中",
        created: "2025-01-11",
        starred: false
      },
      {
        name: "北京地铁-春节礼包",
        url: "#",
        status: "进行中",
        created: "2025-01-11",
        starred: false
      },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  return (
    // 侧边栏容器
    <Sidebar collapsible="icon" {...props}>
      {/* 顶部区域 */}
      <SidebarHeader>
        <TeamSwitcher/>
      </SidebarHeader>
      {/* 内容区域 */}
      <SidebarContent>
        <NavProjects projects={data.projects} />         

      </SidebarContent>
      {/* 底部区域 */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      {/* 轨道 */}
      <SidebarRail />
    </Sidebar>
  )
}
