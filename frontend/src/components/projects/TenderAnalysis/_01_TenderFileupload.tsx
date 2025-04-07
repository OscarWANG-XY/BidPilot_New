import React, { useEffect, useCallback, useReducer, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Upload, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { FileManager } from '@/components/files/_FileManager'
import { useFiles } from '@/hooks/useFiles'
import { StageType } from '@/types/projects_dt_stru/projectStage_interface'
import { TaskStatus } from '@/types/projects_dt_stru/projectTasks_interface'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'
import { useUploadFile } from '@/hooks/useProjects/useTaskUploadFile'



// ----------------------- 构建TaskReducer ------------------------
// 定义状态类型
interface State {
  status: TaskStatus;
  isNavigating: boolean;
  fileManagerKey: number; 
}

// 定义 Action 类型
type Action =
  | { type: 'SET_LOADING_FROM_API'; payload: TaskStatus }
  | { type: 'START_CONFIRM_SUBMIT' }  // 针对 用户点击“确认上传”按钮触发
  | { type: 'COMPLETE_TASK_SUCCESS' }  // 针对 实际API调用完成
  | { type: 'COMPLETE_TASK_FAILURE' } // 针对 实际API调用失败
  | { type: 'RESET_FILE_MANAGER'};

// Reducer 函数
function Reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING_FROM_API':
      // 只有当API返回的状态与当前状态不同时才更新
      return state.status !== action.payload 
        ? { ...state, status: action.payload } 
        : state;
    
    case 'START_CONFIRM_SUBMIT':  // 用户点击“确认上传”按钮触发， 下面的状态变更关注的是用户体验
      return { 
        ...state, 
        isNavigating: true,           // 显示按钮加载状态，禁用按钮，防止重复提交
        status: TaskStatus.COMPLETED  // 更新状态为已完成，这是乐观更新，实际API调用尚未完成
      };
    
    case 'COMPLETE_TASK_SUCCESS':  // 实际API调用完成，更新状态为已完成
      return { 
        ...state, 
        isNavigating: false   // 结束加载状态，按钮被释放 （在渲染过程中虽然按钮被释放，我们会将它隐藏）
      };
    
    case 'COMPLETE_TASK_FAILURE':
      return { 
        ...state, 
        isNavigating: false,   // 结束加载状态，按钮被释放 
        status: TaskStatus.ACTIVE   // 如果API调用失败，恢复状态为激活 （状态回滚）
      };
    
      case 'RESET_FILE_MANAGER':
        return { 
          ...state, 
          fileManagerKey: state.fileManagerKey + 1
        };

    default:
      return state;
  }
}



// ----------------------- 定义组件的props ---------------------
interface TenderFileUploadProps {
  // 传入参数
  projectId: string
  isEnabled?: boolean                     // 添加isEnabled属性，与TaskA保持一致
  // 回调函数
  onStateChange?: (status: TaskStatus) => void  // 状态数据回传
  onNavigateToNextTask?: () => void             // 回调进入下个任务的Tab
}


