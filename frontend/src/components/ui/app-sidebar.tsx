import { Calendar, Home, Inbox, Settings } from "lucide-react"
import { Link } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"

// Menu items.
// 修改 items 数组
const items = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "招投标管理",
      url: "/tender-bid-management",
      icon: Inbox,
    },
    {
      title: "企业档案",
      url: "/company",
      icon: Calendar,
    },
    {
      title: "用户管理",
      url: "/users",
      icon: Settings,
    },
  ]
  

export function AppSidebar() {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b px-4 py-2">
        <span className="text-lg font-semibold">Application</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
