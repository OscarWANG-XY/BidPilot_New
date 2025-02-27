import { useRef, useEffect, memo } from "react";  // 添加 useRef, useEffect, and memo
import { FileRecord } from "@/types/files_dt_stru";  // 文件数据接口
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";  // 表格ui组件  
import { Button } from "@/components/ui/button";  // 按钮ui组件
import { Checkbox } from "@/components/ui/checkbox";
import { File, Trash2, Eye } from "lucide-react";  // 图标组件
import { formatFileSize } from "./FileHelpers";  // 辅助函数 - 计算文件大小


// 定义FileTable的props类型
interface FileTableProps {
  //在_FileManager.tsx里引用了useFiles.ts里的files作为输入
  files: FileRecord[];   
  // 父组件_FileManager.tsx的回调函数是handleDelete, 这里fileId作为回调函数的参数输入
  onDelete: (fileId: string) => void;   
  // 父组件_FileManager.tsx的回调函数是handlePreview, 这里file作为回调函数的参数输入
  onPreview: (file: FileRecord) => void;
  
  isDeleting: boolean;  // 父组件FileManager.tsx的isDeleting作为输入

  // 添加批量选择相关props
  selectedFiles: string[];
  onSelectFiles: (fileIds: string[]) => void;

  showProjectInfo?: boolean; // 新增属性，控制是否显示项目信息
}


//========================= FileTable.tsx 文件表格模块 done check! ========================= 
// 作为渲染组件，没有逻辑处理函数，也没有引入状态管理 （对比_FileManger.tsx）
export const FileTable = memo(function FileTable({ 
  files, 
  onDelete, 
  onPreview, 
  isDeleting,
  selectedFiles,
  onSelectFiles,
  showProjectInfo = false
}: FileTableProps) {

  console.log("🔄 [FileTable.tsx] 渲染");

  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

  // 处理单个文件的选择/取消选择
  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      onSelectFiles([...selectedFiles, fileId]);
    } else {
      onSelectFiles(selectedFiles.filter(id => id !== fileId));
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    onSelectFiles(checked ? files.map(file => file.id) : []);
  };

  // 计算选中状态
  const isAllSelected = files.length > 0 && selectedFiles.length === files.length;
  const isIndeterminate = selectedFiles.length > 0 && selectedFiles.length < files.length;

  // 使用 useEffect 设置 indeterminate 状态
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const inputElement = selectAllCheckboxRef.current.querySelector('input');
      if (inputElement) {
        inputElement.indeterminate = isIndeterminate;
      }
    }
  }, [isIndeterminate]);

  return (
    <div className="w-full rounded-lg border shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[40px] px-4">
              <Checkbox
                ref={selectAllCheckboxRef}
                checked={isAllSelected}
                onCheckedChange={(checked) => handleSelectAll(checked === true)}
                aria-label="Select all files"
              />
            </TableHead>
            <TableHead>文件名</TableHead>
            <TableHead>文件类型</TableHead>
            <TableHead>大小</TableHead>
            <TableHead>上传时间</TableHead>
            {showProjectInfo && <TableHead>项目</TableHead>}
            <TableHead>查看</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {files.map((file) => {
            const isSelected = selectedFiles.includes(file.id);
            
            return (
              <TableRow
                key={file.id}
                data-state={isSelected ? "selected" : undefined}
                className={isSelected ? "bg-primary-50 hover:bg-primary-100" : "hover:bg-gray-50"}
              >
                <TableCell className="px-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => 
                      handleSelectFile(file.id, checked === true)
                    }
                    aria-label={`Select ${file.name}`}
                  />
                </TableCell>
                <TableCell className="flex items-center">
                  <File className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium truncate max-w-[200px]" title={file.name}>
                    {file.name}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{file.type}</TableCell>
                <TableCell className="text-muted-foreground">{formatFileSize(file.size)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {file.createdAt ? 
                    new Date(file.createdAt).toLocaleString('zh-CN') 
                    : 'N/A'
                  }
                </TableCell>
                {showProjectInfo && (
                  <TableCell className="text-muted-foreground">{file.project_id || 'N/A'}</TableCell>
                )}
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onPreview(file)}
                    className="hover:bg-gray-100"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">预览文件</span>
                  </Button>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(file.id)}
                    disabled={isDeleting}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">删除文件</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});
