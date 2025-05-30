import React, { useState, useEffect, useMemo } from 'react';
import { useTasks } from './hook&APIs.tsx/useTasks';
import { useStream } from './hook&APIs.tsx/useStreaming';
import { TaskStatus } from './hook&APIs.tsx/tasksApi';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';
import { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface';
import { useUnsavedChangesWarning } from '@/_hooks/useUnsavedChangeWarning';
import { Button } from '@/components/ui/button'; // Assuming you have a UI button component

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Upload, Lock } from 'lucide-react';

// 引入状态特定组件
import ConfigurationPanel from './ConfigurationPanel/ConfigurationPanel';
import AnalysisPanel from './AnalysisPanel/AnalysisPanel';
import ReviewPanel from './ReviewPanel/ReviewPanel';
import CompletionPanel from './CompletionPanel/CompletionPanel';
import ConfigurationPreview from './ConfigurationPreview/ConfigurationPreview';
import ResultPreview from './ResultPreview/ResultPreview';
// 引入共享组件
import StatusBar from './shared/StatusBar';


interface TaskContainerProps {
  projectId: string;
  stageType: StageType;
  taskType: TaskType;
  isEnabled: boolean;
  onComplete?: () => void; // 可选回调，当任务完成时通知父组件
}

const TaskContainer: React.FC<TaskContainerProps> = ({
  projectId,
  stageType,
  taskType,
  isEnabled,
  onComplete
}) => {
  // 使用自定义hook获取任务数据和操作方法
    const {
        taskData,
        isLoading,
        isError,
        error,
        startAnalysis,
        startReview,
        acceptResult,
        saveEditedResult,
        resetTask,
        loadConfig,
        saveConfig,
        isUpdating
    } = useTasks(projectId, stageType, taskType);

    // 获取任务数据
    // const { data: task, isLoading, isError, error } = useTaskData(projectId, stageType, taskType);

    // Add streaming hook for ANALYZING state
    const {
        //streamId,
        streamContent,
        isStreaming,
        streamError,
        streamComplete,
        streamStatus,
        streamResult,
        startStream,
        stopStreaming,
        isStartingStream,   // 正在启动分析
        resetStreamStorage
    } = useStream(projectId, stageType, taskType);



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
    const [editingInstruction, setEditingInstruction] = useState<string>(() => {
        return localStorage.getItem('editingInstruction') || '';
    });
    const [editingSupplement, setEditingSupplement] = useState<any>(() => {
        const saved = localStorage.getItem('editingSupplement');
        return saved ? JSON.parse(saved) : null;
    });


    // 使用自定义Hook来处理未保存更改的提醒
    useUnsavedChangesWarning(isEditingResult || isEditingConfig, '您有未保存的编辑内容，确定要离开吗？');


    // ------------ 处理 CONFIGURING 状态 ------------
    // 加载模板配置 （目前在useTasks.ts中，通过失效缓存触发重新查询。 未来待拓展）
    const handleLoadConfig = async () => {
        await loadConfig();
          
    };

    // 开始编辑配置
    const handleStartConfigEditing = () => {
        // 当任务进入编辑模式时，会从当前任务中复制初始值 
        if (taskData) {
            const context = taskData.context || '';
            const instruction = taskData.instruction || '';
            const supplement = taskData.supplement || null;
            
            setEditingContext(context);
            setEditingInstruction(instruction);
            setEditingSupplement(supplement);
            setIsEditingConfig(true);
            
            localStorage.setItem('editingContext', context);
            localStorage.setItem('editingInstruction', instruction);
            localStorage.setItem('editingSupplement', supplement ? JSON.stringify(supplement) : '');
            localStorage.setItem('isEditingConfig', 'true');
        }
    };

    // 取消配置编辑
    const handleCancelConfigEditing = () => {
        // 取消编辑时，当编辑未保存，恢复到编辑前的原始值； 但编辑已保存，现实编辑保存后的最新值。 
        if (taskData) {
            setEditingContext(taskData.context || '');
            setEditingInstruction(taskData.instruction || '');
            setEditingSupplement(taskData.supplement || null);
            }
            setIsEditingConfig(false);
            localStorage.setItem('isEditingConfig', 'false');
    };

    // 保存配置
    const handleSaveConfig = async (context: string, instruction: string, supplement: any) => {
        await saveConfig(context, instruction, supplement);
        
            // 由于上面保存配置后，取消编辑的重置，会使用最新的配置内容 （在useTasks.ts中，向后端保存数据后，会手动invalidate缓存，导致重新获取任务数据，以保持最新状态）
        if (isEditingConfig) {
            handleCancelConfigEditing(); // 保存成功后退出编辑模式
            localStorage.removeItem('editingContext');
            localStorage.removeItem('editingInstruction');
            localStorage.removeItem('editingSupplement');
        }
    };

    // 开始分析
    const handleStartAnalysis = async () => {
        await startAnalysis();
        // Start streaming after analysis begins
        if (projectId && stageType && taskType) {
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
    };
    // 如果没有点击terminal, 再大模型分析结束后，需要一个自动的状态跳转 从Analyzing到REVIEWING

    // 处理重启分析, 先重置任务到配置状态，然后立即启动分析, 不包括重新编辑配置。会直接采用上一个阶段编辑并保存的配置结果。 
    const handleRestartAnalysis = async () => {
        await resetStreamStorage();
        await resetTask();
        setTimeout(async () => {
            await startAnalysis();
            await startStream();
        }, 300);
            
    };

    // 接受结果 进入COMPLETED状态
    const handleAcceptResult = async () => { 
        // 当streamComplete为true时，说明streamResult已经处理完毕，我们可以触发后端接受结果
        // acceptResult向后端发起status变更为COMPLETED的请求，而在后端需要将streamResult转为TiptapJSON格式，存储在finalResult中。
        if (streamComplete) {
        await acceptResult();
        }
    };

    // 处理人工核审
    const handleStartReview = async () => {
        await startReview();  // 这个将让status从ANALYZING变为REVIEWING

    };

// ------------------- 处理 REVIEWING 状态 ------------------- 



    // 处理结果编辑操作, 进入Editing_Result状态
    const handleStartResultEditing = async () => {
        // 当ANALYZING里的任务完成，我们并不是直接将streamResult拿来用。
        // 编辑使用Tiptap编辑器，所以我们在后端需要先将streamResult转为TiptapJSON格式，存储在OriginalResult中。
        // 前端调用OriginalResult, 进行编辑。 
        // 待测试检查，数据是否及时处理并返回了？
        if (taskData?.finalResult) {
            setEditingResult(taskData.finalResult);
            setIsEditingResult(true);
            localStorage.setItem('editingResult', taskData.finalResult);
            localStorage.setItem('isEditingResult', 'true');
        }
    };

    const handleCancelResultEditing = () => {
        // 取消编辑时，当编辑未保存，恢复到编辑前的原始值； 但编辑已保存，现实编辑保存后的最新值。 
        if (taskData?.finalResult) {
            setEditingResult(taskData.finalResult);
        }
        setIsEditingResult(false);
        localStorage.setItem('isEditingResult', 'false');
    };

    // 保存已编辑的结果
    const handleSaveEditedResult = async () => {
        await saveEditedResult(editingResult);
        if (isEditingResult) {
            handleCancelResultEditing();
            localStorage.removeItem('editingResult');
        }
    };

    const handleConfirmedReview = async () => {
        await acceptResult();
    };


    // ------------ 处理 COMPLETED 状态 ------------
    // 重置任务
    const handleResetTask = async () => {
        await resetTask();
    };
    

    // 通知父组件任务已完成
    useEffect(() => {
        if (taskData?.status === TaskStatus.COMPLETED && onComplete) {
        onComplete();
        }
    }, [taskData?.status, onComplete]);


    // 同步编辑内容到localStorage
    useEffect(() => {
        if (isEditingConfig) {
        localStorage.setItem('editingContext', editingContext || '');
        localStorage.setItem('editingInstruction', editingInstruction || '');
        if (editingSupplement) {
            localStorage.setItem('editingSupplement', JSON.stringify(editingSupplement));
        }
        }
    }, [isEditingConfig, editingContext, editingInstruction, editingSupplement]);

    // 同步编辑内容到localStorage
    useEffect(() => {
        if (isEditingResult) {
        localStorage.setItem('editingResult', editingResult || '');
        }
    }, [isEditingResult, editingResult]);


    // 当任务变更时，清理无关的编辑状态
    useEffect(() => {
        if (taskData && taskData.id) {
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
                localStorage.removeItem('editingInstruction');
                localStorage.removeItem('editingSupplement');
            }
        }
    }, [taskData, projectId, stageType, taskType]);


    // 根据任务状态获取卡片样式 - 使用useMemo缓存结果
    const cardStyle = useMemo(() => {
        if (!taskData) return "border-gray-200";
        
        switch(taskData.status) {
            case TaskStatus.NOT_STARTED:
                return "border-gray-200";
            case TaskStatus.PROCESSING:
                return "border-blue-400 border-2 bg-blue-50";
            case TaskStatus.COMPLETED:
                return "border-green-400 border-2 bg-green-50";
            case TaskStatus.FAILED:
                return "border-red-400 border-2 bg-red-50";
            case TaskStatus.CONFIGURING:
                return "border-amber-400 border-2 bg-amber-50";
            case TaskStatus.REVIEWING:
                return "border-purple-400 border-2 bg-purple-50";
            default:
                return "border-gray-200";
        }
    }, [taskData]);

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

        if (!taskData) {
        return <div className="flex items-center justify-center py-12">未找到任务数据</div>;
        }

        // 根据任务状态渲染对应组件
        switch (taskData.status) {
            case TaskStatus.NOT_STARTED:
                return (
                <div className="flex items-center justify-center py-12">
                    <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleLoadConfig}
                    disabled={isUpdating}
                    >
                    加载配置
                    </Button>
                </div>
                );

            case TaskStatus.FAILED:   // 任务执行失败，需要重置任务, 这里先简单处理（占位），未来再考虑是否用完善的方式。
                return (
                    <div className="flex flex-col items-center justify-center py-12 text-red-500">
                        <p className="text-xl font-semibold mb-4">任务执行失败</p>
                        <p className="mb-4">{taskData.errorMessage || "未知错误"}</p>
                        <button 
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={handleResetTask}
                        >
                            重置任务
                        </button>
                    </div>
                );

            case TaskStatus.CONFIGURING:
                // 改状态在前端进行 编辑状态和非编辑状态的不同渲染，这个在ConfigureationPanel组件内部实现
                return (
                <ConfigurationPanel
                    //基础属性
                    task={taskData}  // 获取当前任务的所有数据，包括状态，配置内容，结果数据等
                    isUpdating={isUpdating}  //向子组件传递 更新操作正在进行中 （即UI加载状态）

                    // 与流程相关的回调
                    // onLoadConfig={handleLoadConfig}  //点击加载,从预设模块加载配置
                    onStartAnalysis={handleStartAnalysis}  //点击开始分析按钮，任务状态切换到ANALYZING
                    onStartEditing={handleStartConfigEditing}  // 点击开始编辑按钮，进入编辑模式

                    // UI编辑状态控制
                    isEditing={isEditingConfig}  // 表示面板处于编辑模式

                    editingContext={editingContext}   // 向子组件传递当前编辑的内容，初始化时，直接从当前任务中复制
                    editingInstruction={editingInstruction}
                    editingSupplement={editingSupplement}
                    onEditingContextChange={setEditingContext}  // 用户更改文本框或受控组件的值时，回调，更新编辑内容
                    onEditingInstructionChange={setEditingInstruction}
                    onEditingSupplementChange={setEditingSupplement}

                    onCancelEditing={handleCancelConfigEditing}  // 点击取消编辑按钮，退出编辑模式
                    onSaveConfig={handleSaveConfig}    //点击保存，保存当前编辑的配置到后端

                />
                );

            case TaskStatus.PROCESSING:
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
                    // 添加完成后的操作回调
                    onRestartAnalysis={handleRestartAnalysis}
                    onAcceptResult={handleAcceptResult}
                    onStartResultEditing={handleStartReview}

                />
                );
            
            case TaskStatus.REVIEWING:
                return (
                <ReviewPanel
                    //基础属性
                    finalResult={taskData.finalResult || ''}
                    isUpdating={isUpdating}

                    // 与UI编辑相关的回调
                    isEditing={isEditingResult}

                    editingResult={editingResult}
                    onStartEditing={handleStartResultEditing}
                    onEditingResultChange={setEditingResult}
                    onCancelEditing={handleCancelResultEditing}
                    onSaveEditedResult={handleSaveEditedResult}
                    onCompleteReview={handleConfirmedReview}
                />
                );

            case TaskStatus.COMPLETED:
                return (
                <CompletionPanel
                    // 与流程相关的回调
                    onResetTask={handleResetTask}
                    nextTaskPath="/tasks/next-task-id"
                />
                );

            default:
                return (
                <div className="flex items-center justify-center py-12">
                    未知任务状态: {taskData.status}
                </div>
                );
        }
  };

  return (
    <Card className={`mb-6 ${cardStyle}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          {taskData?.name || "任务"}
          {taskData?.status === TaskStatus.COMPLETED && (
            <span title="此任务已锁定">
              <Lock className="h-4 w-4 ml-2 text-gray-500" />
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-full w-full">
          {!isEnabled && (
            <Alert variant="default">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>任务未激活</AlertTitle>
              <AlertDescription>
                请先完成上一个任务
              </AlertDescription>
            </Alert>
          )}

          {/* 状态栏展示当前任务状态和基本信息 */}
          {isEnabled && <StatusBar task={taskData} isLoading={isLoading} isError={isError} />}

          {/* 当任务已配置且不在配置阶段时，显示配置信息预览 */}
          {!isEnabled && taskData && taskData.status !== TaskStatus.CONFIGURING && taskData.status !== TaskStatus.NOT_STARTED && taskData.status !== TaskStatus.FAILED && (
            <ConfigurationPreview 
              context={taskData.context}
              instruction={taskData.instruction}
              supplement={taskData.supplement}
            />
          )}

          {/* 当任务已经完成分析时，显示配置信息预览 */}
          {isEnabled && taskData && taskData.status !== TaskStatus.FAILED &&
            taskData.status !== TaskStatus.CONFIGURING && 
            taskData.status !== TaskStatus.NOT_STARTED && 
            taskData.status !== TaskStatus.PROCESSING && 
            taskData.status !== TaskStatus.REVIEWING && (
            <ResultPreview 
              finalResult={taskData.finalResult || ''}
            />
          )}

          {/* 主要内容区域 */}
          {isEnabled && (
            <div className="flex-1 overflow-auto">
              {renderContent()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskContainer;