import { createFileRoute } from '@tanstack/react-router'
import { TenderAnalysisPage } from '@/components/projects/TenderAnalysis_v2/_TenderAnalysisPage_v2'

export const Route = createFileRoute('/projects/$projectId/tender-analysis')({
  component: TenderAnalysisComponent,
})

function TenderAnalysisComponent() {
  const { projectId } = Route.useParams()
  
  return (
    <TenderAnalysisPage projectId={projectId} />
  )
}