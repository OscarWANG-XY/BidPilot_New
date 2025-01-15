import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Steps, Step } from "@/components/ui_own/steps"
import { useProjectStore } from "@/stores/projectStore"

export function ProjectProcess() {
  const { activeProject } = useProjectStore()

  if (!activeProject) return null

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>项目进度</CardTitle>
      </CardHeader>
      <CardContent>
        <Steps>
          {activeProject.processes.steps.map((step) => (
            <Step
              key={step.id}
              title={step.name}
              status={step.status as "pending" | "in_progress" | "completed"}
            />
          ))}
        </Steps>
        
        <Separator className="my-6" />
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">当前阶段详情</h3>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              {activeProject.processes.steps[activeProject.processes.current]?.name}
            </p>
            {/* 这里可以根据不同阶段显示相应的详细信息和操作按钮 */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
