import { useState, useEffect } from 'react'
import { useProjects } from '@/hooks/useProjects'
import { useToast } from '@/hooks/use-toast'
import { Project } from '@/types/projects_dt_stru'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Edit2, Save, X } from 'lucide-react'

interface ProjectDetailProps {
  projectId: string
  onClose: () => void
}

// ====================== 项目详情 组件 ===========================
export function ProjectDetail({ projectId }: ProjectDetailProps) {

  const { toast } = useToast()
  const { singleProjectQuery, updateProject } = useProjects()


  const { data: project, isLoading, error } = singleProjectQuery(Number(projectId))

  const [isEditing, setIsEditing] = useState(false)
  
  const [editedProject, setEditedProject] = useState<Project | undefined>(undefined)


  // 监听项目数据变化，如果项目数据有变化，则更新编辑项目数据
  // 处理project的非手动更新，数据发生变化时自动触发：
  // 场景例如：初次加载，切换到不同项目，后端数据更新
  useEffect(() => {
    if (project) {
      setEditedProject({
        // 这里的project是新加载的项目数据 （这里不能使用prev，我们可能是切换到新项目）
        // prev适合部分更新的场景，而这里是完全重置。 
        ...project,  
        // 当project.stageHistories为undefined，设置为空数组；如果后端确定返回非undefined，则可不用这样代码
        stageHistories: project.stageHistories || []
      })
    }
  }, [project])


  // 编辑的 切换 功能， 用来处理手动编辑。 
  // 下面渲染的场景：用户点击编辑按钮，用户取消编辑按钮；  保存调用的时handleSave
  const handleEditToggle = () => {
    if (isEditing && project) {
      setEditedProject({
        // 无论是点击编辑，还是取消编辑，editedProject都重置为project （API返回的project数据）
        ...project,
        // 当project.stageHistories为undefined 设置[]避免报错。  可以默认成不需要。 
        stageHistories: project.stageHistories || []
      })
    }
    setIsEditing(!isEditing)
  }

  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditedProject(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value
      }
    })
  }

  const handleSave = async () => {
    if (!editedProject) return

    try {
      await updateProject({
        projectId: Number(projectId),
        projectData: editedProject
      })
      toast({
        title: "更新成功",
        description: "项目信息已更新"
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "更新失败",
        description: "保存项目信息时出错",
        variant: "destructive"
      })
    }
  }
  
  
  
  // ----------------- 渲染 组件 ---------------------

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>
  if (!project) return <div>项目不存在</div>


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">项目详情</h2>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} variant="default">
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
              <Button onClick={handleEditToggle} variant="ghost">
                <X className="mr-2 h-4 w-4" />
                取消
              </Button>
            </>
          ) : (
            <Button onClick={handleEditToggle}>
              <Edit2 className="mr-2 h-4 w-4" />
              编辑
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)] px-1">
        <div className="grid gap-4">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>项目的基本信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 项目名称 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold">项目名称</label>
                  {isEditing ? (
                    <Input
                      value={editedProject?.projectName}
                      onChange={(e) => handleFieldChange('projectName', e.target.value)}
                    />
                  ) : (
                    <p>{project.projectName}</p>
                  )}
                </div>
                
                {/* 项目类型 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold">项目类型</label>
                  {isEditing ? (
                    <Select
                      value={editedProject?.projectType}
                      onValueChange={(value) => handleFieldChange('projectType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WELFARE">企业福利</SelectItem>
                        <SelectItem value="FSD">食材配送</SelectItem>
                        <SelectItem value="OTHER">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p>{project.projectType}</p>
                  )}
                </div>

                {/* 其他只读字段 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold">项目编号</label>
                  <p>{project.projectCode}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">当前阶段</label>
                  <p>{project.currentStage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 项目历史卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>项目历史</CardTitle>
              <CardDescription>项目状态变更记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.stageHistories?.map((history) => (
                  <div key={history.historyId} className="border-b pb-2">
                    <p className="font-medium">
                      {history.fromStage} → {history.toStage}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(history.operationTime).toLocaleString()}
                    </p>
                    {history.remarks && (
                      <p className="text-sm mt-1">{history.remarks}</p>
                    )}
                  </div>
                ))}
                {(!project.stageHistories || project.stageHistories.length === 0) && (
                  <p className="text-sm text-gray-500">暂无历史记录</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}