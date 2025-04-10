import { createFileRoute } from '@tanstack/react-router'
// import { StageType } from '@/types/projects_dt_stru/projectStage_interface'
// import TaskContainer from '@/components/Task/TaskContainer'
//  import ConfigurationPanelTest from '@/components/Task/ConfigurationPanel/test'
// import AnalysisPanelTest from '@/components/Task/AnalysisPanel/test'
import ReviewPanelTest from '@/components/Task/ReviewPanel/test'
export const Route = createFileRoute('/playground/task')({
  component: RouteComponent,
})
// const projectId = "project-001"
// const stageType = "TENDER_ANALYSIS" as StageType

function RouteComponent() {
  return(

    <>
    <div>Hello "/playground/task"!</div>
    {/* <TaskContainer projectId={projectId} stageType={stageType} /> */}
    {/* <ConfigurationPanelTest /> */}
    {/* <AnalysisPanelTest /> */}
    <ReviewPanelTest />
    </>

  ) 
  
}
