import { createFileRoute } from '@tanstack/react-router'
import { ProjectPhaseView } from '@/components/projects/_06_ProjectPhaseView'
// 导入更新后的mockData
import { mockCompleteProjectData } from '@/components/projects/mockData'

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
  
  console.log('Rendering PhaseViewComponent with:', { id, phaseId, viewMode });
  console.log('Available mockData:', mockCompleteProjectData);
  
  // 从mockCompleteProjectData中获取项目数据
  // 注意：在实际应用中，您可能需要从API获取这些数据
  const projectData = mockCompleteProjectData.project
  console.log('Found projectData:', projectData);
  
  // 获取当前项目阶段和状态
  const currentProjectStage = projectData.currentStage
  const projectStatus = projectData.status
  
  console.log('Using stage and status:', { currentProjectStage, projectStatus });
  
  // 检查phaseId是否存在于mockData中
  const phaseExists = mockCompleteProjectData.phases.some(phase => phase.id === phaseId);
  console.log('Phase exists in mockData:', phaseExists);
  
  return (
    <div className="phase-view-container">
      <ProjectPhaseView 
        projectId={id} 
        phaseId={phaseId} 
        viewMode={viewMode as 'navigation' | 'detail'} 
        currentProjectStage={currentProjectStage}
        projectStatus={projectStatus}
      />
    </div>
  )
} 