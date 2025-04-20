import { useMemo} from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  // 引用react-query的钩子函数
import { projectStageApi} from '@/_api/projects_api/projectStages_api';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import { TaskType, TaskStatus, TaskLockStatus} from '@/_types/projects_dt_stru/projectTasks_interface';


// ================================ Projects的Query HOOKs函数  ============================================ 
// useProjects 是自定义的HOOKS，用来返回与项目相关的数据 和 操作函数。



export const useProjectStages = (
  projectId: string,
  stageType: StageType
) => {

  // 获取react-query的客户端实例，用于管理和操作缓存数据， 上传成功时会用到
  // 缓存数据是 queryClient.data
  const queryClient = useQueryClient();

//====================== ProjectStage 相关的 查询 和 操作  =====================

    // --------------- 查询项目阶段详情 (包含TaskList) --------------- 
    const projectStageQuery =  useQuery({
      queryKey: ['projectStage', projectId, stageType],
      queryFn: async () => {
        try{
          console.log('🔍 [useProjects] 查询项目阶段详情:', { projectId, stageType });
          const result = await projectStageApi.getProjectStage(projectId, stageType);
          console.log('📥 [useProjects] 查询项目阶段详情成功:', result);
          return result;
        }catch(error){
          console.error('项目阶段详情查询出错', error)
          throw error;
        }
      },

      refetchOnWindowFocus: false,  // 窗口获得焦点时不重新获取
      staleTime: 30 * 1000,         // 30秒后数据变为陈旧
      gcTime: 5 * 60 * 1000,        // 5分钟后清除缓存
    });

    // --------------更新任务状态  (注意，这个钩子目前不在使用， 对应后端的接口也没有使用)  -----------
    const updateStageTaskStatus = useMutation({
      mutationFn: async ({ 
        projectId, 
        stageType, 
        taskType, 
        newStatus,
        newLockStatus
      }: { 
        projectId: string; 
        stageType: StageType; 
        taskType: TaskType;
        newStatus: TaskStatus;
        newLockStatus: TaskLockStatus
      }) => {
        console.log('📤 [useProjects] 更新任务状态:', { projectId, stageType, taskType, newStatus });
        
      // 修改为更简洁的请求格式，只发送单个任务类型
      const result = await projectStageApi.updateProjectStage(projectId, stageType, {
        task_type: taskType,
        task_status: newStatus,
        lock_status: newLockStatus
      });
        
        console.log('✅ [useProjects] 更新任务状态成功:', result);
        return result;
      },
      onSuccess: (_, variables) => {
        console.log('🔄 [useProjects] 更新任务状态后，更新缓存数据');
        
        // 使无效相关查询，触发重新获取数据
        queryClient.invalidateQueries({ 
          queryKey: ['projectStageTaskStatuses', variables.projectId, variables.stageType] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['projectStage', variables.projectId, variables.stageType] 
        });
      }
    });
    

  
  // --------------手动刷新项目阶段数据---------------
  const refreshProjectStage = () => {
    console.log('🔄 [useProjects] 手动刷新项目阶段数据:', { projectId, stageType });
    queryClient.invalidateQueries({ 
      queryKey: ['projectStage', projectId, stageType] 
    });
  };
  
  
  return useMemo(() => ({
    // 关于项目阶段的UR，没有CD
    stageData: projectStageQuery.data,  
    isLoading: projectStageQuery.isLoading,
    isError: projectStageQuery.isError,
    Error: projectStageQuery.error,
    updateStageTaskStatus: updateStageTaskStatus.mutateAsync,
    refreshProjectStage, // 添加手动刷新函数
  }), [
    projectStageQuery.data,  
    projectStageQuery.isLoading,
    projectStageQuery.isError,
    projectStageQuery.error,
    updateStageTaskStatus.mutateAsync,
    refreshProjectStage, // 添加到依赖数组
  ]);
};
