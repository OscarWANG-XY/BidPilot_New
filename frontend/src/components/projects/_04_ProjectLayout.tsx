import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { ProjectStatus } from '@/types/projects_dt_stru/projects_interface'
import { useProjects } from '@/hooks/useProjects/useProjects'

interface ProjectLayoutProps {
  projectId: string
  children: React.ReactNode  // 宽泛的类型定义，可以是React组件或HTML元素，或string, 或null, 或boolean, 等等
}

// 定义 Tab 配置
// 未来可以在这里添加新的tab和路由，比如添加招标公告的分析。 
const TABS = [
  {
    value: 'tender-analysis',
    label: '招标文件分析',
    to: '/projects/$id/tender-analysis',
  },
  {
    value: 'bid-writing',
    label: '投标文件编写',
    to: '/projects/$id/bid-writing',
  },
]

// React.FC 是 React Function Component
export const ProjectLayout: React.FC<ProjectLayoutProps> = ({ projectId, children }) => {
  //const { id } = useParams({ strict: false })
  
  // 使用 useLocation 来监听路由变化， 而不是使用router, 之前使用router.state.location并不会自动触发更新
  const location = useLocation()
  
  // 根据当前路由动态设置选中的 Tab
  const currentTab = TABS.find((tab) => 
    location.pathname.endsWith(tab.value)
  )?.value || TABS[0].value

  const { singleProjectQuery, updateProjectStatus } = useProjects()
  const { data: project } = singleProjectQuery(projectId)
  const projectStatus = project?.status || ProjectStatus.IN_PROGRESS;
  
  // 处理项目取消
  const handleCancelProject = async () => {
    try {
      await updateProjectStatus({
        id: projectId,
        status: ProjectStatus.CANCELLED,
        remarks: "用户手动取消项目"
      });
      
      toast({
        title: "项目已取消",
        description: "项目状态已更新为已取消",
      });
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error?.response?.data?.message || error.message || "取消项目时出错",
        variant: "destructive",
      });
    }
  };

  // 假设我们从某处获取项目状态，这里需要添加实际的状态获取逻辑
  // 这里只是示例，实际实现需要从API或props获取

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Tab 导航 - 添加了flex布局使按钮靠右 */}
      <div className="flex justify-between items-center mb-4">
        <Tabs value={currentTab}>
          <TabsList className="w-auto border-b">
            {TABS.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="px-6 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary" 
                asChild
              >
                <Link to={tab.to} params={{ projectId: projectId }}>
                  {tab.label}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* 添加项目操作按钮区域 */}
        <div className="flex gap-2">
          {projectStatus === ProjectStatus.IN_PROGRESS && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  取消项目
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认取消项目</AlertDialogTitle>
                  <AlertDialogDescription>
                    取消项目后，所有相关工作将停止。此操作不可逆，确定要继续吗？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>返回</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelProject}>
                    确认取消
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {projectStatus === ProjectStatus.CANCELLED && (
            <div className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm">
              项目已取消
            </div>
          )}
          
          {projectStatus === ProjectStatus.COMPLETED && (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">
              项目已完成
            </div>
          )}
        </div>
      </div>
      
      {/* 显示项目状态提示（如果已取消） */}
      {projectStatus === ProjectStatus.CANCELLED && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          此项目已被取消，所有相关工作已停止。
        </div>
      )}
      
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          {/* 在父组件即project$id路由里，ProjectLayout 包裹的内容会被放到children的位置*/}  
          {children}   
        </CardContent>
      </Card>
    </div>
  )
}
