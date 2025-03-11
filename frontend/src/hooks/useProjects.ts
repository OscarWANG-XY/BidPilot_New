import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  // 引用react-query的钩子函数
import { projectsApi } from '@/api/projects_api';   // 引用项目API模块
import type { 
  ProjectType,
  StageType,
  Project, 
  CreateProjectRequest, 
  UpdateProjectStatusRequest,
  UpdateProjectActiveStageRequest,
  AllTask
} from '@/types/projects_dt_stru';


// ================================ Projects的Query HOOKs函数  ============================================ 
// useProjects 是自定义的HOOKS，用来返回与项目相关的数据 和 操作函数。

// 添加查询参数接口
interface ProjectQueryParams {
  current_stage?: StageType;
  project_type?: ProjectType;
  is_urgent?: boolean;
  search?: string;
  ordering?: string;
}

export const useProjects = () => {

  // 获取react-query的客户端实例，用于管理和操作缓存数据， 上传成功时会用到
  // 缓存数据是 queryClient.data
  const queryClient = useQueryClient();



//====================== Projects 相关的 查询 和 操作  =====================

  // --------------- 查询所有项目 （支持过滤、搜索和排序）--------------- 
  const projectsQuery = (params?: ProjectQueryParams) => useQuery({
    queryKey: ['projectsKey', params],
    queryFn: async () => {
      console.log('🔍 [useProjects] 查询所有项目:', params);
      const result = await projectsApi.getAllProjects(params);
      console.log('📥 [useProjects] 查询所有项目:', result);
      return result;
    },
    refetchOnWindowFocus: false,  // 窗口获得焦点时不重新获取
    staleTime: 0,                 // 数据立即变为陈旧
    gcTime: 5 * 60 * 1000,      // 5分钟后清除缓存
    // 添加 enabled 配置，只在非详情页面时启用查询
    enabled: !window.location.pathname.includes('/projects/') || 
             window.location.pathname === '/projects',
  });


  // --------------- 查询单个项目 （这是一个函数）--------------- 
  const singleProjectQuery = (projectId: string) => useQuery({
    queryKey: ['SingleProjectKey', projectId],
    queryFn: async () => {
      console.log('🔍 [useProjects] 查询单个项目, id:', projectId);
      const result = await projectsApi.getProjectById(projectId);
      console.log('📥 [useProjects] 查询单个项目:', result);
      return result;
    }
  });


  // --------------- 添加项目历史记录查询 （这是一个函数）--------------- 
  const projectHistoryQuery = (projectId: string) => useQuery({
    queryKey: ['projectHistory', projectId],
    queryFn: async () => {
      console.log('🔍 [useProjects] 查询项目历史, id:', projectId);
      const result = await projectsApi.getProjectHistory(projectId);
      console.log('📥 [useProjects] 查询项目历史:', result);
      return result;
    }
  });


  // --------------- 创建项目 done check--------------- 
  const createProject = useMutation({
    // 当上传成功时， 更新缓存数据，这个缓存数据的key是['projectsKey']， 更新时，它激活了useQuery的queryFn函数, 从服务器中获取最新数据 
    // 请注意，缓存数据没有保存之前的缓存数据，和useFiles不同。 
    // 这个是基于项目创建并非高频动作，用户对即时性要求低一些。 
    // 而useFiles是高频动作，用户对即时性要求高一些。缓存里保存了之前的缓存数据，UI就能立即显示上传文件，避免用户感知延迟。
    mutationFn: async (newProject: CreateProjectRequest) => {
      console.log('📤 [useProjects] 创建新项目:', newProject);
      const result = await projectsApi.createProject(newProject);
      console.log('✅ [useProjects] 创建新项目成功:', result);
      return result;
    },
    onSuccess: () => {
      console.log('🔄 [useProjects] 创建新项目后, 更新缓存数据');
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
      // 这个环节，通常不需要更新单个项目查询的缓存数据
    }
  });

  // --------------- 更新项目 done check!--------------- 
  const updateProject = useMutation({
    mutationFn: async ({ projectId, projectData }: { projectId: string; projectData: Partial<Project> }) => {
      console.log('📤 [useProjects] 更新项目:', { projectId, projectData });
      const result = await projectsApi.updateProject(projectId, projectData);
      console.log('✅ [useProjects] 更新项目成功:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      console.log('🔄 [useProjects] 更新项目后, 更新缓存数据:', variables.projectId);
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
      queryClient.invalidateQueries({ queryKey: ['SingleProjectKey', variables.projectId] });
    }
  });


  // 更新项目阶段
  const updateProjectActiveStage = useMutation({
    mutationFn: async (request: UpdateProjectActiveStageRequest) => {
      console.log('📤 [useProjects] 更新项目阶段:', request);
      const result = await projectsApi.updateProjectActiveStage(request);
      console.log('✅ [useProjects] 更新项目阶段成功:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      console.log('🔄 [useProjects] 更新项目阶段后, 更新缓存数据:', variables.id);
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
      queryClient.invalidateQueries({ queryKey: ['SingleProjectKey', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projectHistory', variables.id] });
    }
  });

  // 修改项目状态更新函数，使用 UpdateProjectStatusRequest 类型
  const updateProjectStatus = useMutation({
    mutationFn: async (request: UpdateProjectStatusRequest) => {
      console.log('📤 [useProjects] 更新项目状态:', request);
      const result = await projectsApi.updateProjectStatus(request);
      console.log('✅ [useProjects] 更新项目状态成功:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      console.log('🔄 [useProjects] 更新项目状态后, 更新缓存数据:', variables.id);
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
      queryClient.invalidateQueries({ queryKey: ['SingleProjectKey', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projectHistory', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['projectOverview', variables.id] });
    }
  });

  // 删除项目
  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      console.log('🗑️ [useProjects] 删除项目:', projectId);
      const result = await projectsApi.deleteProject(projectId);
      console.log('✅ [useProjects] 删除项目成功:', projectId);
      return result;
    },
    onSuccess: () => {
      console.log('🔄 [useProjects] 删除项目后, 更新缓存数据');
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
    }
  });



//====================== ProjectStage 相关的 查询 和 操作  =====================

    // --------------- 查询项目阶段详情 (包含任务) --------------- 
    const projectStageQuery = (projectId: string, stageType: StageType) => useQuery({
      queryKey: ['projectStage', projectId, stageType],
      queryFn: async () => {
        console.log('🔍 [useProjects] 查询项目阶段详情:', { projectId, stageType });
        const result = await projectsApi.getProjectStage(projectId, stageType);
        console.log('📥 [useProjects] 查询项目阶段详情成功:', result);
        return result;
      },
      refetchOnWindowFocus: false,  // 窗口获得焦点时不重新获取
      staleTime: 30 * 1000,         // 30秒后数据变为陈旧
      gcTime: 5 * 60 * 1000,        // 5分钟后清除缓存
    });

    // --------------- 查询项目阶段任务状态 --------------- 
    const projectStageTaskStatusesQuery = (projectId: string, stageType: StageType) => useQuery({
      queryKey: ['projectStageTaskStatuses', projectId, stageType],
      queryFn: async () => {
        console.log('🔍 [useProjects] 查询项目阶段任务状态:', { projectId, stageType });
        const stageData = await projectsApi.getProjectStage(projectId, stageType);
        
        // 提取所有任务的状态信息，对齐BaseTask接口
        const taskStatuses = stageData.tasks?.map((task: AllTask) => ({
          id: task.id,
          name: task.name,
          description: task.description,
          type: task.type,
          status: task.status,
        })) || [];
        console.log('📥 [useProjects] 查询项目阶段任务状态成功:', taskStatuses);
        return taskStatuses;
      },
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      // 只有当projectId和stageType都存在时才启用查询
      enabled: Boolean(projectId) && Boolean(stageType),
    });


    



  
  return {
    // 查询相关 分别是基于projectQuery变量 和 singleProjectQuery()的函数 的使用。
    projectsQuery,  // 现在是一个函数，接受查询参数
    singleProjectQuery,
    projectHistoryQuery,
    projectStageQuery,  // 添加项目阶段查询
    projectStageTaskStatusesQuery,  // 添加项目阶段任务状态查询

    // 操作相关
    // .mutate() 本身不返回promise对象, 如果需要返回promise对象，则需要使用.mutateAsync()
    // 这里建议使用.mutateAsync() 更符合现代JavaScript的异步编程风格。 
    // 这样的好处是：调用者可以选择是否等待操作完成，可再调用处使用try/catch来处理错误; 可获取到操作返回的数据
    createProject: createProject.mutateAsync,  // 需要等待返回的项目ID来进行导航
    updateProject: updateProject.mutateAsync,  // 可能需要等待更新完成后执行其他操作
    updateProjectActiveStage: updateProjectActiveStage.mutateAsync,
    updateProjectStatus: updateProjectStatus.mutateAsync,  // 添加项目状态更新函数
    deleteProject: deleteProject.mutateAsync,
  };
};
