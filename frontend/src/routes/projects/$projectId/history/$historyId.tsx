import { createFileRoute, redirect } from '@tanstack/react-router'

// 定义 search 参数的类型
interface SearchParams {
  type?: string
}

export const Route = createFileRoute('/projects/$projectId/history/$historyId')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    // 验证并转换 search 参数
    return {
      type: typeof search.type === 'string' ? search.type : 'project'
    }
  },
  beforeLoad: ({ params, search }) => {
    const { projectId, historyId } = params
    const { type = 'project' } = search
    
    // 重定向到具体类型的历史记录页面
    if (type === 'project') {
      throw redirect({
        to: `/projects/$projectId/history/project/$historyId`,
        params: { projectId, historyId }
      })
    } else if (type === 'stage') {
      throw redirect({
        to: `/projects/$projectId/history/stage/$historyId`,
        params: { projectId, historyId }
      })
    } else {
      // 默认重定向到项目历史
      throw redirect({
        to: `/projects/$projectId/history/task/$historyId`,
        params: { projectId, historyId }
      })
    }
  },
  component: () => null // 由于会重定向，此组件不会被渲染
})