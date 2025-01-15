import { createLazyFileRoute } from '@tanstack/react-router'
import { FileUpload } from "@/components/ui_own/upload"


export const Route = createLazyFileRoute('/company')({
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
        <FileUpload 
            projectId="1"
            onFileUpload={handleFileUpload}
        />
    </div>
  )

}
