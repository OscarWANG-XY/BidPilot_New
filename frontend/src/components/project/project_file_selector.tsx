import { useState } from "react"
import { FileUpload } from "@/components/ui_own/upload"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { File, Check } from "lucide-react"
import { useFiles } from "@/hooks/useFiles"

interface ProjectFileSelectorProps {
  projectId: string;
  onFileSelect: (files: Array<{ id: string; fileName: string }>) => void;
}

export function ProjectFileSelector({ projectId, onFileSelect }: ProjectFileSelectorProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const { files, isLoading } = useFiles("all"); // 获取所有文件

  // 处理文件上传完成
  const handleFileUpload = (file: File) => {
    // 自动选中新上传的文件
    setSelectedFiles(prev => new Set(prev).add(file.id));
  };

  // 处理文件选择
  const handleFileToggle = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  // 确认选择
  const handleConfirmSelection = () => {
    const selectedFileObjects = files
      .filter(file => selectedFiles.has(file.id))
      .map(file => ({
        id: file.id,
        fileName: file.fileName
      }));
    onFileSelect(selectedFileObjects);
  };

  return (
    <div className="space-y-6">
      {/* 上传新文件区域 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">上传新文件</h3>
        <FileUpload 
          projectId={projectId} 
          onFileUpload={handleFileUpload}
        />
      </div>

      {/* 选择已有文件区域 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">从已有文件中选择</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>选择</TableHead>
              <TableHead>文件名</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>上传时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow 
                key={file.id}
                className="cursor-pointer"
                onClick={() => handleFileToggle(file.id)}
              >
                <TableCell>
                  {selectedFiles.has(file.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </TableCell>
                <TableCell className="flex items-center">
                  <File className="mr-2 h-4 w-4" />
                  {file.fileName}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    file.status === '已通过' ? 'secondary' :
                    file.status === '已驳回' ? 'destructive' : 'default'
                  }>
                    {file.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(file.uploadTime).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleConfirmSelection}
            disabled={selectedFiles.size === 0}
          >
            确认选择 ({selectedFiles.size})
          </Button>
        </div>
      </div>
    </div>
  );
}
