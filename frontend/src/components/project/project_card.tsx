import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjectStore } from "@/stores/projectStore"
import { Badge } from "@/components/ui/badge"

export function ProjectCard() {
  const { activeProject } = useProjectStore()

  if (!activeProject) return null

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">
            {activeProject.name}
          </CardTitle>
          <Badge variant={activeProject.status === '进行中' ? "default" : "secondary"}>
            {activeProject.status === '进行中' ? '进行中' : 
             activeProject.status === '已完成' ? '已完成' : '未开始'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">项目编号</p>
            <p className="font-medium">{activeProject.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">招标单位</p>
            <p className="font-medium">{activeProject.companyName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">项目类型</p>
            <p className="font-medium">{activeProject.type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">创建时间</p>
            <p className="font-medium">{new Date(activeProject.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">最后更新</p>
            <p className="font-medium">{new Date(activeProject.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}