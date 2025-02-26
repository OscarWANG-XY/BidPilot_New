import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProjectLayoutProps {
  projectId: string
  children: React.ReactNode  // 宽泛的类型定义，可以是React组件或HTML元素，或string, 或null, 或boolean, 等等
}

// React.FC 是 React Function Component
export const ProjectLayout: React.FC<ProjectLayoutProps> = ({ projectId, children }) => {
  
  // 根据projectId生成项目名称
  const projectName = `项目 #${projectId}`
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{projectName}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 在父组件即project$id路由里，ProjectLayout 包裹的内容会被放到children的位置*/}  
          {children}   
        </CardContent>
      </Card>
    </div>
  )
}
