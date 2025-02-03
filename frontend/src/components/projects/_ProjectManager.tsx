import { useState } from 'react'
import { useProjects } from '@/hooks/useProjects'      // 项目Hook
import { useToast } from '@/hooks/use-toast'           // Hook
import { CreateProjectDialog } from './ProjectCreate'   // 自定义"创建项目"组件
import { ProjectFilter } from './ProjectFilter'  //自定义 项目查询 组件
import { ProjectList } from './ProjectList'      //自定义 项目列表 组件
import { ProjectDetail } from './ProjectDetail'  //自定义 项目详情 组件
import { ProjectQueryParams } from '@/types/projects_dt_stru' 
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

// ===================================== 项目管理器 ==================================== 
export function ProjectManager() {

  // 查询参数状态
  const [queryParams, setQueryParams] = useState<ProjectQueryParams>({
    ordering: '-create_time' // 默认按创建时间倒序
  });

  // Hooks 功能引用
  const { toast } = useToast();
  const { 
    projectsQuery,
    //singleProjectQuery,
    //projectHistoryQuery,
    //createProject,
    //updateProject,
    //updateProjectStage,
    deleteProject 
  } = useProjects();

  // 使用 projectsQuery 函数获取查询结果
  const { data: projects, isLoading, error } = projectsQuery(queryParams);

  // 控制项目详情弹窗的状态
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  // --------------- 处理项目新建  -------------------------
  // handleSubmit() 在ProjectCreate.tsx组件中， _ProjectManager.tsx里无处理  


  // 处理查询参数变更
  const handleQueryChange = (newParams: Partial<ProjectQueryParams>) => {
    setQueryParams(prev => ({
      ...prev,
      ...newParams
    }));
  };

  // 处理排序变更
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    const ordering = direction === 'desc' ? `-${field}` : field;
    handleQueryChange({ ordering });
  };




  // --------------- 处理项目详情查看的回调函数  -------------------------
  // ProjectList的回调函数，用来设置selectedProjectId， 给项目详情弹窗使用。
  const handleViewDetail = (projectId: number) => {
    setSelectedProjectId(projectId)
  }

  // ProjectDetail的回调函数, 关闭详情弹窗， 设置selectedProjectId为null
  const handleCloseDetail = () => {
    setSelectedProjectId(null)
  }

  // --------------- 处理删除项目  -------------------------
  const handleDeleteProject = async (projectId: number) => {

    // 调用useProjects里的deleteProject方法删除项目, 输入项目ID
    await deleteProject(projectId,{
      onSuccess: () => {
        toast({
          title: '项目删除成功',
        })
      },
      onError: (error:any) => {
        toast({
          title: '项目删除失败',
          description: error?.response?.data?.message || error.message || "请稍后重试",
          variant: "destructive",
        })
      },
    })
  }


  // ------------------------------ 组件渲染 -----------------------------
  return (
    <div className="container mx-auto p-4">

      <CreateProjectDialog />

      {/* 查询过滤器组件 */}
      <ProjectFilter 
        queryParams={queryParams}
        onQueryChange={handleQueryChange}
      />

      <ProjectList
        // 使用useProjects里的项目数据projects传给ProjectList组件 
        projects={projects || []}
        // 使用useProjects里的isLoading传给ProjectList组件 
        isLoading={isLoading}
        // 使用useProjects里的error传给ProjectList组件, 为了向用户展示数据提取的错误信息 
        error={error as Error}
        // 回调项目详情的状态逻辑函数, 为了给到ProjectList组件里的“详情”按钮使用以激活。 
        onViewDetail={handleViewDetail} 
        // 回调项目删除的逻辑函数, 用来删除项目， 为了给到ProjectList组件里的“删除”按钮使用。
        onDeleteProject={handleDeleteProject}

        onSort = {handleSortChange}

        currentSort = {queryParams.ordering}
      />

      {/* 项目详情弹窗 */}
      <Dialog open={selectedProjectId !== null} onOpenChange={handleCloseDetail}>
        <DialogContent className="max-w-4xl">
          {selectedProjectId && (
            <ProjectDetail
              // 传入选中查看详情的项目Id作为参数
              projectId={selectedProjectId}
              // 回调函数 重置seletedProjectId 为 null
              onClose={handleCloseDetail}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
