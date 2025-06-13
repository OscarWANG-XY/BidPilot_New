import { createLazyFileRoute } from '@tanstack/react-router'
import { CreateProjectDialog } from "@/components/projects/Project/_01_ProjectCreate_HOME"

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary tracking-tight">
          Welcome to BidPilot!
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          让我们开启招投标之旅吧！
        </p>

        {/* 添加创建项目按钮 */}
        <div className="pt-8">
          <CreateProjectDialog />
        </div>
      </div>
    </div>
  )
}
