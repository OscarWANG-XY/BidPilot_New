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
}


//========================= FileTable.tsx 文件表格模块 done check! ========================= 
// 作为渲染组件，没有逻辑处理函数，也没有引入状态管理 （对比_FileManger.tsx）
export function FileTable({ files, onDelete, onPreview, isDeleting }: FileTableProps) {

  return (
    <Table>
      {/* --------- 表格头部 --------- */}
      <TableHeader>
        <TableRow>
          <TableHead>文件名</TableHead>
          <TableHead>文件类型</TableHead>
          <TableHead>大小</TableHead>
          <TableHead>上传时间</TableHead>
          <TableHead>查看</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
        </TableHeader>

      {/* --------- 表格主体 --------- */}
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id}>
            {/* 文件名 */}
            <TableCell className="flex items-center">
              <File className="mr-2 h-4 w-4" />
              {file.name}
            </TableCell>
            {/* 文件类型 */}
            <TableCell>{file.type}</TableCell>
            {/* 文件大小 */}
            <TableCell>{formatFileSize(file.size)}</TableCell>
            {/* 上传时间 */}
            <TableCell>{new Date(file.createdAt).toLocaleString()}</TableCell>
            {/* 预览按钮 */}
            <TableCell>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onPreview(file)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
            {/* 删除按钮 */}
            <TableCell>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(file.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
