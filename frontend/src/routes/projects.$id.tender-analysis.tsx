import { createFileRoute } from '@tanstack/react-router'
import { TenderAnalysisPage } from '@/components/projects/_05_TenderAnalysisPage'

export const Route = createFileRoute('/projects/$id/tender-analysis')({
  component: TenderAnalysisComponent,
})

function TenderAnalysisComponent() {
  const { id } = Route.useParams()
  
  return (
    <TenderAnalysisPage projectId={id} />
  )
} 