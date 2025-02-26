import React from 'react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { mockData } from './mockData'
import { PhaseStatus, ProjectPhase } from './types'

interface ProjectOverviewProps {
  projectId: string
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projectId }) => {
  // 在实际应用中，你可能需要根据 projectId 获取项目信息
  
  // const projectName = `项目 #${projectId}`  
  
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
          {/*遍历mockData渲染的项目阶段*/}
          {mockData.map((phase: ProjectPhase) => (
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