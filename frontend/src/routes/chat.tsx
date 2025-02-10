// routes/chat/index.tsx
import { createFileRoute, Outlet, useMatchRoute } from '@tanstack/react-router'
import { ChatSessionList } from '@/components/chat/ChatSessionList'
import { useChatSessions } from '@/hooks/useChat'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { MessageSquarePlus } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/chat')({
  component: ChatIndexPage,
})

function ChatIndexPage() {

  // 获取useChatSessions钩子的 会话列表， 加载状态， 创建会话 三个功能
  const { sessions, isLoading, createSession } = useChatSessions()

  // 获取应用程序中 导航 的功能
  const navigate = useNavigate()

  // 获取 匹配当前路由 功能
  const matchRoute = useMatchRoute()

  // 检查当前页面是否是聊天的主页面
  const isIndexRoute = matchRoute({ to: '/chat' })

  // 处理会话创建
  // 创建新会话，并导航到新会话页面
  const handleCreateSession = async () => {
    try {
      const newSession = await createSession()
      navigate({
        to: '/chat/$sessionId',
        params: { sessionId: newSession.id },
      })
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  //  ------------ 聊天主页面 渲染------------- 
  return (
    <div className="flex h-full overflow-hidden">


      {/* 左侧会话列表 */}
      <aside className="w-[300px] overflow-y-auto border-r">
        <ChatSessionList sessions={sessions} isLoading={isLoading} />
      </aside>

      <Separator orientation="vertical" />

      {/* 右侧内容区 */}
      <main className="flex-1 overflow-y-auto">
        {isIndexRoute ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">欢迎使用AI助手</h2>
              <p className="text-muted-foreground">
                选择一个现有会话开始聊天，或者创建一个新的会话
              </p>
            </div>
            <Button onClick={handleCreateSession} className="gap-2">
              <MessageSquarePlus className="h-4 w-4" />
              开始新会话
            </Button>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  )
}