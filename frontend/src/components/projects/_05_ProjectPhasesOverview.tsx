import React from 'react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { mockCompleteProjectData } from './mockData'
import { PhaseStatus, ProjectPhase } from './types'
import { ProjectStage } from '@/types/projects_dt_stru'

interface ProjectOverviewProps {
  projectId: string
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projectId }) => {
  // 在实际应用中，你可能需要根据 projectId 获取项目信息
  //const project = mockCompleteProjectData.project;
  const phases = mockCompleteProjectData.phases;
  
  // 确保显示所有五个阶段，使用与mockData一致的ID格式
  const allPhaseIds = ["phase-0", "phase-1", "phase-2", "phase-3", "phase-4"]; // 修改为与mockData一致的ID格式
  const allPhaseNames = ["项目初始化", "招标文件分析", "投标文件撰写", "投标文件修订", "投标文件生产"]; // 阶段名称
  
  // 定义每个阶段对应的ProjectStage枚举值
  const allPhaseStages = [
    ProjectStage.INITIALIZATION,
    ProjectStage.TENDER_ANALYSIS,
    ProjectStage.BID_WRITING,
    ProjectStage.BID_REVISION,
    ProjectStage.BID_PRODUCTION
  ];
  
  // 创建一个包含所有五个阶段的数组，如果mockData中没有某个阶段，则使用默认值
  const completePhases = allPhaseIds.map((id, index) => {
    const existingPhase = phases.find(p => p.id === id);
    if (existingPhase) return existingPhase;
    
    // 如果没有找到对应阶段，返回默认值，包含所有必需的属性
    return {
      id,
      name: allPhaseNames[index],
      description: "暂无描述",
      status: PhaseStatus.NOT_STARTED,
      progress: 0,
      stage: allPhaseStages[index], // 使用对应的ProjectStage枚举值
      tasks: [] // 添加空的tasks数组
    } as ProjectPhase;
  });
  
  return (
    <div className="space-y-6">
      {/*由于projectLayout已经有标题，这里就不再添加了，把以下注释掉*/}
      {/*
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{projectName}</h2>
      </div>
      */}

      <div className="p-6 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium mb-4">项目阶段</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/*遍历phases渲染的项目阶段*/}
          {completePhases.map((phase: ProjectPhase) => (
            <div key={phase.id} className="border rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{phase.name}</h4>

                {/*用不同颜色，渲染不同的phaseStatus的状态*/}
                <div className={`px-2 py-1 rounded-full text-xs ${
                  phase.status === PhaseStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                  phase.status === PhaseStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                  phase.status === PhaseStatus.BLOCKED ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {phase.status === PhaseStatus.COMPLETED ? '已完成' :
                   phase.status === PhaseStatus.IN_PROGRESS ? '进行中' :
                   phase.status === PhaseStatus.BLOCKED ? '阻塞中' :
                   '待开始'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{phase.description}</p>
              
              {phase.progress !== undefined && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>进度</span>
                    <span>{phase.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${phase.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <Link
                to="/projects/$id/phases/$phaseId/$viewMode"
                // 到具体的phase查看详细信息是，传递了 projectId, phaseid, 还有模式。
                params={{
                  id: projectId,
                  phaseId: phase.id,
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