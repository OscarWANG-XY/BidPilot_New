/**
* 团队切换器组件 (TeamSwitcher)
* 
* 功能描述:
* - 实现团队/公司之间的快速切换功能
* - 显示当前选中的团队信息（logo、名称和计划类型）
* - 通过下拉菜单展示所有可选团队列表
* - 支持键盘快捷键（⌘1、⌘2等）快速切换团队
* - 响应式设计，根据移动端状态调整下拉菜单位置
* 
* 组件结构:
* SidebarMenu                     // 菜单容器
*   └── SidebarMenuItem          // 菜单项
*        └── DropdownMenu        // 下拉菜单
*             ├── DropdownMenuTrigger   // 触发器
*             │    └── SidebarMenuButton // 当前团队信息按钮
*             │         ├── Logo        // 团队logo
*             │         ├── TeamInfo    // 团队名称和计划
*             │         └── ChevronIcon // 下拉箭头
*             │
*             └── DropdownMenuContent   // 下拉菜单内容
*                  ├── DropdownMenuLabel    // "公司"标签
*                  └── TeamList            // 团队列表项
*                       └── DropdownMenuItem // 单个团队选项
*
* 使用的组件:
* - Sidebar 相关组件(@/components/ui/sidebar):
*   SidebarMenu, SidebarMenuItem, SidebarMenuButton
* 
* - DropdownMenu 相关组件(@/components/ui/dropdown-menu):
*   DropdownMenu, DropdownMenuContent, DropdownMenuItem,
*   DropdownMenuLabel, DropdownMenuShortcut, DropdownMenuTrigger
* 
* - Lucide 图标组件:
*   ChevronsUpDown
* 
* 状态管理:
* - activeTeam: 当前选中的团队
* - setActiveTeam: 更新当前团队的状态函数
* 
* @param {Object[]} teams - 团队配置数组
* @param {string} teams[].name - 团队名称
* @param {React.ElementType} teams[].logo - 团队logo组件
* @param {string} teams[].plan - 团队计划类型
*/

"use client" // 表示代码是客户端组件，如果不添加，Next.js会尝试在服务器端运行，从而导致错误。 
import { 
  ChevronsUpDown, 
  Cpu,
} from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground bg-blue-500">
                <Cpu className="size-6" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  执智者
                </span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
