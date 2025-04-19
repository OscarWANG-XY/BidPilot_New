import { createFileRoute } from '@tanstack/react-router'
// import { StageType } from '@/_types/projects_dt_stru/projectStage_interface'
// import { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface'
// import TaskContainer from '@/components/Task/TaskContainer'
//  import ConfigurationPanelTest from '@/components/Task/ConfigurationPanel/test'
// import AnalysisPanelTest from '@/components/Task/AnalysisPanel/test'
// import ReviewPanelTest from '@/components/Task/ReviewPanel/test'
// import TaskContainer from '@/components/Task/TaskContainer'
import TenderAnalysisPage from '@/components/projects/TenderAnalysis/TenderAnalysisPage/TenderAnalysisPage'

export const Route = createFileRoute('/playground/task')({
  component: RouteComponent,
})

const projectId = "c81c3f8a-39d5-404f-b8f3-392a22b509af"
// const stageType = "TENDER_ANALYSIS" as StageType
// const projectId = "db8e2726-b94e-46c9-9c52-97efd63bf23a"
// const stageType = "TENDER_ANALYSIS" as StageType
// const taskType = "OUTLINE_ANALYSIS_TASK" as TaskType

function RouteComponent() {
  return(
    <>
    {/* <div>Hello "/playground/task"!</div> */}
    {/* <TaskContainer projectId={projectId} stageType={stageType} /> */}
    {/* <ConfigurationPanelTest /> */}
    {/* <AnalysisPanelTest /> */}
    {/* <ReviewPanelTest /> */}
    {/* <TaskContainer projectId={projectId} stageType={stageType} taskType={taskType} isEnabled={true} /> */}
    <TenderAnalysisPage 
      projectId={projectId}
    />
    </>
  ) 
}
