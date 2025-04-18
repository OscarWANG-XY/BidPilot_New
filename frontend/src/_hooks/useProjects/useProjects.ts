import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  // 引用react-query的钩子函数
import { projectsApi} from '@/_api/projects_api/projects_api';   // 引用项目API模块
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectStatusRequest,
  UpdateProjectActiveStageRequest,
  ProjectQueryParams,
  ProjectsSidebarItem,
} from '@/_types/projects_dt_stru/projects_interface';


// ================================ Projects的Query HOOKs函数  ============================================ 
// useProjects 是自定义的HOOKS，用来返回与项目相关的数据 和 操作函数。



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

  // --------------- 查询侧边栏项目列表 --------------- 
  const sidebarProjectsQuery = () => useQuery({
    queryKey: ['sidebarProjectsKey'],
    queryFn: async () => {
      console.log('🔍 [useProjects] 查询侧边栏项目列表');
      const result = await projectsApi.getAllProjects();
      
      // 转换为侧边栏所需的数据格式
      const sidebarItems: ProjectsSidebarItem[] = result.map(project => ({
        name: project.projectName,
        url: `/projects/${project.id}`,
        status: project.status,
        created: new Date(project.createTime).toLocaleDateString(),
        starred: project.starred || false  // 确保starred始终有值，与nav-projects.tsx中的期望一致
      }));
      
      console.log('📥 [useProjects] 侧边栏项目列表:', sidebarItems);
      return sidebarItems;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,  // 1分钟后数据变为陈旧
    gcTime: 5 * 60 * 1000, // 5分钟后清除缓存
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

  // --------------- 查询项目招标文件提取信息 --------------- 
  const projectTenderFileExtractionQuery = (projectId: string) => useQuery({
    queryKey: ['projectTenderFileExtraction', projectId],
    queryFn: async () => {
      console.log('🔍 [useProjects] 查询项目招标文件提取信息, id:', projectId);
      const result = await projectsApi.getTenderFileExtraction(projectId);
      console.log('📥 [useProjects] 查询项目招标文件提取信息:', result);
      return result;
    },
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,  // 1分钟后数据变为陈旧
    gcTime: 5 * 60 * 1000, // 5分钟后清除缓存
  });

  // --------------- 更新项目招标文件提取信息 --------------- 
  const updateProjectTenderFileExtraction = useMutation({
    mutationFn: async ({ projectId, extractionData }: { projectId: string; extractionData: any }) => {
      console.log('📤 [useProjects] 更新项目招标文件提取信息:', { projectId, extractionData });
      const result = await projectsApi.updateTenderFileExtraction(projectId, extractionData);
      console.log('✅ [useProjects] 更新项目招标文件提取信息成功:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      console.log('🔄 [useProjects] 更新项目招标文件提取信息后, 更新缓存数据:', variables.projectId);
      queryClient.invalidateQueries({ queryKey: ['projectTenderFileExtraction', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['SingleProjectKey', variables.projectId] });
    }
  });

  // --------------- 手动刷新项目招标文件提取信息缓存 --------------- 
  const refreshTenderFileExtraction = (projectId: string) => {
    console.log('🔄 [useProjects] 手动刷新项目招标文件提取信息缓存:', projectId);
    return queryClient.invalidateQueries({ 
      queryKey: ['projectTenderFileExtraction', projectId] 
    });
  };

  return useMemo(() => ({
    // 使用useMemo避免在值没有变的情况下触发组件的不必要更新。 
    // .mutate() 本身不返回promise对象, 如果需要返回promise对象，则需要使用.mutateAsync()
    // 这里建议使用.mutateAsync() 更符合现代JavaScript的异步编程风格。 
    // 这样的好处是：调用者可以选择是否等待操作完成，可再调用处使用try/catch来处理错误; 可获取到操作返回的数据
    // 关于项目的CURD
    projectsQuery,  
    sidebarProjectsQuery,
    singleProjectQuery,
    createProject: createProject.mutateAsync,  
    updateProject: updateProject.mutateAsync, 
    updateProjectActiveStage: updateProjectActiveStage.mutateAsync,
    updateProjectStatus: updateProjectStatus.mutateAsync,  
    deleteProject: deleteProject.mutateAsync,

    // 招标文件提取信息相关
    projectTenderFileExtractionQuery,
    updateProjectTenderFileExtraction: updateProjectTenderFileExtraction.mutateAsync,
    refreshTenderFileExtraction,
  }), [
    projectsQuery,
    sidebarProjectsQuery,
    singleProjectQuery,
    createProject.mutateAsync,
    updateProject.mutateAsync,
    updateProjectActiveStage.mutateAsync,
    updateProjectStatus.mutateAsync,
    deleteProject.mutateAsync,
    projectTenderFileExtractionQuery,
    updateProjectTenderFileExtraction.mutateAsync,
    refreshTenderFileExtraction
  ]);
};
