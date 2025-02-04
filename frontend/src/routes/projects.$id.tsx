import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ProjectDetail } from '@/components/projects/ProjectDetail'

export const Route = createFileRoute('/projects/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const router = useRouter()
  
  console.log('ProjectDetail Route:', {
    id,
    params: Route.useParams(),
    pathname: window.location.pathname,
    routerState: router.state,
    matchedRoute: router.state.matches.map(match => match.routeId)
  })
  
  return (
    <div className="container mx-auto py-6">
      <ProjectDetail 
        projectId={id} 
        onClose={() => window.history.back()}
      />
    </div>
  )
}
