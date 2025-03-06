import React from 'react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { StageType, ProjectStatus, StageStatus } from '@/types/projects_dt_stru'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useProjects } from '@/hooks/useProjects'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface ProjectOverviewProps {
  projectId: string
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projectId }) => {

  console.log("ProjectOverview组件渲染")

  const { projectOverviewQuery, updateProjectStatus } = useProjects();
  const { toast } = useToast();
  
  // 使用 projectOverviewQuery 获取项目阶段概览数据
  const { data: projectOverview, isLoading, isError, error } = projectOverviewQuery(projectId);
  
  console.log("projectOverviewQuery返回的数据和状态", projectOverview, isLoading, isError, error)

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return <LoadingOverview />;
  }
  
  // 如果加载出错，显示错误信息
  if (isError) {
    return (
      <div className="p-6 border rounded-lg bg-red-50 text-red-800">
        <h3 className="text-lg font-medium mb-2">加载项目阶段信息失败</h3>
        <p>{error instanceof Error ? error.message : '未知错误'}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          重新加载
        </Button>
      </div>
    );
  }
  
  const { project, stages } = projectOverview || { project: undefined, stages: [] };
  const projectStatus = project?.status || ProjectStatus.IN_PROGRESS;
  
  // 确保显示所有五个阶段
  const allStageTypes = [
    StageType.INITIALIZATION,
    StageType.TENDER_ANALYSIS,
    StageType.BID_WRITING,
    StageType.BID_REVISION,
    StageType.BID_PRODUCTION
  ];
  
  const allStageNames = ["项目初始化", "招标文件分析", "投标文件撰写", "投标文件修订", "投标文件生产"];
  
  // 创建一个包含所有五个阶段的数组，如果API返回中没有某个阶段，则使用默认值
  const completeStages = allStageTypes.map((stageType, index) => {
    const existingStage = stages.find((s: { stage: StageType }) => s.stage === stageType);
    if (existingStage) return existingStage;
    
    // 如果没有找到对应阶段，返回默认值
    return {
      id: `default-${stageType}`,
      name: allStageNames[index],
      description: "暂无描述",
      status: StageStatus.NOT_STARTED,
      progress: 0,
      stage: stageType,
      tasks: []
    };
  });
  
  // 处理项目取消
  const handleCancelProject = async () => {
    try {
      await updateProjectStatus({
        id: projectId,
        status: ProjectStatus.CANCELLED,
        remarks: "用户手动取消项目"
      });
      
      toast({
        title: "项目已取消",
        description: "项目状态已更新为已取消",
      });
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error?.response?.data?.message || error.message || "取消项目时出错",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">项目阶段</h3>
          
          {/* 添加项目操作按钮区域 */}
          <div className="flex gap-2">
            {projectStatus === ProjectStatus.IN_PROGRESS && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    取消项目
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认取消项目</AlertDialogTitle>
                    <AlertDialogDescription>
                      取消项目后，所有相关工作将停止。此操作不可逆，确定要继续吗？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>返回</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelProject}>
                      确认取消
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {projectStatus === ProjectStatus.CANCELLED && (
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                项目已取消
              </div>
            )}
            
            {projectStatus === ProjectStatus.COMPLETED && (
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                项目已完成
              </div>
            )}
          </div>
        </div>
        
        {/* 显示项目状态提示（如果已取消） */}
        {projectStatus === ProjectStatus.CANCELLED && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            此项目已被取消，所有相关工作已停止。
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completeStages.map((stage) => (
            <div key={stage.id} className="border rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{stage.name}</h4>

                {/*用不同颜色，渲染不同的phaseStatus的状态*/}
                <div className={`px-2 py-1 rounded-full text-xs ${
                  stage.status === StageStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                  stage.status === StageStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                  stage.status === StageStatus.BLOCKED ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {stage.status === StageStatus.COMPLETED ? '已完成' :
                   stage.status === StageStatus.IN_PROGRESS ? '进行中' :
                   stage.status === StageStatus.BLOCKED ? '阻塞中' :
                   '待开始'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{stage.description}</p>
              
              {stage.progress !== undefined && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>进度</span>
                    <span>{stage.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${stage.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <Link
                to="/projects/$id/phases/$phaseId/$viewMode"
                params={{
                  id: projectId,
                  phaseId: stage.id,
                  viewMode: 'navigation'
                }}
                className="block w-full"
              >
                <Button variant="outline" className="w-full">
                  查看详情
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 加载状态组件
const LoadingOverview = () => (
  <div className="space-y-6">
    <div className="p-6 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
); 