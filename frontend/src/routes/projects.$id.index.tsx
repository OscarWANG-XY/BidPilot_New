import { createFileRoute, redirect } from '@tanstack/react-router'
//import { ProjectOverview } from '@/components/projects/_05_ProjectPhasesOverview'

// 通过redict，当用户进入projects.$id的路由时，会出现直接跳转，提升用户体验。 
// 未来可以通过添加ProjectIndexComponent的功能，进行项目阶段导航，统计等管理，目前先不添加。  
export const Route = createFileRoute('/projects/$id/')({
  beforeLoad: ({ params }) => {
    // 重定向到第一个阶段
    throw redirect({
      to: '/projects/$id/tender-analysis',
      params: { id: params.id }
    })
  },
})


// 项目概览页面， 目前用不到，以后可以拓展使用，当启用的时候，山姆的redirect需要删除。 
// function ProjectIndexComponent() {
//   const { id } = Route.useParams()
  
//   return (
//     <ProjectOverview projectId={id} />
//   )
// }
