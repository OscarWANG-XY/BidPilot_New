import { createFileRoute } from '@tanstack/react-router'
import BidPilot from '@/components/projects/Agents/BidPilot'

export const Route = createFileRoute('/projects/$projectId/bidpilot')({
  component: BipilotComponent,
})

function BipilotComponent() {
  const { projectId } = Route.useParams()
  return <BidPilot projectId={projectId} />
}


// 请看一下代码，我需要构建一个逻辑，

// 通过sseHistoryQuery 获取后端的sseHistory的数据

// 如果数据存在，先一条一条地渲染数据，然后连接上SSE

// 如果数据不存在

