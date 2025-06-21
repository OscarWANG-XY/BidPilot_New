import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  // 引用react-query的钩子函数
import { projectsApi} from '@/_api/projects_api';   // 引用项目API模块
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectStatusRequest,
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
        id: project.id,
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
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

//====================== 招标文件相关的查询和操作 =====================


//====================== 项目基本操作 =====================

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
      queryClient.invalidateQueries({ queryKey: ['sidebarProjectsKey'] });
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
      queryClient.invalidateQueries({ queryKey: ['sidebarProjectsKey'] });
    }
  });


    // --------------- 查询招标文件信息 ---------------
    const tenderFileQuery = (projectId: string, fileExists: boolean) => useQuery({
      queryKey: ['tenderFileKey', projectId],
      queryFn: async () => {
        console.log('🔍 [useProjects] 查询招标文件信息, projectId:', projectId);
        const result = await projectsApi.getTenderFile(projectId);
        console.log('📥 [useProjects] 查询招标文件信息:', result);
        return result;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,  // 5分钟后数据变为陈旧（文件信息相对稳定）
      gcTime: 10 * 60 * 1000,    // 10分钟后清除缓存
      enabled: fileExists,       // 只在有 projectId 时启用查询
    });


    // --------------- 检查招标文件是否存在 ---------------
    const checkTenderFileExistQuery = (projectId: string, field: string = 'tender_file') => useQuery({
      queryKey: ['checkTenderFileExist', projectId, field],
      queryFn: async () => {
        console.log('🔍 [useProjects] 检查招标文件是否存在:', { projectId, field });
        const result = await projectsApi.checkTenderFileExist(projectId, field);
        console.log('📥 [useProjects] 检查招标文件是否存在:', result);
        return result;
      },
      enabled: !!projectId,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30秒内认为数据是新鲜的
      gcTime: 5 * 60 * 1000, // 5分钟后清除缓存
    });


    // --------------- 下载招标文件 ---------------
    const downloadTenderFile = useMutation({
      mutationFn: async ({ projectId, fileName }: { projectId: string; fileName: string }) => {
        console.log('📤 [useProjects] 下载招标文件:', { projectId, fileName });
        const downloadUrl = await projectsApi.downloadTenderFile(projectId, fileName);
        
        try {
          // 参考 DocxPreview.tsx 的处理方式，先用 fetch 获取文件数据
          console.log('🔄 [useProjects] 正在获取文件数据...');
          const response = await fetch(downloadUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // 将响应转换为 Blob 对象，确保正确的二进制数据处理
          const blob = await response.blob();
          
          // 创建 Object URL
          const objectUrl = URL.createObjectURL(blob);
          
          // 创建下载链接
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = fileName;
          
          // 触发下载
          document.body.appendChild(link);
          link.click();
          
          // 清理
          document.body.removeChild(link);
          URL.revokeObjectURL(objectUrl); // 释放 Object URL 内存
          
          console.log('✅ [useProjects] 文件下载完成:', fileName);
          return { success: true, fileName, url: downloadUrl };
          
        } catch (error) {
          console.error('❌ [useProjects] 下载过程中出错:', error);
          throw new Error(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      },
      onError: (error) => {
        console.error('❌ [useProjects] 下载招标文件失败:', error);
      }
    });
  
    // --------------- 上传招标文件 ---------------
    const uploadTenderFile = useMutation({
      mutationFn: async ({ projectId, file }: { projectId: string; file: File }) => {
        console.log('📤 [useProjects] 上传招标文件:', { projectId, fileName: file.name, fileSize: file.size });
        const result = await projectsApi.uploadTenderFile(projectId, file);
        console.log('✅ [useProjects] 上传招标文件成功:', result);
        return result;
      },
      onSuccess: (_, variables) => {
        console.log('🔄 [useProjects] 上传招标文件后, 更新缓存数据:', variables.projectId);
        // 更新项目相关的缓存
        queryClient.invalidateQueries({ queryKey: ['checkTenderFileExist', variables.projectId, 'tender_file'] });
        queryClient.invalidateQueries({ queryKey: ['tenderFileKey', variables.projectId] });
      },
      onError: (error) => {
        console.error('❌ [useProjects] 上传招标文件失败:', error);
      }
    });
  
    // --------------- 删除招标文件 ---------------
    const deleteTenderFile = useMutation({
      mutationFn: async (projectId: string) => {
        console.log('🗑️ [useProjects] 删除招标文件:', projectId);
        const result = await projectsApi.deleteTenderFile(projectId);
        console.log('✅ [useProjects] 删除招标文件成功:', projectId);
        return result;
      },
      onSuccess: (_, projectId) => {
        console.log('🔄 [useProjects] 删除招标文件后, 更新缓存数据:', projectId);
        // 更新项目相关的缓存
        queryClient.invalidateQueries({ queryKey: ['checkTenderFileExist', projectId, 'tender_file'] });
        queryClient.invalidateQueries({ queryKey: ['tenderFileKey', projectId] });
      },
      onError: (error) => {
        console.error('❌ [useProjects] 删除招标文件失败:', error);
      }
    });


    // 修改 refreshFileExistQuery 函数，让它同时清除相关的缓存
    const refreshFileExistQuery = (projectId: string, field: string = 'tender_file') => {
      queryClient.invalidateQueries({ queryKey: ['checkTenderFileExist', projectId, field] });
      queryClient.invalidateQueries({ queryKey: ['tenderFileKey', projectId] }); // 同时清除文件查询缓存
    };

    const refreshTenderFileQuery = (projectId: string) => {
      queryClient.invalidateQueries({ queryKey: ['tenderFileKey', projectId] });
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
    updateProjectStatus: updateProjectStatus.mutateAsync,  
    deleteProject: deleteProject.mutateAsync,

    // 关于招标文件的操作
    tenderFileQuery,
    uploadTenderFile: uploadTenderFile.mutateAsync,
    deleteTenderFile: deleteTenderFile.mutateAsync,
    downloadTenderFile: downloadTenderFile.mutateAsync,
    checkTenderFileExist: checkTenderFileExistQuery,

    refreshTenderFile: refreshTenderFileQuery,
    refreshFileExist: refreshFileExistQuery,

  }), [
    projectsQuery,
    sidebarProjectsQuery,
    singleProjectQuery,
    createProject.mutateAsync,
    updateProject.mutateAsync,
    updateProjectStatus.mutateAsync,
    deleteProject.mutateAsync,
    tenderFileQuery,
    uploadTenderFile.mutateAsync,
    deleteTenderFile.mutateAsync,
    downloadTenderFile.mutateAsync,
    checkTenderFileExistQuery,
    refreshTenderFileQuery,
    refreshFileExistQuery,
  ]);
};
