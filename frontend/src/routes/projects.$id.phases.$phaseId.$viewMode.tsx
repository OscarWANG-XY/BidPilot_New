import { createFileRoute } from '@tanstack/react-router'
import { ProjectPhaseView } from '@/components/projects/ProjectManagement/ProjectPhaseView'
// 假设我们可以从某个地方导入或获取项目状态数据
import { mockData } from '@/components/projects/ProjectManagement/mockData'

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
  console.log('Available mockData:', mockData);
  
  // 从mockData中获取项目状态数据
  // 注意：在实际应用中，您可能需要从API获取这些数据
  const projectData = mockData.find(project => project.id === id) || mockData[0]
  console.log('Found projectData:', projectData);
  
  const currentProjectStage = projectData?.stage || 'planning'
  const projectStatus = projectData?.status || 'active'
  
  console.log('Using stage and status:', { currentProjectStage, projectStatus });
  
  // 检查phaseId是否存在于mockData中
  const phaseExists = mockData.some(phase => phase.id === phaseId);
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