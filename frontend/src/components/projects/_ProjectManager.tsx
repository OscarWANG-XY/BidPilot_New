import { useState } from 'react'
import { useProjects } from '@/hooks/useProjects'      // 项目Hook
import { useToast } from '@/hooks/use-toast'           // Hook
import { CreateProjectDialog } from './ProjectCreate'   // 自定义"创建项目"组件
import { ProjectFilter } from './ProjectFilter'  //自定义 项目查询 组件
import { ProjectList } from './ProjectList'      //自定义 项目列表 组件
//import { ProjectDetail } from './ProjectDetail'  //自定义 项目详情 组件
import { ProjectQueryParams } from '@/types/projects_dt_stru' 
import { useNavigate } from '@tanstack/react-router'  // 修改为 TanStack Router 的导入

// ===================================== 项目管理器 ==================================== 
export function ProjectManager() {
  const navigate = useNavigate();  // TanStack Router 的 useNavigate

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


  // 处理查询参数变更
  const handleQueryChange = (newParams: Partial<ProjectQueryParams>) => {
    setQueryParams(prev => {
      const updated = {
        ...prev,
        ...newParams
      };
      console.log('[ProjectManager] 更新查询参数:', updated);  // 添加日志
      return updated;
    });
  };


  // 处理排序变更
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    // 获取当前排序字段和方向
    const currentField = queryParams.ordering?.replace('-', '') || 'create_time';
    const currentDirection = queryParams.ordering?.startsWith('-') ? 'desc' : 'asc';
    
    console.log('🔍 [ProjectManager] 排序变更 - 输入参数:', { field, direction });
    console.log('🔍 [ProjectManager] 当前排序状态:', { 
      currentField, 
      currentDirection,
      rawOrdering: queryParams.ordering 
    });

    // 如果点击的是同一个字段，切换排序方向
    if (field === currentField) {
      console.log('🔄 [ProjectManager] 切换同一字段的排序方向');
      const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      const ordering = newDirection === 'desc' ? `-${field}` : field;
      console.log('📝 [ProjectManager] 新的排序设置:', { 
        newDirection, 
        ordering,
        logic: '同字段切换方向' 
      });
      handleQueryChange({ ordering });
    } else {
      console.log('↗️ [ProjectManager] 切换到新的排序字段');
      // 如果是新字段，使用指定的方向
      const ordering = direction === 'desc' ? `-${field}` : field;
      console.log('📝 [ProjectManager] 新的排序设置:', { 
        direction, 
        ordering,
        logic: '新字段排序' 
      });
      handleQueryChange({ ordering });
    }
  };



  // --------------- 处理项目详情查看的回调函数  -------------------------
  // ProjectList的回调函数，用来设置selectedProjectId， 给项目详情弹窗使用。
  const handleViewDetail = (id: number) => {
    navigate({
      to: '/projects/$id',
      params: { id: String(id) }
    });
  }


  // --------------- 处理删除项目  -------------------------
  const handleDeleteProject = async (projectId: number) => {
    // 添加参数验证
    if (!projectId || typeof projectId !== 'number') {
      toast({
        title: '删除失败',
        description: '无效的项目ID',
        variant: "destructive",
      });
      return;
    }

    console.log('[ProjectManager] 删除项目:', projectId); // 添加日志
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
        // 回调项目详情的状态逻辑函数, 为了给到ProjectList组件里的"详情"按钮使用以激活。 
        onViewDetail={handleViewDetail} 
        // 回调项目删除的逻辑函数, 用来删除项目， 为了给到ProjectList组件里的"删除"按钮使用。
        onDeleteProject={handleDeleteProject}

        onSort = {handleSortChange}

        currentSort = {queryParams.ordering || '-create_time'} // 默认按创建时间倒序
      />

    </div>
  )
}
