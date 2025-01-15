import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, File, Trash2 } from "lucide-react"
import { useFiles } from "@/hooks/useFiles"
import { useToast } from "@/hooks/use-toast"

// 接受projectId作为参数, 用于标识文件所属的项目
interface FileUploadProps {
  projectId: string;
  onFileUpload: (file: File) => void;  // 明确定义回调函数的参数类型
}

export function FileUpload({ projectId, onFileUpload }: FileUploadProps) {
  const { toast } = useToast();
  // 使用useFiles获取文件管理相关功能
  const {
    files,
    isLoading,
    uploadFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useFiles(projectId);

  // 文件上传处理
    //关于onFileUpload对调函数的sequenceDiagram(工作原理流程图)
    // participant Parent as Company组件
    // participant Child as FileUpload组件
    // participant Server as 服务器
    // Parent->>Child: 传递handleFileUpload回调函数
    // Child->>Server: 上传文件
    // Server-->>Child: 返回上传成功
    // Child->>Parent: 调用onFileUpload(file)触发handleFileUpload
    // Note over Parent: 执行handleFileUpload中的逻辑<br>(如更新UI、状态等)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const file = e.target.files[0];



    console.log('Original file object:', {
      name: file.name,
      type: file.type,
      size: file.size
    });


    
    try {

      // 检查文件类型和大小
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "不支持的文件类型",
          description: "请上传 PDF 或 Word 文档",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "文件过大",
          description: "请选择小于10MB的文件",
          variant: "destructive",
        });
        return;
      }
      
      // 创建 FormData 时确保文件名编码正确
      const formData = new FormData();
      formData.append('file', file, file.name);


      uploadFile(file, {
        onSuccess: () => {
          onFileUpload(file);
          toast({
            title: "文件上传成功",
            description: `${file.name} 已成功上传`,
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
    } catch (error) {
      console.error('File handling error:', error);
      toast({
        title: "处理失败",
        description: "文件处理过程中出现错误",
        variant: "destructive",
      });
    }
  };

  // 文件删除处理
  const handleDelete = (fileId: string) => {
    deleteFile(fileId, {
      onSuccess: () => {
        toast({
          title: "文件已删除",
        });
      },
    });
  };

  // 辅助功能：格式化文件大小，转为KB,MB,GB等易读形式
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  // UI渲染部分

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          onChange={handleFileSelect}
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>文件名</TableHead>
            <TableHead>大小</TableHead>
            <TableHead>上传时间</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="flex items-center">
                <File className="mr-2 h-4 w-4" />
                {file.fileName}
              </TableCell>
              <TableCell>{formatFileSize(file.fileSize)}</TableCell>
              <TableCell>{new Date(file.uploadTime).toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={
                  file.status === '已通过' ? 'secondary' :
                  file.status === '已驳回' ? 'destructive' : 'default'
                }>
                  {file.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
