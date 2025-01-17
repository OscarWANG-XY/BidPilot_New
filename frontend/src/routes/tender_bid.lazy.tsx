import { createLazyFileRoute } from '@tanstack/react-router'
import { ProjectMain } from "@/components/project/projectMain"

export const Route = createLazyFileRoute('/tender_bid')({
  component: RouteComponent,
})

function RouteComponent() {
  return( 
    <>
    <div className="container mx-auto p-4 space-y-6">
      <ProjectMain />
    </div>
    </>
  )
}
