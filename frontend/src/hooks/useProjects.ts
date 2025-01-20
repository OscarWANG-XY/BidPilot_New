import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  // 引用react-query的钩子函数
import { projectsApi } from '@/api/projects_api';   // 引用项目API模块
import type { 
  // ProjectBasicInfo类型: id, name, code, tenderee, bidder, projectType, industry, expectedBudget, createTime, updateTime, deadline
  // Project类型(extended on ProjectBasicInfo): status, currentPhase, phases, progress, attachment?, lastModifiedBy, createBy, remarks? 
  Project, 

  // CreateProjectRequest类型: name, code, tenderee, bidder, projectType, industry, expectedBudget, deadline, remarks?
  CreateProjectRequest, 

  // UpdateProjectStatusRequest类型: projectId, status, remarks?
  UpdateProjectStatusRequest, 

  // UpdateProjectPhaseRequest类型: projectId, phaseId, status, assignee?, remarks?
  UpdateProjectPhaseRequest 
} from '@/types/projects_dt_stru';


// ================================ Projects的Query HOOKs函数  ============================================ 
// useProjects 是自定义的HOOKS，用来返回与项目相关的数据 和 操作函数。
export const useProjects = () => {

  // 获取react-query的客户端实例，用于管理和操作缓存数据， 上传成功时会用到
  // 缓存数据是 queryClient.data
  const queryClient = useQueryClient();


  // --------------- 查询所有项目 （这是一个变量）--------------- 
  const projectsQuery = useQuery({
    // 缓存的唯一标识符，在useQuery被初始化时配置。 
    queryKey: ['projectsKey'],
    // 查询函数，返回所有项目，然后放进缓存。
    // 直到缓存数据被判定过期，否则新的API请求不会被触发，而是直接调用缓存数据。
    queryFn: projectsApi.getAllProjects
  });


  // --------------- 查询单个项目 （这是一个函数）--------------- 
  const singleProjectQuery = (id: string) => useQuery({
    queryKey: ['SingleProjectKey', id],
    queryFn: () => projectsApi.getProjectById(id)
  });


  // --------------- 创建项目 done check--------------- 
  const createProject = useMutation({

    // 上传新的项目， 新项目作为参数是CreateProjectRequest类型
    mutationFn: (newProject: CreateProjectRequest) => 
      //当上传成功时，projectApi.createProject 返回一个Promise解析，解析包含项目的详细信息。 
      projectsApi.createProject(newProject),

    // 当上传成功时， 更新缓存数据，这个缓存数据的key是['projectsKey']， 更新时，它激活了useQuery的queryFn函数, 从服务器中获取最新数据 
    // 请注意，缓存数据没有保存之前的缓存数据，和useFiles不同。 
    // 这个是基于项目创建并非高频动作，用户对即时性要求低一些。 
    // 而useFiles是高频动作，用户对即时性要求高一些。缓存里保存了之前的缓存数据，UI就能立即显示上传文件，避免用户感知延迟。
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
      // 这个环节，通常不需要更新单个项目查询的缓存数据
    }
  });

  // --------------- 更新项目 done check!--------------- 
  const updateProject = useMutation({

    // 更新项目的函数接收两个输入参数： 项目ID 和 项目信息（Partial<Project>）
    // 参数直接传导给projectsApi.updateProject()进行处理
    mutationFn: ({ project_id, project_data }: { project_id: string; project_data: Partial<Project> }) =>
      projectsApi.updateProject(project_id, project_data),

    // 更新成功时， 更新缓存数据
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
      queryClient.invalidateQueries({ queryKey: ['SingleProjectKey', variables.project_id] });
    }
  });

  // 更新项目状态
  const updateProjectStatus = useMutation({
    mutationFn: (request: UpdateProjectStatusRequest) =>
      projectsApi.updateProjectStatus(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
      queryClient.invalidateQueries({ queryKey: ['SingleProjectKey', variables.projectId] });
    }
  });

  // 更新项目阶段
  const updateProjectPhase = useMutation({
    mutationFn: (request: UpdateProjectPhaseRequest) =>
      projectsApi.updateProjectPhase(request),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
      queryClient.invalidateQueries({ queryKey: ['SingleProjectKey', variables.projectId] });
    }
  });

  // 删除项目
  const deleteProject = useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectsKey'] });
    }
  });

  return {
    // 查询相关 分别是基于projectQuery变量 和 singleProjectQuery()的函数 的使用。
    projects: projectsQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    error: projectsQuery.error,
    singleProjectQuery, // 这是一个函数; 使用实例：singleProjectQuery("id").data; 

    // 操作相关
    // .mutate() 本身不返回promise对象, 如果需要返回promise对象，则需要使用.mutateAsync()
    // 这里建议使用.mutateAsync() 更符合现代JavaScript的异步编程风格。 
    // 这样的好处是：调用者可以选择是否等待操作完成，可再调用处使用try/catch来处理错误; 可获取到操作返回的数据
    createProject: createProject.mutateAsync,  // 需要等待返回的项目ID来进行导航
    updateProject: updateProject.mutateAsync,  // 可能需要等待更新完成后执行其他操作
    updateProjectStatus: updateProjectStatus.mutateAsync,  // 可能需要等待删除完成后执行其他操作
    updateProjectPhase: updateProjectPhase.mutateAsync,
    deleteProject: deleteProject.mutateAsync
  };
};
