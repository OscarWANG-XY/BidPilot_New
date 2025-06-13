import { Project } from '@/_types/projects_dt_stru/projects_interface'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"   // ui表格组件
import { Button } from "@/components/ui/button"  // ui按钮组件
import { Eye, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"  // 图标
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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/_hooks/use-toast"
import { useProjects } from "@/_hooks/useProjects/useProjects"
import { ProjectStatus } from "@/_types/projects_dt_stru/projects_interface"

interface ProjectListProps {
  projects: Project[]
  isLoading: boolean
  error: Error | null
  onViewDetail: (projectId: string) => void
  onDeleteProject: (projectId: string) => Promise<void>
  onSort: (field: string, direction: 'asc' | 'desc') => void
  currentSort: string
}
// ================================== 项目列表组件  ================================== 
export function ProjectList({ 
  projects, 
  isLoading, 
  error, 
  onViewDetail,
  onDeleteProject,
  onSort,
  currentSort 
}: ProjectListProps) {

  const { updateProjectStatus } = useProjects()
  const { toast } = useToast()

  // 处理排序点击
  const handleSortClick = (field: string) => {
    const isCurrentField = currentSort === field || currentSort === `-${field}`
    const isDescending = currentSort === `-${field}`
    
    if (isCurrentField) {
      // 如果已经是降序，切换到升序；如果是升序，切换到降序
      onSort(field, isDescending ? 'asc' : 'desc')
    } else {
      // 默认新的排序字段从降序开始
      onSort(field, 'desc')
    }
  }

  // 获取排序状态
  const getSortDirection = (field: string) => {
    if (currentSort === field) return 'asc'
    if (currentSort === `-${field}`) return 'desc'
    return null
  }

  // 渲染排序图标
  const renderSortIcon = (field: string) => {
    const direction = getSortDirection(field)
    if (!direction) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const handleCancelProject = async (projectId: string) => {
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

  // ---------------------------- 组件渲染 ----------------------------
  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>

  return (
    <Table>
      {/* -------表头 ------- */}
      <TableHeader className="bg-gray-50/50">
        <TableRow>
          <TableHead>
            <Button 
              variant="ghost" 
              onClick={() => handleSortClick('projectName')}
              className="flex items-center hover:bg-gray-100"
            >
              项目名称
              {renderSortIcon('projectName')}
            </Button>
          </TableHead>
          <TableHead>
            <Button 
              variant="ghost" 
              onClick={() => handleSortClick('projectType')}
              className="flex items-center hover:bg-gray-100"
            >
              项目类型
              {renderSortIcon('projectType')}
            </Button>
          </TableHead>
          <TableHead>
            <Button 
              variant="ghost" 
              onClick={() => handleSortClick('tenderee')}
              className="flex items-center hover:bg-gray-100"
            >
              招标单位
              {renderSortIcon('tenderee')}
            </Button>
          </TableHead>
          <TableHead>
            <Button 
              variant="ghost" 
              onClick={() => handleSortClick('createTime')}
              className="flex items-center hover:bg-gray-100"
            >
              创建时间
              {renderSortIcon('createTime')}
            </Button>
          </TableHead>
          <TableHead>
            <Button 
              variant="ghost" 
              onClick={() => handleSortClick('status')}
              className="flex items-center hover:bg-gray-100"
            >
              项目状态
              {renderSortIcon('status')}
            </Button>
          </TableHead>
          <TableHead>
            <Button 
              variant="ghost" 
              onClick={() => handleSortClick('currentStage')}
              className="flex items-center hover:bg-gray-100"
            >
              当前阶段
              {renderSortIcon('currentStage')}
            </Button>
          </TableHead>
          <TableHead>查看/编辑</TableHead>
          <TableHead className="text-right">归档</TableHead>          
          <TableHead className="text-right">删除</TableHead>
        </TableRow>
      </TableHeader>

      {/* -------表体 ------- */}
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} className="hover:bg-gray-50">
            <TableCell className="font-medium">{project.projectName}</TableCell>
            <TableCell>{project.projectType}</TableCell>
            <TableCell>{project.tenderee}</TableCell>
            <TableCell>
              {new Date(project.createTime).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Badge 
                variant={project.status === "IN_PROGRESS" ? "default" : 
                        project.status === "COMPLETED" ? "secondary" : 
                        project.status === "CANCELLED" ? "destructive" : "outline"}
                className={`capitalize ${
                  project.status === "COMPLETED" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                  project.status === "CANCELLED" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""
                }`}
              >
                {project.status || "未知"}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {project.currentActiveStage}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewDetail(project.id)}
                className="hover:bg-gray-100"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TableCell>            
            {/* 归档 */}
            <TableCell className="text-right">  
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="shadow-sm">
                    {/* 
                      - variant="destructive"：危险操作按钮（红色）
                      - size="sm"：小尺寸
                      - shadow-sm：浅阴影
                    */}
                    取消项目
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-0 shadow-lg">
                  {/*
                    - border-0：移除边框
                    - shadow-lg：较大的阴影，增强弹窗层次
                  */}
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认取消项目</AlertDialogTitle>
                    <AlertDialogDescription>
                      取消项目后，所有相关工作将停止。此操作不可逆，确定要继续吗？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="shadow-sm">返回</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleCancelProject(project.id)} className="shadow-sm">
                      确认取消
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>              
            </TableCell>                

            {/* 删除 */}
            <TableCell className="text-right">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 text-destructive" />
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
                      onClick={() => onDeleteProject(project.id)}
                      className="bg-destructive hover:bg-destructive/90"
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
  );
}
