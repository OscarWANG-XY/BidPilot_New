import { 
  createRootRoute, 
//  Link, 
  Outlet 
} from '@tanstack/react-router'  //Link拿掉了
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
//import { LayoutPage } from '@/components/layout/layout-page'
import { AppSidebar } from "@/components/layout/app-sidebar"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar"

export const Route = createRootRoute({
  component: () => (
    <>
    {/* 侧边栏 */}
      <SidebarProvider>   {/* 伸缩状态处理，控制侧边栏的打开和关闭 */}
        <AppSidebar />
        <SidebarInset>  {/* */}
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />   {/* 侧边栏的触发器，侧边栏右侧的按钮 */}
            <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">
                      执智者
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>招投标项目</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {/* 主内容区域 */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>

      <TanStackRouterDevtools initialIsOpen={false} position="bottom-right" />
    </>
  ),
})