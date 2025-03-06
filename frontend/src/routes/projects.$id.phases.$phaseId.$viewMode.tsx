import { createFileRoute } from '@tanstack/react-router'
import { ProjectPhaseView } from '@/components/projects/_06_ProjectPhaseView'
import { useProjects } from '@/hooks/useProjects'
import { StageType } from '@/types/projects_dt_stru'
//import { LoadingView } from '@/components/LoadingView'
//import { ErrorView } from '@/components/ErrorView'

export const Route = createFileRoute('/projects/$id/phases/$phaseId/$viewMode')({

  component: PhaseViewComponent,

  // parseParams 是tanstack router路由配置选项，用于解析路由参数
  parseParams: (params) => {
    console.log('Parsing params:', params);
    // 验证视图模式是否有效
    const validViewModes = ['navigation', 'detail']
    if (!validViewModes.includes(params.viewMode)) {
      console.error(`Invalid view mode: ${params.viewMode}`);
      throw new Error(`Invalid view mode: ${params.viewMode}`)
    }
    return params
  }
})

function PhaseViewComponent() {

  const { id, phaseId, viewMode } = Route.useParams()
  const { projectOverviewQuery } = useProjects()
  
  console.log('渲染projects.$id.phases.$phaseId.$viewMode页面')


  
  // 使用projectOverviewQuery获取数据
  const { 
    data: projectOverview, 
  //  isLoading, 
  //  isError, 
  //  error 
  } = projectOverviewQuery(id)

  console.log('projectOverview数据：', projectOverview)
  
  // 处理加载和错误状态
  //if (isLoading) return <LoadingView />
  //if (isError) return <ErrorView error={error} />
  
  // 从API响应中获取项目数据
  if (!projectOverview) {
    return <div>加载中...</div>; // 或其他加载状态组件
  }

  const { 
    project,   // 项目在加载过程中，会出现undefined的情况， 所以上面添加了if (!projectOverview) 的处理。
    stages 
  } = projectOverview

  const currentProjectStage = project.currentActiveStage || StageType.INITIALIZATION
  const projectStatus = project.status
  
  return (
    <div className="phase-view-container">
      <ProjectPhaseView 
        projectId={id} 
        phaseId={phaseId} 
        viewMode={viewMode as 'navigation' | 'detail'} 
        currentProjectStage={currentProjectStage}
        projectStatus={projectStatus}
        phases={stages}
      />
    </div>
  )
} 