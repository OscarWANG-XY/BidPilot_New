import { Input } from "@/components/ui/input";  // 输入框ui组件
import { Button } from "@/components/ui/button";  // 按钮ui组件
import { Upload } from "lucide-react";  // 图标组件


interface FileUploadButtonProps {

  // 父组件_FileManager.tsx的回调函数是handleUpload, 这里file作为回调函数的参数输入（来自input）
  onFileSelect: (file: File) => void; 

  // 父组件传入的上传状态，如果在上传，下面的Input组件不能使用。
  isUploading: boolean;   
}

//========================= FileUploadButton.tsx 文件上传按钮模块 done check! ========================= 
// 作为渲染组件
// 有逻辑处理函数 handleChange
// 没有引入状态管理 （对比_FileManger.tsx）
export function FileUploadButton({ onFileSelect, isUploading }: FileUploadButtonProps) {
  console.log("🔄 [FileUploadButton.tsx] 渲染");


  // ------------ 用户文件输入处理逻辑 ------------
  // 逻辑函数，处理input的change事件（监听是否有用户上传文件）
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //                  检查是否Input事件触发，一旦有触发箭头函数执行 

    // 检查是否有文件被选择，如果没有，则返回
    if (!e.target.files?.length) return;

    // 获取第一个文件
    const file = e.target.files[0];

    // 调用父组件_FileManager.tsx的回调函数，将文件传递给父组件
    onFileSelect(file);
  };


  // ---------------- 上传按钮 渲染 ----------------------------
  return (
    <div className="flex items-center gap-4">
      <Input
        type="file"  // 输入类型为文件，浏览器自带的类型
        onChange={handleChange}
        className="hidden"
        id="file-upload"
        disabled={isUploading}
      />
      <label htmlFor="file-upload">
        <Button variant="outline" disabled={isUploading} asChild>
          <span>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                上传中...
              </>
            ) : (
              '选择文件'
            )}
          </span>
        </Button>
      </label>
    </div>
  );
}
