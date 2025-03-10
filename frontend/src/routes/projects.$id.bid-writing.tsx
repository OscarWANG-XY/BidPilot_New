import { createFileRoute } from '@tanstack/react-router'
//import { BidWriting } from '@/components/projects/BidWriting'

export const Route = createFileRoute('/projects/$id/bid-writing')({
  component: BidWritingComponent,
})

function BidWritingComponent() {
  const { id } = Route.useParams()
  
  return (
    //<BidWriting projectId={id} />
    <div>
      <h1>投标文件编写</h1>
      <p>项目ID: {id}</p>
    </div>
  )
} 