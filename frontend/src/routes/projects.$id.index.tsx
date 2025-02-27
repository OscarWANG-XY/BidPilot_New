import { createFileRoute } from '@tanstack/react-router'
import { ProjectOverview } from '@/components/projects/_05_ProjectPhasesOverview'

export const Route = createFileRoute('/projects/$id/')({
  component: ProjectIndexComponent,
})

function ProjectIndexComponent() {
  const { id } = Route.useParams()
  
  return (
    <ProjectOverview projectId={id} />
  )
}
