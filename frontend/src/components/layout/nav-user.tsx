/**
* 用户导航组件 (NavUser)
* 
* 功能描述:
* - 显示当前用户信息的下拉菜单组件
* - 在侧边栏底部显示用户头像、姓名和邮箱
* - 点击展开下拉菜单，提供用户相关的操作选项
* - 响应式设计，根据移动端状态调整下拉菜单位置
* 
* 组件结构:
* SidebarMenu                     // 菜单容器
*   └── SidebarMenuItem          // 菜单项
*        └── DropdownMenu        // 下拉菜单
*             ├── DropdownMenuTrigger   // 触发器
*             │    └── SidebarMenuButton // 包含用户头像和信息的按钮
*             │         ├── Avatar      // 用户头像
*             │         └── UserInfo    // 用户名和邮箱
*             │
*             └── DropdownMenuContent   // 下拉菜单内容
*                  ├── DropdownMenuLabel    // 用户信息标签
*                  ├── DropdownMenuGroup    // "升级专业版"选项组
*                  ├── DropdownMenuGroup    // 账户相关选项组
*                  │    ├── Account        // 账户设置
*                  │    ├── Billing        // 账单
*                  │    └── Notifications  // 通知
*                  └── LogOut              // 登出选项
*
* 使用的组件:
* - Sidebar 相关组件(@/components/ui/sidebar):
*   SidebarMenu, SidebarMenuItem, SidebarMenuButton
* 
* - DropdownMenu 相关组件(@/components/ui/dropdown-menu):
*   DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
*   DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
*   DropdownMenuTrigger
* 
* - Avatar 相关组件(@/components/ui/avatar):
*   Avatar, AvatarImage, AvatarFallback
* 
* - Lucide 图标组件:
*   BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles
* 
* @param {Object} user - 用户信息对象
* @param {string} user.name - 用户名称
* @param {string} user.email - 用户邮箱
* @param {string} user.avatar - 用户头像URL
*/

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
