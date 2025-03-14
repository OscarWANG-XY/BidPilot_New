import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$projectId/')({
  component: ProjectOverviewComponent,
  // 如果仍需重定向，可以保留这段代码
  beforeLoad: ({ params }) => {
    // 重定向到第一个阶段
    throw redirect({
      to: '/projects/$projectId/tender-analysis',
      params: { projectId: params.projectId }
    })
  },
})

function ProjectOverviewComponent() {
  const { projectId } = Route.useParams()
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">项目概览</h1>
      <p className="mb-4">项目ID: {projectId}</p>
      
      {/* 项目概览内容 */}
    </div>
  )
}