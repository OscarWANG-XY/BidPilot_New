import React from 'react'
import { Link } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PhaseIndicator } from './PhaseIndicator'
import { PhaseDetailView } from './PhaseDetailView'
import { PhaseNavigationView } from './PhaseNavigationView'
import { mockData } from './mockData'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ProjectStage, ProjectStatus } from '../../../types/projects_dt_stru'
import { TaskStatus, PhaseStatus } from './types'

interface ProjectPhaseViewProps {
  projectId: string
  phaseId: string
  viewMode: 'navigation' | 'detail'
  currentProjectStage: ProjectStage
  projectStatus: ProjectStatus
  phaseStatus?: PhaseStatus
}

export const ProjectPhaseView: React.FC<ProjectPhaseViewProps> = ({ 
  projectId, 
  phaseId, 
  viewMode,
  currentProjectStage,
  projectStatus,
  phaseStatus
}) => {
  // 获取当前阶段数据
  const currentPhase = mockData.find(phase => phase.id === phaseId)
  
  // 如果找不到指定阶段，显示错误信息并提供返回项目概览的链接
  if (!currentPhase) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>
            找不到指定的项目阶段。
            <Link
              to="/projects/$id"
              params={{ id: projectId }}
              className="ml-2 underline"
            >
              返回项目概览
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  // 确定阶段状态
  const currentStageIndex = Object.values(ProjectStage).indexOf(currentProjectStage);
  const phaseStageIndex = Object.values(ProjectStage).indexOf(currentPhase.stage);
  
  // 使用PhaseStatus来确定阶段状态
  const isCompleted = phaseStatus === PhaseStatus.COMPLETED;
  const isInProgress = phaseStatus === PhaseStatus.IN_PROGRESS;
  const isBlocked = phaseStatus === PhaseStatus.BLOCKED;
  const isNotStarted = phaseStatus === PhaseStatus.NOT_STARTED;
  
  // 如果是未开始的阶段，显示提示信息
  if (isNotStarted && phaseStageIndex > currentStageIndex) {
    return (
      <div className="space-y-6">
        <PhaseIndicator 
          phases={mockData}
          currentPhaseId={phaseId}
          projectId={projectId}
          currentProjectStage={currentProjectStage}
          projectStatus={projectStatus}
        />
        
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>阶段未开始</AlertTitle>
          <AlertDescription>
            该项目阶段尚未开始。当项目进展到此阶段时，您将能够查看详细信息。
            <Link
              to="/projects/$id"
              params={{ id: projectId }}
              className="ml-2 underline"
            >
              返回项目概览
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  // 如果阶段被阻塞，显示阻塞信息
  if (isBlocked) {
    return (
      <div className="space-y-6">
        <PhaseIndicator 
          phases={mockData}
          currentPhaseId={phaseId}
          projectId={projectId}
          currentProjectStage={currentProjectStage}
          projectStatus={projectStatus}
        />
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>阶段已阻塞</AlertTitle>
          <AlertDescription>
            该项目阶段当前被阻塞，可能正在等待外部反馈或其他依赖项。
            <Link
              to="/projects/$id"
              params={{ id: projectId }}
              className="ml-2 underline"
            >
              返回项目概览
            </Link>
          </AlertDescription>
        </Alert>
        
        {/* 显示阻塞的阶段详情 */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">阻塞详情</h3>
          <p className="text-sm text-muted-foreground">{currentPhase.remarks || "无阻塞原因记录"}</p>
        </div>
      </div>
    )
  }
  
  // 计算阶段任务完成情况
  const completedTasks = currentPhase.tasks.filter(
    task => task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CONFIRMED
  ).length
  const pendingTasks = currentPhase.tasks.filter(
    task => task.status === TaskStatus.PENDING
  ).length
  const blockedTasks = currentPhase.tasks.filter(
    task => task.status === TaskStatus.BLOCKED
  ).length
  const totalTasks = currentPhase.tasks.length
  const progressPercentage = currentPhase.progress || (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0)
  
  // 如果项目已取消，显示取消状态
  if (projectStatus === ProjectStatus.CANCELLED) {
    return (
      <div className="space-y-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">项目已取消！</strong>
          <span className="block sm:inline"> 该项目已被取消，无法继续进行。</span>
        </div>
        
        {/* 阶段指示器 - 灰显所有阶段 */}
        <PhaseIndicator 
          phases={mockData}
          currentPhaseId={phaseId}
          projectId={projectId}
          currentProjectStage={currentProjectStage}
          projectStatus={projectStatus}
        />
        
        {/* 取消信息 */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-2">取消信息</h3>
          <p className="text-sm text-muted-foreground">取消原因: 客户需求变更</p>
          <p className="text-sm text-muted-foreground">取消时间: 2023-10-15</p>
          <Link
            to="/projects"
            className="mt-2 inline-block text-sm text-primary underline"
          >
            返回项目列表
          </Link>
        </div>
      </div>
    );
  }
  
  // 如果项目已完成，显示完成状态
  if (projectStatus === ProjectStatus.COMPLETED) {
    return (
      <div className="space-y-6">
        <PhaseIndicator 
          phases={mockData}
          currentPhaseId={phaseId}
          projectId={projectId}
          currentProjectStage={currentProjectStage}
          projectStatus={projectStatus}
        />
        
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>项目已完成</AlertTitle>
          <AlertDescription>
            该项目已成功完成所有阶段。您可以查看各阶段详情和最终文档。
          </AlertDescription>
        </Alert>
        
        {/* 阶段进度概览 */}
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-medium">{currentPhase.name}</h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">已完成</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{currentPhase.description}</p>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
            </div>
            <span className="text-sm font-medium">100%</span>
          </div>
          <div className="text-sm mt-1">
            完成任务: {totalTasks}/{totalTasks}
          </div>
        </div>
        
        {/* 视图模式切换 */}
        <Tabs value={viewMode} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="navigation" asChild>
              <Link
                to="/projects/$id/phases/$phaseId/$viewMode"
                params={{ id: projectId, phaseId: phaseId, viewMode: 'navigation' }}
                className="w-full"
              >
                导航视图
              </Link>
            </TabsTrigger>
            <TabsTrigger value="detail" asChild>
              <Link
                to="/projects/$id/phases/$phaseId/$viewMode"
                params={{ id: projectId, phaseId: phaseId, viewMode: 'detail' }}
                className="w-full"
              >
                详情视图
              </Link>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="navigation">
            <PhaseNavigationView phase={currentPhase} />
          </TabsContent>
          
          <TabsContent value="detail">
            <PhaseDetailView phase={currentPhase} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* 阶段指示器 */}
      <PhaseIndicator 
        phases={mockData}
        currentPhaseId={phaseId}
        projectId={projectId}
        currentProjectStage={currentProjectStage}
        projectStatus={projectStatus}
      />
      
      {/* 阶段进度概览 */}
      <div className={`p-4 rounded-lg ${
        isCompleted ? 'bg-green-50 border border-green-200' : 
        isInProgress ? 'bg-amber-50 border border-amber-200' : 
        isBlocked ? 'bg-red-50 border border-red-200' :
        'bg-muted'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-medium">{currentPhase.name}</h3>
          {isCompleted && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">已完成</span>}
          {isInProgress && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">进行中</span>}
          {isBlocked && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">已阻塞</span>}
          {isNotStarted && <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">未开始</span>}
        </div>
        <p className="text-sm text-muted-foreground mb-2">{currentPhase.description}</p>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                isCompleted ? 'bg-green-500' : 
                isInProgress ? 'bg-primary' : 
                isBlocked ? 'bg-red-500' :
                'bg-gray-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{progressPercentage}%</span>
        </div>
        <div className="text-sm mt-1">
          完成任务: {completedTasks}/{totalTasks}
          {blockedTasks > 0 && <span className="ml-2 text-red-600">阻塞任务: {blockedTasks}</span>}
          {pendingTasks > 0 && <span className="ml-2 text-amber-600">待处理任务: {pendingTasks}</span>}
        </div>
        {currentPhase.startDate && currentPhase.endDate && (
          <div className="text-xs text-muted-foreground mt-2">
            计划时间: {currentPhase.startDate} 至 {currentPhase.endDate}
          </div>
        )}
      </div>
      
      {/* 视图模式切换 */}
      <Tabs value={viewMode} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="navigation" asChild>
            <Link
              to="/projects/$id/phases/$phaseId/$viewMode"
              params={{ id: projectId, phaseId: phaseId, viewMode: 'navigation' }}
              className="w-full"
            >
              导航视图
            </Link>
          </TabsTrigger>
          <TabsTrigger value="detail" asChild>
            <Link
              to="/projects/$id/phases/$phaseId/$viewMode"
              params={{ id: projectId, phaseId: phaseId, viewMode: 'detail' }}
              className="w-full"
            >
              详情视图
            </Link>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="navigation">
          <PhaseNavigationView phase={currentPhase} />
        </TabsContent>
        
        <TabsContent value="detail">
          <PhaseDetailView phase={currentPhase} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
