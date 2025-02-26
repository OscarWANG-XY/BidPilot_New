import { createFileRoute, redirect } from '@tanstack/react-router'
import { mockData } from '@/components/projects/ProjectManagement/mockData'

export const Route = createFileRoute('/projects/$id/new')({
  beforeLoad: ({ params }) => {
    try {
      // 获取项目的第一个阶段
      const firstPhase = mockData[0]
      
      if (firstPhase) {
        throw redirect({
          to: '/projects/$id/phases/$phaseId/$viewMode',
          params: {
            id: params.id,
            phaseId: firstPhase.id,
            viewMode: 'navigation'
          }
        })
      } else {
        // 如果没有找到阶段，重定向到项目概览页面
        throw redirect({
          to: '/projects/$id',
          params: { id: params.id }
        })
      }
    } catch (error) {
      console.error('重定向错误:', error)
      // 出错时重定向到项目概览页面
      throw redirect({
        to: '/projects/$id',
        params: { id: params.id }
      })
    }
  },
  component: NewProjectRedirect
})

function NewProjectRedirect() {
  // 这个组件实际上不会被渲染，因为 beforeLoad 会重定向
  return <div>重定向中...</div>
} 