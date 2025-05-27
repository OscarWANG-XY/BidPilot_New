import { createFileRoute } from '@tanstack/react-router'
// import AnalysisComponent from '@/components/agents/test_StructuringManager'
import StructuringAgent from '@/components/agents/StructuringAgent'

export const Route = createFileRoute('/projects/$projectId/structuring')({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = Route.useParams()
  // return <AnalysisComponent projectId={projectId} />
  return <StructuringAgent projectId={projectId} />
}
