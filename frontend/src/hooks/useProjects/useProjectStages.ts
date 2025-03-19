import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';  // 引用react-query的钩子函数
import { projectStageApi } from '@/api/projects_api/projectStages_api';
import type { 
  StageType,
  AllTask,
  TaskType,
  TaskStatus,
  TaskLockStatus,
  TaskMetaData,
} from '@/types/projects_dt_stru';


// ================================ Projects的Query HOOKs函数  ============================================ 
// useProjects 是自定义的HOOKS，用来返回与项目相关的数据 和 操作函数。



export const useProjectStages = () => {

  // 获取react-query的客户端实例，用于管理和操作缓存数据， 上传成功时会用到
  // 缓存数据是 queryClient.data
  const queryClient = useQueryClient();

//====================== ProjectStage 相关的 查询 和 操作  =====================

    // --------------- 查询项目阶段详情 (包含任务) --------------- 
    const projectStageQuery = (projectId: string, stageType: StageType) => useQuery({
      queryKey: ['projectStage', projectId, stageType],
      queryFn: async () => {
        console.log('🔍 [useProjects] 查询项目阶段详情:', { projectId, stageType });
        const result = await projectStageApi.getProjectStage(projectId, stageType);
        console.log('📥 [useProjects] 查询项目阶段详情成功:', result);
        return result;
      },
      refetchOnWindowFocus: false,  // 窗口获得焦点时不重新获取
      staleTime: 30 * 1000,         // 30秒后数据变为陈旧
      gcTime: 5 * 60 * 1000,        // 5分钟后清除缓存
    });

    // --------------- 查询项目阶段任务状态 --------------- 
    const projectStageTaskMetaDataQuery = (projectId: string, stageType: StageType) => useQuery({
      queryKey: ['projectStageTaskMetaData', projectId, stageType],
      queryFn: async () => {
        console.log('🔍 [useProjects] 查询项目阶段任务状态:', { projectId, stageType });
        const stageData = await projectStageApi.getProjectStage(projectId, stageType);
        
        // 提取所有任务的状态信息，对齐BaseTask接口
        const taskMetaData: TaskMetaData[] = stageData.tasks?.map((task: AllTask) => ({
          id: task.id,
          name: task.name,
          description: task.description,
          type: task.type,
          status: task.status,
          lockStatus: task.lockStatus,
        })) || [];
        console.log('📥 [useProjects] 查询项目阶段任务状态成功:', taskMetaData);
        return taskMetaData;
      },
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      // 只有当projectId和stageType都存在时才启用查询
      enabled: Boolean(projectId) && Boolean(stageType),
    });

    // --------------更新任务状态
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
    

  
  return {
    // 关于项目阶段的UR，没有CD
    projectStageQuery,  
    projectStageTaskMetaDataQuery,  
    updateStageTaskStatus: updateStageTaskStatus.mutateAsync,

    

  };
};
