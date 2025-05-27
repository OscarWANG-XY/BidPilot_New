import { createFileRoute } from '@tanstack/react-router'
import AnalysisComponent from '@/components/agents/StructuringManager'

export const Route = createFileRoute('/projects/$projectId/structuring')({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = Route.useParams()
  return <AnalysisComponent projectId={projectId} />
}
