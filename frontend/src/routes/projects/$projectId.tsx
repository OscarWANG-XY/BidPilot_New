import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ProjectLayout } from '@/components/projects/_04_ProjectLayout'

// 这个文件作为 $projectId 下所有子路由的父级布局
export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectLayoutComponent,
})

function ProjectLayoutComponent() {
  const { projectId } = Route.useParams()
  
  return (
    <ProjectLayout projectId={projectId}>
      <Outlet />
    </ProjectLayout>
  )
}