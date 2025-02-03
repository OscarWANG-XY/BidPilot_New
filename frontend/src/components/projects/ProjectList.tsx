import { Project } from '@/types/projects_dt_stru'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"   // ui表格组件
import { Button } from "@/components/ui/button"  // ui按钮组件
import { Eye, Trash2 } from "lucide-react"  // 图标
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProjectListProps {
  projects: Project[]
  isLoading: boolean
  error: Error | null
  onViewDetail: (projectId: string) => void
  onDeleteProject: (projectId: string) => Promise<void>
}
// ================================== 项目列表组件  ================================== 
export function ProjectList({ 
  projects, 
  isLoading, 
  error, 
  onViewDetail,
  onDeleteProject 
}: ProjectListProps) {


  // ---------------------------- 组件渲染 ----------------------------
  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>

  return (
    <Table>
    {/* -------表头 ------- */}
      <TableHeader>
        <TableRow>
          <TableHead>项目名称</TableHead>
          <TableHead>项目类型</TableHead>
          <TableHead>招标单位</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>当前阶段</TableHead>
          <TableHead>查看/编辑</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>

      {/* -------表体 ------- */}
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.projectId}>
            {/* -- 项目名称 -- */}
            <TableCell>{project.projectName}</TableCell>
            {/* -- 项目类型 -- */}
            <TableCell>{project.projectType}</TableCell>
            {/* -- 招标单位 -- */}
            <TableCell>{project.tenderee}</TableCell>
            {/* -- 创建时间 -- */}
            <TableCell>{new Date(project.createTime).toLocaleDateString()}</TableCell>
            {/* -- 当前阶段 -- */}
            <TableCell>{project.currentStage}</TableCell>
            {/* -- 查看/编辑 -- */}
            <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetail(project.projectId.toString())}
                >
                  <Eye className="h-4 w-4" />
                </Button>
            </TableCell>
            {/* -- 删除 -- */}
            <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除项目 "{project.projectName}" 吗？此操作不可撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDeleteProject(project.projectId.toString() )}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  )
}
