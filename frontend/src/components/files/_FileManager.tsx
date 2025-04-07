import { useState, useEffect } from "react";  // 状态管理
import { useFiles } from "@/hooks/useFiles";   // 文件管理HOOKS
import { useToast } from "@/hooks/use-toast";  // 消息提示HOOKS
import { FileRecord } from "@/types/files_dt_stru";  // 数据接口类型
import { validateFile } from "./FileHelpers";  // 功能函数
import { FileUploadButton } from "./FileUploadButton";  // 上传按钮子组件
import { FileTable } from "./FileTable";  // 文件列表子组件
import { FilePreviewDialog } from "./FilePreviewDialog";  // 预览对话框子组件


// 文件管理器 主函数 的 输入参数： 这里是一个回调函数， 用于在父组件中定义和执行逻辑操作。
interface FileManagerProps {
  // 修改回调函数，返回布尔值表示是否应该继续上传
  onFileUpload: (inputfile: File) => boolean | void;
  // 添加上传成功的回调函数
  onUploadSuccess?: () => void;
  // 添加可选的项目ID参数，用于关联文件到特定项目
  projectId?: string;
  // 添加标题参数，可以根据不同场景显示不同标题
  //title?: string;
  // 添加接受的文件类型
  acceptedFileTypes?: string;
  // 添加是否允许多文件上传
  allowMultiple?: boolean;
  // 添加删除检查回调函数，如果返回false则阻止删除
  onDeleteCheck?: () => boolean;
  // 添加删除成功回调函数
  onDeleteSuccess?: () => void;
  // 添加只读模式，为true时禁用上传和删除
  readOnly?: boolean;
  // 新增：加载状态变化回调
  onLoadingChange?: (isLoading: boolean) => void;

}


