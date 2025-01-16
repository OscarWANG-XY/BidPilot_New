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
import { Upload, File, Trash2 } from "lucide-react"
import { useFiles } from "@/hooks/useFiles"
import { useToast } from "@/hooks/use-toast"

// 定义FileUpload组件的props，使得TypeScript检查是否传入了正确的参数。
interface FileUploadProps {
  onFileUpload: (file: File) => void;  // 明确定义回调函数的参数类型
}


// ================================ 文件上传组件 ============================================ 
export function FileUpload({onFileUpload }: FileUploadProps) {
//                          onFileUpload是回调函数，父函数（这里是company.lazy.tsx）

  // 获取useToast的toast功能
  const { toast } = useToast();

  // 获取useFiles的相关功能
  const {
    files,
    isLoading,
    uploadFile,
    deleteFile,
    isUploading,
    isDeleting
  } = useFiles();


  // ------------- 文件上传处理 (done check!) ------------- 
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //                              检查是否Input事件触发，一旦有触发箭头函数执行  
    // 检查是否有文件被选择，
    if (!e.target.files?.length) return;


    // 获取文件对象， <HTMLInputElement> 默认允许单文件选择，所以【0】能满足文件获取
    // 注意： 文件对象是File类型，这个类型是浏览器自带，通过 <input type="file" /> 元素选择文件时自动创建
    // 文件对象包含.name、.type、.size、.lastModified （时间戳），lastModifiedDate （日期），.webkitRelativePath （文件路径）
    const file = e.target.files[0];


    // 调试 3：观察file对象的名字，类型，和大小 
    console.log('Original file object:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    


    try {

      // 文件类型检查 
      // 先定义了allowTypes的类型，然后用includes方法检查file.type是否在allowTypes中
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {

        // 用toast函数显示'文件类型'错误信息 
        toast({
          title: "不支持的文件类型",
          description: "请上传 PDF 或 Word 文档",
          variant: "destructive",
        });
        return;
      }
      
      // 检查文件大小
      if (file.size > 10 * 1024 * 1024) {
        // 用toast函数显示'文件大小'错误信息 
        toast({
          title: "文件过大",
          description: "请选择小于10MB的文件",
          variant: "destructive",
        });
        return;
      }
      

      // 调用useFiles的uploadFile来上传文件，通过onSuccess和onError来处理上传成功和失败的情况 （不是返回promise对象）
      // 如果上传成功，则调用onFileUpload(file)，如果上传失败，则调用onError(error)
      uploadFile(file, {

        onSuccess: () => {  
          // 上传成功后，调用onFileUpload(file)，是父组件调用本组件时传入的回调函数参数，在父组件执行逻辑操作。 
          // 这种用法，让父组件基于上传成功，采取相应行动。 
          onFileUpload(file);  //目前的用法时告知成功上传，所以没有实际用处，因为已经有toast
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

      //虽然已经用了toast，我们还是需要catch(error)来捕捉代码里未预期的任务。
      //error的信息通过console 和 toast 返回。
    } catch (error) {
      console.error('File handling error:', error);
      toast({
        title: "处理失败",
        description: "文件处理过程中出现错误",
        variant: "destructive",
      });
    }
  };

  // -------------- 文件删除处理（done check!） --------------   
  const handleDelete = (fileId: string) => {
    // 在下面的return(table)渲染中，fileId作为输入参数。
    // 调用了useFiles的deleteFile来删除文件，通过onSuccess和onError来处理删除成功和失败的情况 （不是返回promise对象）
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


  // --------------- 辅助功能： 格式化文件大小，转为KB,MB,GB等易读形式 --------------- 
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };





// --------------- UI渲染部分 --------------- 
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

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
            <TableHead>文件类型</TableHead>
            <TableHead>大小</TableHead>
            <TableHead>上传时间</TableHead>
            <TableHead>查看</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="flex items-center">
                <File className="mr-2 h-4 w-4" />
                {file.name}
              </TableCell>
              <TableCell>{file.type}</TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>{new Date(file.createdAt).toLocaleString()}</TableCell>
              <TableCell> 未配置功能 </TableCell>
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