// ========================================== 组件主函数 =============================================
export const TenderFileUpload: React.FC<TenderFileUploadProps> = ({ 
  // 传入参数
  projectId, 
  isEnabled = true, 
  // 回调函数
  onStateChange, 
  onNavigateToNextTask,
}) => {

  // 初始化Reducer状态
  const initialState: State = {
    status: TaskStatus.ACTIVE,
    isNavigating: false,
    fileManagerKey: 0,
  }

  // 使用Reducer管理组件状态
  const [state, dispatch] = useReducer(Reducer, initialState);
  const { status, isNavigating, fileManagerKey } = state;


  // 使用useProjectTasks获取和更新任务状态
  const { fileUploadTaskQuery, updateFileUploadTask } = useUploadFile()

  // 查询任务状态（从API获取）
  const { data: taskData } = fileUploadTaskQuery(projectId, StageType.TENDER_ANALYSIS);



  // 同步API数据到本地状态
  useEffect(() => {
    if (taskData) {
      dispatch({ type: 'SET_LOADING_FROM_API', payload: taskData.status });
    }
  }, [taskData]);   // 不需要使用useDemo，因为在reducer里已经有代码进行实际变化的核查。


  // ------------ 优化点 --------------
  // // 向父组件回传状态变化
  // useEffect(() => {
  //   if (onStateChange) {
  //     onStateChange(status)
  //   }
  // }, [status, onStateChange])
  // 向父组件回传状态变化 - 使用useCallback 确保是真的有状态变化或onStateChange变化，才创建新的回调。 
  const handleStateChange = useCallback(() =>{
    if(onStateChange){
      onStateChange(status)
    }
  },[status, onStateChange])

  useEffect(() => {
    handleStateChange()
  }, [handleStateChange])



  
  // START ==================================== 文件上传处理 ==================================
  // 文件加载状态
  //const [isFilesLoading, setIsFilesLoading] = useState(true)
  const { refetch: refreshFiles, files } = useFiles(projectId)
  //const [fileManagerKey, setFileManagerKey] = useState(0);


  // ----------优化点 --------------
  // // 检查是否有且只有一个docx文件
  // const docxFiles = files.filter(file => 
  //     file.name.toLowerCase().endsWith('.docx') || 
  //     file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  // )
  // const hasDocxFile = docxFiles.length > 0
  // const hasExactlyOneDocxFile = docxFiles.length === 1


  // 使用useMemo缓存计算结果
  const fileAnalysis = useMemo(() => {
    const docxFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.docx') || 
      file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    return {
      docxFiles,
      hasDocxFile: docxFiles.length > 0,
      hasExactlyOneDocxFile: docxFiles.length === 1
    }
  }, [files]);

  const { hasDocxFile, hasExactlyOneDocxFile } = fileAnalysis


  // 处理文件上传的函数 - 返回一个布尔值表示是否应该继续上传
  const handleFileUpload = useCallback((file: File): boolean => {
    // 如果任务已完成，阻止上传
    if (status === TaskStatus.COMPLETED) {
      toast({
        title: "操作被锁定",
        description: "任务已进入下一阶段，无法修改上传的文件",
        variant: "destructive"
      });
      return false;
    }

    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.docx') && 
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      toast({
        title: "文件类型错误",
        description: "只允许上传Word文档(.docx)文件",
        variant: "destructive"
      });
      return false; // 阻止上传
    }
    
    // 检查是否已有docx文件
    if (hasDocxFile) {
      toast({
        title: "已存在文档",
        description: "项目已有Word文档，请先删除现有文档再上传新文档",
        variant: "destructive"
      });
      return false; // 阻止上传
    }
    
    console.log('File validation passed, proceeding with upload:', file);
    return true; // 允许上传
  },[status, hasDocxFile])


  
  // 处理文件加载状态变化
  const handleLoadingChange = useCallback((loading: boolean) => {
    console.log('Files loading state changed:', loading)
    //setIsFilesLoading(loading)
  },[])
  
  // 处理上传成功的回调
  const handleUploadSuccess = useCallback(async () => {
    console.log('File uploaded successfully, refreshing file list');
    await refreshFiles();
  },[refreshFiles])
  
  // 文件删除处理函数 (useCallback 确保函数引用不变, 避免引用它的子组件不必要的重新渲染)
  // 如果不使用callback, 每次该组件渲染会创建新的函数实例，触发子组件不必要的渲染。
  // 依赖项是看内部使用了哪些外部变量
  const handleDeleteCheck = useCallback(() => {
    if (status === TaskStatus.COMPLETED) {
      toast({
        title: "操作被锁定",
        description: "任务已进入下一阶段，无法删除上传的文件",
        variant: "destructive"
      });
      return false;
    }
    return true;
  },[status])


  // 添加删除成功的回调
  const handleDeleteSuccess = useCallback(() => {
    // 重置 FileManager 组件
    dispatch({ type: 'RESET_FILE_MANAGER' });
  }, []);
  
  //END ------------------------- 文件处理部分结束 -----------------------


  // 处理"启动分析"按钮点击
  const handleNextTask = useCallback(async () => {
    console.log("'启动分析'按钮被点击")

    if (!hasExactlyOneDocxFile) {
      toast({
        title: "文件要求",
        description: "需要上传且只能上传一个招标文件才能进入下一步",
        variant: "destructive"
      });
      return;
    }

    // 开始完成任务流程
    dispatch({ type: 'START_CONFIRM_SUBMIT' });
    console.log("任务状态更新为完成");
    
    try {

      // 更新后端状态
      await updateFileUploadTask({
        projectId,
        stageType: StageType.TENDER_ANALYSIS,
        status: TaskStatus.COMPLETED
      });
      
      // 任务完成成功
      dispatch({ type: 'COMPLETE_TASK_SUCCESS' });

      toast({
        title: "任务已完成",
        description: "文档解析任务已开始处理",
        variant: "default"
      });
      
      // 导航到下一个任务页面
      if (onNavigateToNextTask) {
        onNavigateToNextTask();
      }
    } catch (error) {
      console.error('启动下一个任务失败:', error);

      // 任务完成失败，恢复状态
      dispatch({ type: 'COMPLETE_TASK_FAILURE' });

      toast({
        title: "操作失败",
        description: "无法启动下一个任务，请稍后重试",
        variant: "destructive"
      });
    }
  },[hasExactlyOneDocxFile, projectId, updateFileUploadTask, onNavigateToNextTask]);




  // START ============================ 组件 渲染 ==========================================
  
  // // 根据任务状态获取卡片样式
  // const getCardStyleByStatus = () => {
  //   switch(status) {
  //     case TaskStatus.NOT_STARTED:
  //       return "border-gray-200";
  //     case TaskStatus.ACTIVE:
  //       return "border-blue-400 border-2 bg-blue-50";
  //     case TaskStatus.COMPLETED:
  //       return "border-green-400 border-2 bg-green-50";
  //     case TaskStatus.FAILED:
  //       return "border-red-400 border-2 bg-red-50";
  //     default:
  //       return "border-gray-200";
  //   }
  // }
  
  
  // 根据任务状态获取卡片样式 - 使用useMemo缓存结果
  const cardStyle = useMemo(() => {
    switch(status) {
      case TaskStatus.NOT_STARTED:
        return "border-gray-200";
      case TaskStatus.ACTIVE:
        return "border-blue-400 border-2 bg-blue-50";
      case TaskStatus.COMPLETED:
        return "border-green-400 border-2 bg-green-50";
      case TaskStatus.FAILED:
        return "border-red-400 border-2 bg-red-50";
      default:
        return "border-gray-200";
    }
  }, [status]);

  // 判断是否文件操作被锁定
  const isFilesLocked = status === TaskStatus.COMPLETED;

  // --------  Part4: 组件的UI渲染
