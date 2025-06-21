import React, { useState } from 'react';
import { File, Trash2, 
  // Download, 
  FileText, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { FilePreview } from '@/components/files/FilePreview/FilePreview';
import { TenderFile } from './schema';

interface FileDisplayUIProps {
  file: TenderFile;
  onDelete: () => void;
  onDownload?: () => void;
  isDeleting?: boolean;
}

export const FileDisplayUI: React.FC<FileDisplayUIProps> = ({ 
  file, 
  onDelete, 
  // onDownload, 
  isDeleting = false 
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  console.log('FileDisplayUI file', file);

  // 将文件扩展名转换为 FilePreview 组件所需的 fileType
  const getFileTypeFromExtension = (extension: string): string => {
    const ext = extension.toLowerCase().replace('.', '');
    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'doc':
      case 'docx':
        return 'word';
      case 'xls':
      case 'xlsx':
        return 'excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
        return 'image';
      default:
        return 'other';
    }
  };

  // 检查文件是否支持预览
  const isPreviewSupported = (extension: string): boolean => {
    const supportedTypes = ['pdf', 'doc', 'docx'];
    const ext = extension.toLowerCase().replace('.', '');
    return supportedTypes.includes(ext);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      // 确保日期字符串有效
      if (!dateString) {
        return '未知时间';
      }
      
      const date = new Date(dateString);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString);
        return '无效日期';
      }
      
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return '日期格式错误';
    }
  };

  const fileType = getFileTypeFromExtension(file.extension);
  const canPreview = isPreviewSupported(file.extension);
  const previewUrl = file.presignedUrl || file.url;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          招标文件
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-blue-500" />
            <div>
              <p className="font-medium">{file.filename}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canPreview && previewUrl && (
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    预览
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>{file.filename}</DialogTitle>
                    <DialogDescription>
                      
                    </DialogDescription>
                  </DialogHeader>
                  <div className="h-[60vh]">
                    <FilePreview 
                      fileUrl={previewUrl} 
                      fileType={fileType} 
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {/* TODO： 下载功能暂时隐藏， 因为还未解决下载的docx是乱码的问题 */}
            {/* {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                下载
              </Button>
            )} */}
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? '删除中...' : '删除'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};