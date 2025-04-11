import { createFileRoute } from '@tanstack/react-router'
import { StageType } from '@/_types/projects_dt_stru/projectStage_interface'
import { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface'
// import TaskContainer from '@/components/Task/TaskContainer'
//  import ConfigurationPanelTest from '@/components/Task/ConfigurationPanel/test'
// import AnalysisPanelTest from '@/components/Task/AnalysisPanel/test'
//import ReviewPanelTest from '@/components/Task/ReviewPanel/test'
import TaskContainer from '@/components/Task/TaskContainer'

export const Route = createFileRoute('/playground/task')({
  component: RouteComponent,
})

// const projectId = "project-001"
// const stageType = "TENDER_ANALYSIS" as StageType
const projectId = "project-001"
const stageType = "TENDER_ANALYSIS" as StageType
const taskType = "OUTLINE_ANALYSIS_TASK" as TaskType

function RouteComponent() {
  return(
    <>
    <div>Hello "/playground/task"!</div>
    {/* <TaskContainer projectId={projectId} stageType={stageType} /> */}
    {/* <ConfigurationPanelTest /> */}
    {/* <AnalysisPanelTest /> */}
    {/* <ReviewPanelTest /> */}
    <TaskContainer projectId={projectId} stageType={stageType} taskType={taskType} isEnabled={true} />
    </>
  ) 
}
