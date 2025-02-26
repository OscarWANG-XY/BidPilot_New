import {
  createFileRoute,
  Outlet
} from '@tanstack/react-router'
// import { ProjectDetail } from '@/components/projects/ProjectDetail'
//import { ProjectManagement} from '@/components/projects/projectstages'

import { ProjectLayout } from '@/components/projects/ProjectManagement/ProjectLayout'

export const Route = createFileRoute('/projects/$id')({
  component: ProjectLayoutComponent,
})

function ProjectLayoutComponent() {
  const { id } = Route.useParams()   //通过useParams获取当前路由的参数对象，这里是id
  
  return (
      <div>
        <ProjectLayout projectId={id}>
          <Outlet />   {/* 由于有projects.$id.index.tsx, 它的内容渲染在这里的outlet位置, 对应layout组件的children的children的位置*/}
        </ProjectLayout>
      </div> 
  )
}

