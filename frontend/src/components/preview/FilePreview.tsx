import { PDFPreview } from '@/components/preview/PDFPreview';
import { DocxPreview } from '@/components/preview/DocxPreview';

interface FilePreviewProps {
  fileUrl: string;
  fileType: string;
  fileName: string;
}

export function FilePreview({ fileUrl, fileType, fileName }: FilePreviewProps) {
  const renderPreview = () => {
    switch (fileType.toLowerCase()) {
      case 'application/pdf':
        return <PDFPreview url={fileUrl} />;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return <DocxPreview url={fileUrl} fileName={fileName} />;
      default:
        return <div>不支持的文件类型</div>;
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] border rounded-lg overflow-hidden">
      {renderPreview()}
    </div>
  );
} 