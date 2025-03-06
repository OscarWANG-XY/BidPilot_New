import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload, ArrowRight } from 'lucide-react'
//import { ProjectPhase } from '../../types/projects_stages_dt_stru'
import { ProjectStage } from '@/types/projects_dt_stru'
import { StageType } from '@/types/projects_dt_stru'
import { FileManager } from '@/components/files/_FileManager'
import { useFiles } from '@/hooks/useFiles'
import { useToast } from '@/hooks/use-toast'
import { ProjectDetail } from '@/components/projects/_07_PhaseCards/Ph1_ProjectDetailCard'
import { AnalysisTasksCard } from '@/components/projects/_07_PhaseCards/Ph2_AnalysisTasksCard'
import { useProjects } from '@/hooks/useProjects'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'

interface PhaseNavigationViewProps {
  phase: ProjectStage;
  projectId: string;
}

// Add a formatDate function since it's not exported from utils
const formatDate = (date: string | Date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

export const PhaseNavigationView: React.FC<PhaseNavigationViewProps> = ({ phase, projectId }) => {
  const { refecth: refreshFiles, files } = useFiles(projectId);
  const { toast } = useToast();
  const { updateProjectStage } = useProjects();
  const navigate = useNavigate();
  
  // 检查是否已有docx文件
  const hasDocxFile = files.some(file => 
    file.name.toLowerCase().endsWith('.docx') || 
    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );


  // 处理文件上传的函数 - 返回一个布尔值表示是否应该继续上传
  const handleFileUpload = (file: File): boolean => {
    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.docx') && 
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      toast({
        title: "文件类型错误",
        description: "只允许上传Word文档(.docx)文件",
        variant: "destructive"
      });
      return false; // 阻止上传
    }
    
    // 检查是否已有docx文件
    if (hasDocxFile) {
      toast({
        title: "已存在文档",
        description: "项目已有Word文档，请先删除现有文档再上传新文档",
        variant: "destructive"
      });
      return false; // 阻止上传
    }
    
    console.log('File validation passed, proceeding with upload:', file);
    return true; // 允许上传
  }
  
  // 处理上传成功的回调
  const handleUploadSuccess = () => {
    console.log('File uploaded successfully, refreshing file list');
    refreshFiles();
  }

  // 处理下一步按钮点击
  const handleNextStep = async () => {
    try {
      // 1. 更新项目阶段到后端
      await updateProjectStage({
        id: projectId,
        stage: StageType.TENDER_ANALYSIS,
        remarks: '招标文件已上传，进入分析阶段'
      });
      
      // 2. 显示成功通知
      toast({
        title: "阶段更新成功",
        description: "已进入招标文件分析阶段",
        variant: "default"
      });
      
      // 3. 使用TanStack Router导航到分析阶段页面
      // 假设分析阶段的phaseId是2（或者你可以从某个映射中获取）
      const analysisPhaseId = '2'; // 根据你的阶段ID体系调整
      
      navigate({
        to: '/projects/$id/phases/$phaseId',
        params: {
          id: projectId,
          phaseId: analysisPhaseId
        }
      });
      
    } catch (error) {
      toast({
        title: "阶段更新失败",
        description: "无法进入下一阶段，请稍后重试",
        variant: "destructive"
      });
    }
  }

  // 渲染阶段特定组件
  const renderPhaseSpecificComponents = () => {
    switch (phase.stage) {
      case StageType.INITIALIZATION:
        return (
          <>
            <ProjectDetail 
              projectId={projectId} 
              onClose={() => {}} 
            />

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  上传招标文件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  请上传招标文件（仅支持.docx格式），系统将自动分析文件内容，为后续阶段提供支持。
                </p>
                {hasDocxFile ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
                    <p className="text-sm text-amber-800">
                      已上传Word文档。如需更新，请先删除现有文档再上传新文档。
                    </p>
                  </div>
                ) : null}
                <FileManager 
                  onFileUpload={handleFileUpload} 
                  onUploadSuccess={handleUploadSuccess}
                  projectId={projectId} 
                  title="招标文件上传"
                  acceptedFileTypes=".docx"
                  allowMultiple={false}
                />
                {hasDocxFile && (
                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleNextStep}>
                      下一步：进入文件分析
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        );
      case StageType.TENDER_ANALYSIS:
        return (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  招标文件结构
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  系统已分析招标文件结构，您可以查看详细的章节内容。
                </p>
                {/* 这里可以添加招标文件结构的展示组件 */}
                <div className="text-sm text-gray-500">
                  招标文件结构展示组件将在这里显示
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnalysisTasksCard tasks={phase.tasks} formatDate={formatDate} />
            </div>
          </>
        );
      // 可以继续添加其他阶段的特定组件
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 渲染阶段特定组件 */}
      {renderPhaseSpecificComponents()}
    </div>
  )
}
