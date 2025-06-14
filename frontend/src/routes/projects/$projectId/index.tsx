import {
    createFileRoute,
    Outlet,
    redirect
  } from '@tanstack/react-router'
  import { ProjectLayout } from '@/components/projects/ProjectLayout/ProjectLayout'
  
  export const Route = createFileRoute('/projects/$projectId/')({
    component: ProjectDetailComponent,
    beforeLoad: ({ params }) => {
      // 重定向到第一个阶段
      throw redirect({
        to: '/projects/$projectId/bidpilot',
        params: { projectId: params.projectId }
      })
    },
  })
  
  function ProjectDetailComponent() {
    const { projectId } = Route.useParams()
    
    return (
      <div>
        <ProjectLayout projectId={projectId}>
          <Outlet />
        </ProjectLayout>
      </div>
    )
  }