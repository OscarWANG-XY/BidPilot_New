// routes/chat/$sessionId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ChatPanel } from '@/components/chat/ChatPannel'

export const Route = createFileRoute('/chat/$sessionId')({
  component: ChatSessionPage,

  // 路由加载前执行loader
  loader: async ({ params }) => {
    // 确保 sessionId 是有效的
    if (!params.sessionId) {
      throw new Error('Invalid session ID')
    }
    return { sessionId: params.sessionId }
  },
  errorComponent: ({ error }) => (
    <div className="flex h-full items-center justify-center p-4">
      <div className="text-center space-y-2">
        <p className="text-destructive">会话加载失败</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
})

function ChatSessionPage() {
  const { sessionId } = Route.useParams()

  return <ChatPanel sessionId={sessionId} />
}
