import { createFileRoute } from '@tanstack/react-router'
import { TenderAnalysisPage } from '@/components/projects/TenderAnalysis/_TenderAnalysisPage'

export const Route = createFileRoute('/projects/$projectId/tender-analysis')({
  component: TenderAnalysisComponent,
})

function TenderAnalysisComponent() {
  const { projectId } = Route.useParams()
  
  return (
    <TenderAnalysisPage projectId={projectId} />
  )
}