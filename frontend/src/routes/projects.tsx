import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { ProjectManager } from '@/components/projects/_ProjectManager'

export const Route = createFileRoute('/projects')({
  component: () => {
    const router = useRouter()
    const isDetailPage = router.state.matches.some(
      match => match.routeId === '/projects/$id'
    )
    
    console.log('Router State:', {
      matches: router.state.matches,
      isDetailPage,
      currentPath: router.state.location.pathname
    })
    
    return (
      <div>
        {!isDetailPage && <ProjectManager />}
        <Outlet />
      </div>
    )
  },
})