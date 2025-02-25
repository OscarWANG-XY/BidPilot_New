import { 
  createFileRoute, 
  //Outlet
} from '@tanstack/react-router'
// import { ProjectDetail } from '@/components/projects/ProjectDetail'
//import { ProjectManagement} from '@/components/projects/projectstages'
import ProjectManagement from '@/components/projects/ProjectManagement'

export const Route = createFileRoute('/projects/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  //const { id } = Route.useParams()
  
  return (   
      <ProjectManagement />
      //<ProjectDetail 
      //  projectId={id} 
        
        // 以下是关闭返回上一页，详看<ProjectDetail>的代码，并未被使用
      //  onClose={() => window.history.back()}
      ///>
      //<Outlet />
  )
}
