import { createFileRoute } from '@tanstack/react-router'
// import { TenderAnalysisPage } from '@/components/projects/TenderAnalysis/TenderAnalysisPage'
// import { TenderAnalysisPage } from '@/components/projects/TenderAnalysis/TenderAnalysisPage/TenderAnalysisPage'

export const Route = createFileRoute('/projects/$projectId/tender-analysis')({
  component: TenderAnalysisComponent,
})

function TenderAnalysisComponent() {
  // const { projectId } = Route.useParams()
  
  return (
    <></>
    // <TenderAnalysisPage projectId={projectId} />
  )
}