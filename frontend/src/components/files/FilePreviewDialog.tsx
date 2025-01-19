import { FileRecord } from "@/types/files_dt_stru";  // 数据接口文件类型
import { FilePreview } from "@/components/files/FilePreview/FilePreview";  // 文件预览组件
import { Button } from "@/components/ui/button";  // 按钮ui组件
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";  // 对话框ui组件
import { getPreviewFileName, isFileTypePreviewable } from "./FileHelpers";  // 预览相关的辅助函数



// ----------------------------- 文件预览对话框模型的props类型 ----------------------------- 
interface FilePreviewDialogProps {
  selectedfile: FileRecord | null;  // 输入一个文件，为FileRecord类型。
  isOpen: boolean;  // 输入对话框的开关状态，布尔类型。 

  // 这里定义了回调函数（不带参数，也无返回值），这样函数的具体实现则由父组件来提供。 
  // 父组件是_FileManager.tsx，定义了函数实现是： onClose={() => setIsPreviewOpen(false)}
  onClose: () => void;  
}


//========================= FilePreviewDialog.tsx 文件预览对话框模块 ========================= 
// 作为渲染组件，没有逻辑处理函数，也没有引入状态管理 （对比_FileManger.tsx）
export function FilePreviewDialog({ selectedfile, isOpen, onClose }: FilePreviewDialogProps) {

  // 如果selectedfile为空，不渲染任何内容
  if (!selectedfile) return null;

  // 渲染文件预览对话框
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
    {/* isOpen 和 onClose 分别对应父组件_FileManager.tsx里的[isPreviewOpen, setIsPreviewOpen] */}
      
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">

        {/* ----------- 对话框头部 --------- */}
        <DialogHeader>
          {/* 对话框标题，使用FileHelpers.ts里的getPreviewFileName函数获取文件名 */}
          <DialogTitle>{getPreviewFileName(selectedfile)}</DialogTitle>
        </DialogHeader>
        
        {/* ----------- 对话框内容 --------- */}
        <div className="flex-1 overflow-auto min-h-0">
          {/* 如果文件类型支持预览，则渲染FilePreview组件，否则渲染不支持预览的提示 */}
          {isFileTypePreviewable(selectedfile.type) ? (
            <FilePreview 
              fileUrl={selectedfile.url || ''} 
              fileType={selectedfile.type}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>此文件类型不支持预览</p>
            </div>
          )}
        </div>

        {/* ----------- 对话框底部 --------- */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
