import { createLazyFileRoute } from '@tanstack/react-router'
import TaskContainer from '@/components/GeneralTask/TaskContainer'
import type { StageType } from '@/types/projects_dt_stru/projectStage_interface'

export const Route = createLazyFileRoute('/company')({
  component: RouteComponent,
})

function RouteComponent() {
  // You can replace these with actual values from your application context,
  // URL parameters, or state management system
  const projectId = "project-001"
  const stageType = "TENDER_ANALYSIS" as StageType

  return (
    <div className="p-4"> 
      <h1 className="text-2xl font-bold mb-4">Company Task Management</h1>
      <div className="border rounded-lg shadow-sm">
        <TaskContainer 
          projectId={projectId} 
          stageType={stageType}
        />
      </div>
    </div>
  )
}
