import {
    createFileRoute,
    Outlet,
    useRouter,
  } from '@tanstack/react-router'
  import { ProjectManager } from '@/components/projects/Project/_ProjectManager'
  
  export const Route = createFileRoute('/projects/')({
    component: ProjectsComponent,
  })
  
  function ProjectsComponent() {
    const router = useRouter()
    
    // 检查当前路由是否为项目详情页
    const isDetailPage = router.state.matches.some(
      (match) => match.routeId.startsWith('/projects/$projectId'),
    )
  
    return (
      <div>
        {!isDetailPage && <ProjectManager />}
        <Outlet />
      </div>
    )
  }