// ==================================== 文件管理器 ========================================== 
/* 负责管理文件的状态和逻辑：useToast, useFiles Hooks的引用; useState:预览文件的状态更新，预览框的状态开关。
** 处理文件上传handleUpload、删除handleDelete和预览handlePreview的三个业务逻辑。
** 作为协调器，连接不同的子组件：FileUploadButton.tsx、FileTable.tsx、FilePreviewDialog.tsx。
*/
// 文件管理器 主函数
export function FileManager({ 
  onFileUpload, 
  onUploadSuccess,
  projectId, 
  //title = "文件管理", 
  acceptedFileTypes,
  allowMultiple = true,
  onDeleteCheck,
  onDeleteSuccess,
  readOnly = false,
  onLoadingChange // 新增：接收加载状态变化回调
}: FileManagerProps) {

  console.log("🔄 渲染", projectId ? `项目ID: ${projectId}` : "全局模式");

  // Hooks的功能引用： useToast() 和 useFiles()
  const { toast } = useToast();
  const {
    files,
    isLoading,
    uploadFile,
    deleteFile,
    isUploading,
    isDeleting,
    useFileDetail,
  } = useFiles(projectId); // 传入项目ID，用于过滤文件

  // 新增：使用useEffect监听isLoading状态变化并通知父组件
  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);


  // 文件的状态管理： 文件的选择和更新， 预览组件的启用和关闭
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 添加批量删除相关状态
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);



  // -------------------- 文件上传的处理逻辑（函数）done check! -------------------- 
  // File类型(这是一个对象)，这个类型是浏览器自带，通过 <input type="file" /> 元素选择文件时自动创建
  // File文件对象包含.name、.type、.size、.lastModified （时间戳），lastModifiedDate （日期），.webkitRelativePath （文件路径）
  const handleUpload = async (inputfile: File) => {

    // 如果处于只读模式，直接返回
    if (readOnly) {
      toast({
        title: "操作被禁止",
        description: "当前处于只读模式，无法上传文件",
        variant: "destructive",
      });
      return;
    }


    console.log('🚀 开始处理文件上传:', {
      fileName: inputfile.name,
      fileSize: inputfile.size,
      fileType: inputfile.type,
      projectId: projectId || "全局"
    });

    try {
      // 调用父组件的验证函数，如果返回false则中止上传
      const shouldProceed = onFileUpload(inputfile);
      if (shouldProceed === false) {
        console.log('⛔ 上传被父组件阻止');
        return;
      }

      // 引用FileHelpers.ts里的validateFile函数，验证文件类型和大小 
      // 这里toast是useToast的toast功能， 在FileHelpers.ts里不引入， 在FileManager.tsx里以参数引入 
      validateFile(inputfile, toast);  

      // 引用useFiles.ts里的uploadFile函数，上传文件
      uploadFile(inputfile, {
        projectId,
        onSuccess: () => {
          console.log('✅ [_FileManager.tsx] 文件上传成功:', inputfile.name);
          toast({
            title: "文件上传成功",
            description: `${inputfile.name} 已成功上传`
          });
          
          // 调用上传成功的回调函数
          onUploadSuccess?.();
        },
        onError: (error: any) => {
          console.error('❌ [_FileManager.tsx] 上传错误详情:', {
            error,
            message: error?.response?.data?.message || error.message
          });
          toast({
            title: "上传失败",
            description: error?.response?.data?.message || error.message || "请稍后重试",
            variant: "destructive",
          });
        },
      });
    } catch (error: any) {
      console.error('❌ [_FileManager.tsx] 文件处理错误:', error);
      toast({
        title: "处理失败",
        description: error.message || "文件处理过程中出现错误",
        variant: "destructive",
      });
    }
  };

  // ------------------ 文件删除的处理逻辑（函数）done check! ------------------ 
  const handleDelete = (fileId: string) => {

    // 如果处于只读模式，直接返回
    if (readOnly) {
      toast({
        title: "操作被禁止",
        description: "当前处于只读模式，无法删除文件",
        variant: "destructive",
      });
      return;
    }

    // 如果提供了删除检查回调，则执行检查
    if (onDeleteCheck && !onDeleteCheck()) {
      return;
    }

    console.log('🗑️ 开始删除文件:', fileId);

    // 引用useFiles.ts里的deleteFile函数来实现文件删除， 输入文件的id
    deleteFile(fileId, {
      onSuccess: () => {
        console.log('✅ 文件删除成功:', fileId);
        toast({
          title: "文件已删除",
        });
        // 调用删除成功的回调函数
        onDeleteSuccess?.();
      },
      onError: (error: any) => {
        console.error('❌ [_FileManager.tsx] 删除错误详情:', {
          fileId,
          error,
          message: error?.response?.data?.message || error.message
        });
        toast({
          title: "删除失败",
          description: error?.response?.data?.message || error.message || "请稍后重试",
          variant: "destructive",
        });
      },
    });
  };

  // --------------------------- 文件预览的处理逻辑 done check! ---------------------------

  // 在FileTable.tsx里， 点击文件的预览按钮， 触发这个函数
  // 输入FileRecord类型， 这个类型是useFiles.ts里的files的类型, 在FileTable遍历渲染遍历时获得。
  const handlePreview = (file: FileRecord) => {
    console.log('👁️ [_FileManager.tsx] 准备预览文件:', {
      fileId: file.id,
      fileName: file.name,
    });
    
    // 先设置选中的文件，FilePreviewDialog 组件会处理获取预签名 URL
    setSelectedFile(file);
    // 打开预览对话框 => 这个值传给FilePreviewDialog.tsx来控制
    setIsPreviewOpen(true);
  };

  // ------------------ 批量删除的处理逻辑 ------------------ 
  const handleBatchDelete = async () => {
    // 如果处于只读模式，直接返回
    if (readOnly) {
      toast({
        title: "操作被禁止",
        description: "当前处于只读模式，无法删除文件",
        variant: "destructive",
      });
      return;
    }

    // 如果提供了删除检查回调，则执行检查
    if (onDeleteCheck && !onDeleteCheck()) {
      return;
    }

    console.log('🗑️ 开始批量删除文件:', selectedFiles);

    try {
      // 使用 Promise.all 并行删除所有选中的文件
      await Promise.all(selectedFiles.map(fileId => deleteFile(fileId)));
      
      console.log('✅ [_FileManager.tsx] 批量删除成功');
      toast({
        title: "批量删除成功",
        description: `已成功删除 ${selectedFiles.length} 个文件`
      });
      setSelectedFiles([]); // 清空已选文件
    } catch (error: any) {
      console.error('❌ [_FileManager.tsx] 批量删除错误:', error);
      toast({
        title: "批量删除失败",
        description: error?.message || "请稍后重试",
        variant: "destructive",
      });
    }
  };




  // ----------------------- 返回文件管理器的组件渲染（组件协调器） -----------------

  // 加载中状态的UI渲染， 这个状态是useFiles.ts里的isLoading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  // 返回文件管理器的组件渲染
  return (
    <div className={`space-y-4 p-4 ${readOnly ? 'opacity-80' : ''}`}>
      {/*<h2 className="text-xl font-semibold mb-4">{title}</h2>*/}
      <div className="flex items-center justify-between">
        {!readOnly && (
        <FileUploadButton 
          onFileSelect={handleUpload} // 回调FileManager.tsx里的handleUpload逻辑函数
          isUploading={isUploading} // 引用useFiles.ts里的isUploading
          acceptedFileTypes={acceptedFileTypes}
          allowMultiple={allowMultiple}
        />
        )}
        {!readOnly && selectedFiles.length > 0 && (
          <button
            onClick={handleBatchDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            删除选中文件 ({selectedFiles.length})
          </button>
        )}
      </div>
      
      <FileTable 
        files={files}  // 引用useFiles.ts里的files
        onDelete={handleDelete}  // 回调FileManager.tsx里的handleDelete逻辑函数 
        onPreview={handlePreview}  // 回调FileManager.tsx里的handlePreview逻辑函数  
        isDeleting={isDeleting}  // 引用useFiles.ts里的isDeleting
        selectedFiles={selectedFiles}
        onSelectFiles={setSelectedFiles}
        showProjectInfo={!projectId} // 如果不是在项目内，则显示项目信息
        readOnly={readOnly}  // 传递只读模式给文件表格
      />
      
      <FilePreviewDialog 
        selectedfile={selectedFile}  // FileManager 管理的文件状态的selectedFile
        isOpen={isPreviewOpen}  // FileManager 管理的预览框的状态开关
        // 回调FileManager.tsx里的setIsPreviewOpen，状态更新
        // <FilePreviewDialog>组件定义了回调函数是onclose:()=>void（不带参数，也无返回值）,实现由父组件提供。
        onClose={() => setIsPreviewOpen(false)}  
        useFileDetail={useFileDetail}  // 引用useFiles.ts里的useFileDetail
      />
    </div>
  );
}