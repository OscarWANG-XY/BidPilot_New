import { useState } from "react";  // 状态管理
import { useFiles } from "@/hooks/useFiles";   // 文件管理HOOKS
import { useToast } from "@/hooks/use-toast";  // 消息提示HOOKS
import { FileRecord } from "@/types/files_dt_stru";  // 数据接口类型
import { validateFile } from "./FileHelpers";  // 功能函数
import { FileUploadButton } from "./FileUploadButton";  // 上传按钮子组件
import { FileTable } from "./FileTable";  // 文件列表子组件
import { FilePreviewDialog } from "./FilePreviewDialog";  // 预览对话框子组件


// 文件管理器 主函数 的 输入参数： 这里是一个回调函数， 用于在父组件中定义和执行逻辑操作。
interface FileManagerProps {
  // 该回调函数，在handleUpload函数中被调用，以inputfile为参数, 数据类型是File，不是FileRecord
  onFileUpload: (inputfile: File) => void;
}


// ==================================== 文件管理器 ========================================== 
/* 负责管理文件的状态和逻辑：useToast, useFiles Hooks的引用; useState:预览文件的状态更新，预览框的状态开关。
** 处理文件上传handleUpload、删除handleDelete和预览handlePreview的三个业务逻辑。
** 作为协调器，连接不同的子组件：FileUploadButton.tsx、FileTable.tsx、FilePreviewDialog.tsx。
*/
// 文件管理器 主函数
export function FileManager({ onFileUpload }: FileManagerProps) {

  // Hooks的功能引用： useToast() 和 useFiles()
  const { toast } = useToast();
  const {
    files,
    isLoading,
    uploadFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useFiles();

  // 文件的状态管理： 文件的选择和更新， 预览组件的启用和关闭
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);



  // -------------------- 文件上传的处理逻辑（函数）done check! -------------------- 
  // File类型(这是一个对象)，这个类型是浏览器自带，通过 <input type="file" /> 元素选择文件时自动创建
  // File文件对象包含.name、.type、.size、.lastModified （时间戳），lastModifiedDate （日期），.webkitRelativePath （文件路径）
  const handleUpload = async (inputfile: File) => {
    try {

      // 引用FileHelpers.ts里的validateFile函数，验证文件类型和大小 
      // 这里toast是useToast的toast功能， 在FileHelpers.ts里不引入， 在FileManager.tsx里以参数引入 
      validateFile(inputfile, toast);  

      // 引用useFiles.ts里的uploadFile函数，上传文件
      uploadFile(inputfile, {
        onSuccess: () => {
          // 父组件的回调函数，该函数在父组件定义和执行逻辑操作。
          onFileUpload(inputfile);
          toast({
            title: "文件上传成功",
            description: `${inputfile.name} 已成功上传`
          });
        },
        onError: (error: any) => {
          console.error('Upload error details:', error);
          toast({
            title: "上传失败",
            description: error?.response?.data?.message || error.message || "请稍后重试",
            variant: "destructive",
          });
        },
      });
    } catch (error: any) {
      console.error('File handling error:', error);
      toast({
        title: "处理失败",
        description: error.message || "文件处理过程中出现错误",
        variant: "destructive",
      });
    }
  };

  // ------------------ 文件删除的处理逻辑（函数）done check! ------------------ 
  const handleDelete = (fileId: string) => {

    // 引用useFiles.ts里的deleteFile函数来实现文件删除， 输入文件的id
    deleteFile(fileId, {
      onSuccess: () => {
        toast({
          title: "文件已删除",
        });
      },
      onError: (error: any) => {
        console.error('Delete error details:', error);
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
    // 更新选择的文件
    setSelectedFile(file);
    // 打开预览对话框 => 这个值传给FilePreviewDialog.tsx来控制
    setIsPreviewOpen(true);
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
    <div className="space-y-4">
      <FileUploadButton 
        onFileSelect={handleUpload}  // 回调FileManager.tsx里的handleUpload逻辑函数 
        isUploading={isUploading}  // 引用useFiles.ts里的isUploading  
      />
      
      <FileTable 
        files={files}  // 引用useFiles.ts里的files
        onDelete={handleDelete}  // 回调FileManager.tsx里的handleDelete逻辑函数 
        onPreview={handlePreview}  // 回调FileManager.tsx里的handlePreview逻辑函数  
        isDeleting={isDeleting}  // 引用useFiles.ts里的isDeleting
      />
      
      <FilePreviewDialog 
        selectedfile={selectedFile}  // FileManager 管理的文件状态的selectedFile
        isOpen={isPreviewOpen}  // FileManager 管理的预览框的状态开关

        // 回调FileManager.tsx里的setIsPreviewOpen，状态更新
        // <FilePreviewDialog>组件定义了回调函数是onclose:()=>void（不带参数，也无返回值）,实现由父组件提供。
        onClose={() => setIsPreviewOpen(false)}  
      />
    </div>
  );
}