return (
  <Card className={`mb-6 ${cardStyle}`}>
    <CardHeader>
      <CardTitle className="text-lg flex items-center">
        <Upload className="h-5 w-5 mr-2" />
        上传招标文件
        {isFilesLocked && (
          <span title="此任务已锁定">
            <Lock className="h-4 w-4 ml-2 text-gray-500" />
          </span>
        )}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {isEnabled ? (
        <>
          <p className="text-sm text-gray-600 mb-4">
            请上传招标文件（仅支持.docx格式），系统将自动分析文件内容，为后续阶段提供支持。
            {isFilesLocked && <span className="text-amber-600 ml-1">任务已锁定，无法修改文件。</span>}
          </p>
          {hasDocxFile ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                {isFilesLocked 
                    ? "文件已锁定。任务已进入下一阶段，无法修改文件。" 
                    : "已上传Word文档。如需更新，请先删除现有文档再上传新文档。"}
              </p>
            </div>
          ) : null}

          <FileManager 
            key={`file-manager-${fileManagerKey}`} // 使用动态key强制重置组件
            // 属性配置（传入）
            projectId={projectId} 
            acceptedFileTypes=".docx"
            allowMultiple={false}
            readOnly={isFilesLocked}
            // 回调函数
            onFileUpload={handleFileUpload} 
            onUploadSuccess={handleUploadSuccess}
            onDeleteCheck={handleDeleteCheck}
            onDeleteSuccess={handleDeleteSuccess}
            onLoadingChange={handleLoadingChange} // 新增：传递加载状态回调
          />
          {!isFilesLocked && hasExactlyOneDocxFile && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleNextTask}
                disabled={isNavigating || isFilesLocked}
              > 
                确认提交     
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <Alert variant="default">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>任务未激活</AlertTitle>
          <AlertDescription>
            请先完成前置任务
          </AlertDescription>
        </Alert>
      )}
    </CardContent>
  </Card>
)
}
