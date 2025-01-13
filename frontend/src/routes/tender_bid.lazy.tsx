import { createLazyFileRoute } from '@tanstack/react-router'
import { ProjectCard } from "@/components/project/project_card"
import { ProjectProcess } from "@/components/project/project_process"

export const Route = createLazyFileRoute('/tender_bid')({
  component: RouteComponent,
})

function RouteComponent() {
  return( 
    <>
    <div className="container mx-auto p-4 space-y-6">
      <ProjectCard />
      <ProjectProcess />
    </div>
    </>
  )
}
