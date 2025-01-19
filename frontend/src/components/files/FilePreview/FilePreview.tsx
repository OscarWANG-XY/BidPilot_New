import { PDFPreview } from '@/components/files/FilePreview/PDFPreview';
//import PDFViewer from '@/components/preview/PDFPreview2';
import { DocxPreview } from '@/components/files/FilePreview/DocxPreview';


//------- 定义组件的props  ---------
interface FilePreviewProps {
  fileUrl: string;   // 文件的URL
  fileType: string;  // 文件的类型 与 files_dt_stru.ts里的要一致。 
}


//===========================  FilePreview组件  ==============================
// {fileUrl, fileType}:FilePreviewProps是结构赋值语法，表示从FilePreviewProps对象中，提取fileUrl和fileType属性
export function FilePreview({ fileUrl, fileType }: FilePreviewProps) {

  // 定义一个函数，用于根据文件类型渲染不同的预览组件
  const renderPreview = () => {  
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <PDFPreview url={fileUrl} />;
      case 'word':
        return <DocxPreview url={fileUrl} />;
      default:
        return <div>不支持的文件类型</div>;
    }
  };

  console.log('fileType:', fileType);
  // 渲染组件
  return (
    <div className="w-full h-full min-h-[500px] border rounded-lg overflow-hidden">
      {renderPreview()}
    </div>
  );
} 