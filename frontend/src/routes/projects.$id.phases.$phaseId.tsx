import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$id/phases/$phaseId')({
  component: PhaseIndexComponent,
  beforeLoad: ({ params, location }) => {
    // 检查当前URL是否已经包含viewMode
    // 只有当URL完全匹配 /projects/{id}/phases/{phaseId} 时才重定向
    // 否则会出现无限循环
    if (!location.pathname.includes(`/phases/${params.phaseId}/`)) {
        // include()里，以/结尾，整个条件表示如果phaseId后面是没有扩展的，即为/projects/{id}/phases/{phaseId}
      throw redirect({
        to: '/projects/$id/phases/$phaseId/$viewMode',
        params: {
          id: params.id,
          phaseId: params.phaseId,
          viewMode: 'navigation'
        }
      });
    }
    // 如果URL已经包含额外路径，不执行重定向
  }
})

function PhaseIndexComponent() {
  // 如果URL已经包含viewMode，这个组件会被渲染
  // 但我们需要渲染子路由的内容
  return( 
    <div>
        <Outlet /> {/* 这里会渲染子路由的内容 */}
    </div>
)} 