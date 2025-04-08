import React, { useState, useEffect } from 'react';
import { useTasks } from './hook&APIs.tsx/useTasks';
import { useStream } from './hook&APIs.tsx/useStreaming';
import { TaskStatus } from './hook&APIs.tsx/tasksApi';
import type { StageType } from '@/types/projects_dt_stru/projectStage_interface';
import { useUnsavedChangesWarning } from './hook&APIs.tsx/useUnsavedChangeWarning';

// 引入状态特定组件
import ConfigurationPanel from './ConfigurationPanel/ConfigurationPanel';
import AnalysisPanel from './AnalysisPanel/AnalysisPanel';
import ReviewPanel from './tempPanelsforTest/ReviewPanel';
import ResultEditorPanel from './tempPanelsforTest/ResultEditorPanel';
import CompletionPanel from './tempPanelsforTest/CompletionPanel';
import ConfigurationPreview from './tempPanelsforTest/ConfigurationPreview';
// 引入共享组件
import StatusBar from './shared/StatusBar';


interface TaskContainerProps {
  projectId: string;
  stageType: StageType;
  onComplete?: () => void; // 可选回调，当任务完成时通知父组件
}

const TaskContainer: React.FC<TaskContainerProps> = ({
  projectId,
  stageType,
  onComplete
}) => {
  // 使用自定义hook获取任务数据和操作方法
    const {
        useTaskData,
        startAnalysis,
        terminateAnalysis,
        acceptResult,
        saveEditedResult,
        resetTask,
        loadConfig,
        saveConfig,
        isUpdating
    } = useTasks();

    // 获取任务数据
    const { data: task, isLoading, isError, error } = useTaskData(projectId, stageType);

    // Add streaming hook for ANALYZING state
    const {
        streamId,
        streamContent,
        isStreaming,
        streamError,
        streamComplete,
        streamStatus,
        streamResult,
        startStream,
        stopStreaming,
        isStartingStream,   // 正在启动分析
    } = useStream(projectId, stageType);



    //  --------   UI状态管理 (引入本地存储) -------- 
    // 结果编辑状态
    const [isEditingResult, setIsEditingResult] = useState<boolean>(() => {
        const saved = localStorage.getItem('isEditingResult');
        return saved === 'true';
    });
    const [editingResult, setEditingResult] = useState<string>(() => {
        return localStorage.getItem('editingResult') || '';
    });
    // 配置编辑状态
    const [isEditingConfig, setIsEditingConfig] = useState<boolean>(() => {
        const saved = localStorage.getItem('isEditingConfig');
        return saved === 'true';
    });
    const [editingContext, setEditingContext] = useState<string>(() => {
        return localStorage.getItem('editingContext') || '';
    });
    const [editingPrompt, setEditingPrompt] = useState<string>(() => {
        return localStorage.getItem('editingPrompt') || '';
    });
    const [editingCompanyInfo, setEditingCompanyInfo] = useState<any>(() => {
        const saved = localStorage.getItem('editingCompanyInfo');
        return saved ? JSON.parse(saved) : null;
    });


    // 使用自定义Hook来处理未保存更改的提醒
    useUnsavedChangesWarning(isEditingResult || isEditingConfig, '您有未保存的编辑内容，确定要离开吗？');


    // ------------ 处理 CONFIGURING 状态 ------------
    // 加载模板配置 （目前在useTasks.ts中，通过失效缓存触发重新查询。 未来待拓展）
    const handleLoadConfig = async () => {
        await loadConfig(projectId, stageType);
          
    };

    // 开始编辑配置
    const handleStartConfigEditing = () => {
        // 当任务进入编辑模式时，会从当前任务中复制初始值 
        if (task) {
            const context = task.context || '';
            const prompt = task.prompt || '';
            const companyInfo = task.companyInfo || null;
            
            setEditingContext(context);
            setEditingPrompt(prompt);
            setEditingCompanyInfo(companyInfo);
            setIsEditingConfig(true);
            
            localStorage.setItem('editingContext', context);
            localStorage.setItem('editingPrompt', prompt);
            localStorage.setItem('editingCompanyInfo', companyInfo ? JSON.stringify(companyInfo) : '');
            localStorage.setItem('isEditingConfig', 'true');
        }
    };

    // 取消配置编辑
    const handleCancelConfigEditing = () => {
        // 取消编辑时，当编辑未保存，恢复到编辑前的原始值； 但编辑已保存，现实编辑保存后的最新值。 
        if (task) {
            setEditingContext(task.context || '');
            setEditingPrompt(task.prompt || '');
            setEditingCompanyInfo(task.companyInfo || null);
            }
            setIsEditingConfig(false);
            localStorage.setItem('isEditingConfig', 'false');
    };

    // 保存配置
    const handleSaveConfig = async (context: string, prompt: string, companyInfo: any) => {
        await saveConfig(projectId, stageType, context, prompt, companyInfo);
        
            // 由于上面保存配置后，取消编辑的重置，会使用最新的配置内容 （在useTasks.ts中，向后端保存数据后，会手动invalidate缓存，导致重新获取任务数据，以保持最新状态）
        if (isEditingConfig) {
            handleCancelConfigEditing(); // 保存成功后退出编辑模式
            localStorage.removeItem('editingContext');
            localStorage.removeItem('editingPrompt');
            localStorage.removeItem('editingCompanyInfo');
        }
    };

    // 开始分析
    const handleStartAnalysis = async () => {
        await startAnalysis(projectId, stageType);
        // Start streaming after analysis begins
        if (projectId && stageType) {
            try {
                await startStream();
            } catch (error) {
                console.error('Failed to start streaming:', error);
            }
        }
    };

// ---------------------------- 处理 ANALYZING 状态 -------------------
    // 处理分析完成
    const handleTerminateAnalysis = async () => {
        // Stop streaming first
        stopStreaming();
        // Then terminate the analysis task
        await terminateAnalysis(projectId, stageType);
    };
    // 如果没有点击terminal, 再大模型分析结束后，需要一个自动的状态跳转 从Analyzing到REVIEWING

// ------------------- 处理 REVIEWING 状态 ------------------- 

    // 处理重启分析, 先重置任务到配置状态，然后立即启动分析, 不包括重新编辑配置。会直接采用上一个阶段编辑并保存的配置结果。 
    const handleRestartAnalysis = async () => {
        await resetTask(projectId, stageType);
        setTimeout(async () => {
            await startAnalysis(projectId, stageType);
        }, 300);
          
    };

    // 接受结果 进入COMPLETED状态
    const handleAcceptResult = async () => { 
        if (task?.originalResult) {
        await acceptResult(projectId, stageType, task.originalResult);
        }
    };

    // 处理结果编辑操作, 进入Editing_Result状态
    const handleStartResultEditing = () => {
        if (task?.originalResult) {
            setEditingResult(task.originalResult);
            setIsEditingResult(true);
            localStorage.setItem('editingResult', task.originalResult);
            localStorage.setItem('isEditingResult', 'true');
            
        }
    };

    const handleCancelResultEditing = () => {
        // 取消编辑时，当编辑未保存，恢复到编辑前的原始值； 但编辑已保存，现实编辑保存后的最新值。 
        if (task?.originalResult) {
            setEditingResult(task.originalResult);
        }
        setIsEditingResult(false);
        localStorage.setItem('isEditingResult', 'false');
    };

    // 保存已编辑的结果
    const handleSaveEditedResult = async () => {
        await saveEditedResult(projectId, stageType, editingResult);
        handleCancelResultEditing();
        localStorage.removeItem('editingResult');
    };

    // ------------ 处理 COMPLETED 状态 ------------
    // 重置任务
    const handleResetTask = async () => {
        await resetTask(projectId, stageType);
    };

    // 通知父组件任务已完成
    useEffect(() => {
        if (task?.status === TaskStatus.COMPLETED && onComplete) {
        onComplete();
        }
    }, [task?.status, onComplete]);


    // 同步编辑内容到localStorage
    useEffect(() => {
        if (isEditingConfig) {
        localStorage.setItem('editingContext', editingContext || '');
        localStorage.setItem('editingPrompt', editingPrompt || '');
        if (editingCompanyInfo) {
            localStorage.setItem('editingCompanyInfo', JSON.stringify(editingCompanyInfo));
        }
        }
    }, [isEditingConfig, editingContext, editingPrompt, editingCompanyInfo]);

    // 同步编辑内容到localStorage
    useEffect(() => {
        if (isEditingResult) {
        localStorage.setItem('editingResult', editingResult || '');
        }
    }, [isEditingResult, editingResult]);


    // 当任务变更时，清理无关的编辑状态
    useEffect(() => {
        if (task && task.id) {
            // 存储当前任务ID
            const currentTaskId = `${projectId}-${stageType}`;
            const storedTaskId = localStorage.getItem('currentTaskId');
            
            // 如果任务ID变更，清理所有编辑状态
            if (storedTaskId !== currentTaskId) {
                localStorage.setItem('currentTaskId', currentTaskId);
                setIsEditingResult(false);
                setIsEditingConfig(false);
                localStorage.removeItem('isEditingResult');
                localStorage.removeItem('editingResult');
                localStorage.removeItem('isEditingConfig');
                localStorage.removeItem('editingContext');
                localStorage.removeItem('editingPrompt');
                localStorage.removeItem('editingCompanyInfo');
            }
        }
    }, [task, projectId, stageType]);


    // ------------ 根据当前任务状态和UI状态渲染相应组件 ------------
    const renderContent = () => {
        if (isLoading) {
        return <div className="flex items-center justify-center py-12">加载任务数据中...</div>;
        }

        if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <p>加载任务失败</p>
            <p>{(error as Error)?.message}</p>
            </div>
        );
        }

        if (!task) {
        return <div className="flex items-center justify-center py-12">未找到任务数据</div>;
        }

        // 根据任务状态渲染对应组件
        switch (task.status) {
            case TaskStatus.PENDING:
                return (
                <div className="flex items-center justify-center py-12">
                    等待前置任务完成...
                </div>
                );

            case TaskStatus.CONFIGURING:
                // 改状态在前端进行 编辑状态和非编辑状态的不同渲染，这个在ConfigureationPanel组件内部实现
                return (
                <ConfigurationPanel
                    //基础属性
                    task={task}  // 获取当前任务的所有数据，包括状态，配置内容，结果数据等
                    isUpdating={isUpdating}  //向子组件传递 更新操作正在进行中 （即UI加载状态）

                    // 与流程相关的回调
                    onLoadConfig={handleLoadConfig}  //点击加载,从预设模块加载配置
                    onStartAnalysis={handleStartAnalysis}  //点击开始分析按钮，任务状态切换到ANALYZING
                    onStartEditing={handleStartConfigEditing}  // 点击开始编辑按钮，进入编辑模式

                    // UI编辑状态控制
                    isEditing={isEditingConfig}  // 表示面板处于编辑模式

                    editingContext={editingContext}   // 向子组件传递当前编辑的内容，初始化时，直接从当前任务中复制
                    editingPrompt={editingPrompt}
                    editingCompanyInfo={editingCompanyInfo}
                    onEditingContextChange={setEditingContext}  // 用户更改文本框或受控组件的值时，回调，更新编辑内容
                    onEditingPromptChange={setEditingPrompt}
                    onEditingCompanyInfoChange={setEditingCompanyInfo}

                    onCancelEditing={handleCancelConfigEditing}  // 点击取消编辑按钮，退出编辑模式
                    onSaveConfig={handleSaveConfig}    //点击保存，保存当前编辑的配置到后端

                />
                );

            case TaskStatus.ANALYZING:
                return (
                <AnalysisPanel
                    // 流式数据相关属性
                    streamContent={streamContent}
                    isStreaming={isStreaming}
                    streamError={streamError}
                    streamComplete={streamComplete}
                    streamStatus={streamStatus}
                    streamResult={streamResult}
                    isStartingStream={isStartingStream}
                    // 与流程相关的回调
                    onTerminateAnalysis={handleTerminateAnalysis}
                />
                );
            
            case TaskStatus.REVIEWING:
                return (
                <ReviewPanel
                    //基础属性
                    task={task}
                    isUpdating={isUpdating}

                    // 与流程相关的回调
                    onAcceptResult={handleAcceptResult}         // 接受结果 跳转进入COMPLETED状态 
                    onRestartAnalysis={handleRestartAnalysis}   // 重新分析 （回到configuring, 然后直接触发startAnalysis）
                    onStartEditing={handleStartResultEditing}   // 进入编辑状态
                    

                    // 与UI编辑相关的回调
                    isEditing={isEditingResult}

                    editingResult={editingResult}
                    onEditingResultChange={setEditingResult}

                    onCancelEditing={handleCancelResultEditing}
                    onSaveEditedResult={handleSaveEditedResult}
                />
                );

            case TaskStatus.COMPLETED:
                return (
                <CompletionPanel
                    //基础属性
                    task={task}
                    isUpdating={isUpdating}

                    // 与流程相关的回调
                    onResetTask={handleResetTask}
                />
                );

            case TaskStatus.RESET:
                return (
                <div className="flex items-center justify-center py-12">
                    任务正在重置中...
                </div>
                );

            default:
                return (
                <div className="flex items-center justify-center py-12">
                    未知任务状态: {task.status}
                </div>
                );
        }
  };

  return (
    <div className="flex flex-col h-full w-full">

      {/* 状态栏展示当前任务状态和基本信息 */}
      <StatusBar task={task} isLoading={isLoading} isError={isError} />

    {/* 当任务已配置且不在配置阶段时，显示配置信息预览 */}
    {/* {task && task.status !== TaskStatus.CONFIGURING && task.status !== TaskStatus.PENDING && (
      <ConfigurationPreview 
        context={task.context}
        prompt={task.prompt}
        companyInfo={task.companyInfo}
      />
    )} */}

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default TaskContainer;