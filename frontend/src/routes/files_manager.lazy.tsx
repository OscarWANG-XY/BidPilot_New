import { createLazyFileRoute } from '@tanstack/react-router'
import { FileManager } from "@/components/files/_FileManager"

export const Route = createLazyFileRoute('/files_manager')({
  component: RouteComponent,
})

function RouteComponent() {

  const handleFileUpload = (file: File) => {
    console.log('File uploaded successfully:', file);
    // 例如：更新文件列表
    // setFiles(prevFiles => [...prevFiles, file]);
    // 或者触发其他操作
    // updateProjectStatus();
  }

  return(
    <div>
        <FileManager onFileUpload={handleFileUpload}
      />
    </div>
  )


}
