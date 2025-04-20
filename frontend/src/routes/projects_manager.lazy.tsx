import { ProjectManager } from '@/components/projects/Project/_ProjectManager'
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/projects_manager')({
  component: RouteComponent,
})

function RouteComponent() {
  return(
    <div>
        <ProjectManager />
    </div>
  )

}
