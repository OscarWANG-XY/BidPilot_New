"use client" // 表示代码是客户端组件，如果不添加，Next.js会尝试在服务器端运行，从而导致错误。 
import {
  BadgeCheck,
  //Bell,
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
import { useAuth } from "@/_hooks/auth-context"
import { useToast } from "@/_hooks/use-toast"
import { UserResponse } from "@/_types/user_dt_stru"
import { useNavigate } from "@tanstack/react-router"

// ========================= 用户导航栏 =========================
export function NavUser({
  user,
}: {
  user: UserResponse
}) {
  const { isMobile } = useSidebar()
  const { logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  // 创建一个安全的用户对象，当user为null时使用默认值
  const safeUser = user || {
    name: "王晖",
    phone: "18501771516",
    email: "example@email.com",
  }

  // -------------------  定义注销方法  -------------------  
  const handleLogout = async () => {
    try {
      logout()
      toast({
        title: "已退出登录",
        description: "期待您的再次访问",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "退出失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    }
  }

  // -------------------  定义用户头像  -------------------  
  
  const userAvatar = '/avatars/shadcn.jpg'

  // -------------------  组件渲染  -------------------  
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
                <AvatarImage src={userAvatar} alt={safeUser.phone || ''} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{safeUser.phone || ''}</span>
                <span className="truncate text-xs">{safeUser.email || ''}</span>
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
                  <AvatarImage src={userAvatar} alt={safeUser.phone || ''} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{safeUser.phone || ''}</span>
                  <span className="truncate text-xs">{safeUser.email || ''}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate({ to: "/users/subscription" })}>
                <Sparkles className="mr-2 h-4 w-4" />
                升级为Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate({ to: "/users/account" })}>
                <BadgeCheck className="mr-2 h-4 w-4" />
                账户管理
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/users/billing" })}>
                <CreditCard className="mr-2 h-4 w-4" />
                订单查询
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => navigate({ to: "/users/settings" })}>
                <Bell className="mr-2 h-4 w-4" />
                系统设置
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              登出
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
