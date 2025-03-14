import { createFileRoute } from '@tanstack/react-router'
//import { BidWriting } from '@/components/projects/BidWriting'

export const Route = createFileRoute('/projects/$projectId/bid-writing')({
  component: BidWritingComponent,
})

function BidWritingComponent() {
  const { projectId } = Route.useParams()
  
  return (
    //<BidWriting projectId={projectId} />
    <div>
      <h1>投标文件编写</h1>
      <p>项目ID: {projectId}</p>
    </div>
  )
}