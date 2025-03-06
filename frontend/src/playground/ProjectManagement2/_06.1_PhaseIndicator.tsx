import React from 'react'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { PhaseStatus, ProjectPhase } from '../../types/projects_stages_dt_stru'
import { StageType, ProjectStatus } from '../../types/projects_dt_stru'

interface PhaseIndicatorProps {
  phases: ProjectPhase[]
  currentPhaseId: string
  projectId: string
  currentProjectStage: StageType
  projectStatus: ProjectStatus
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ 
  phases, 
  currentPhaseId,
  projectId,
  currentProjectStage,
  projectStatus
}) => {
  // 获取当前阶段在阶段流程中的索引
  const currentStageIndex = Object.values(StageType).indexOf(currentProjectStage);
  const isProjectCancelled = projectStatus === ProjectStatus.CANCELLED;
  const isProjectCompleted = projectStatus === ProjectStatus.COMPLETED;
  
  return (
    <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
      {phases.map((phase, index) => {
        // 确定阶段状态
        const phaseStageIndex = Object.values(StageType).indexOf(phase.stage);
        
        // 根据项目状态和阶段确定显示样式
        let isCompleted = false;
        let isCurrent = false;
        let isUpcoming = false;
        let isBlocked = phase.status === PhaseStatus.BLOCKED;
        
        if (isProjectCancelled) {
          // 如果项目已取消，所有阶段显示为灰色
          isCompleted = false;
          isCurrent = false;
          isUpcoming = true;
          isBlocked = false;
        } else if (isProjectCompleted) {
          // 如果项目已完成，所有阶段显示为已完成
          isCompleted = true;
          isCurrent = false;
          isUpcoming = false;
          isBlocked = false;
        } else {
          // 正常进行中的项目
          isCompleted = phaseStageIndex < currentStageIndex || phase.status === PhaseStatus.COMPLETED;
          isCurrent = phase.stage === currentProjectStage && phase.status === PhaseStatus.IN_PROGRESS;
          isUpcoming = phaseStageIndex > currentStageIndex || phase.status === PhaseStatus.NOT_STARTED;
        }
        
        return (
          <React.Fragment key={phase.id}>
            <Link 
              to="/projects/$id/phases/$phaseId/$viewMode"
              params={{ 
                id: projectId, 
                phaseId: phase.id, 
                viewMode: 'navigation' 
              }}
              className={`flex flex-col items-center ${
                isProjectCancelled ? 'text-gray-400 cursor-not-allowed' :
                phase.id === currentPhaseId ? 'text-blue-600 font-medium' : 
                isCompleted ? 'text-green-600' : 
                isCurrent ? 'text-amber-600' :
                isBlocked ? 'text-red-600' :
                'text-gray-400'
              }`}
              aria-disabled={isUpcoming || isProjectCancelled}
              onClick={(isUpcoming || isProjectCancelled) ? (e) => e.preventDefault() : undefined}
            >
              <div className={`rounded-full w-8 h-8 flex items-center justify-center mb-1 ${
                isProjectCancelled ? 'bg-gray-100 border-2 border-gray-400' :
                phase.id === currentPhaseId ? 'bg-blue-100 border-2 border-blue-600' : 
                isCompleted ? 'bg-green-100 border-2 border-green-600' : 
                isCurrent ? 'bg-amber-100 border-2 border-amber-600' :
                isBlocked ? 'bg-red-100 border-2 border-red-600' :
                'bg-gray-100 border-2 border-gray-400'
              }`}>
                {isCompleted && !isProjectCancelled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : isCurrent && !isProjectCancelled ? (
                  <Clock className="h-5 w-5 text-amber-600" />
                ) : isBlocked && !isProjectCancelled ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-xs whitespace-nowrap">{phase.name}</span>
            </Link>
            {index < phases.length - 1 && (
              <div className={`w-16 h-px mt-4 ${
                isProjectCancelled ? 'bg-gray-300' :
                index < phases.findIndex(p => p.stage === currentProjectStage) ? 'bg-green-600' : 
                isBlocked ? 'bg-red-300' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  )
}
