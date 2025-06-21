// ================================ 业务组件层 ================================
import React, { useState } from 'react';
import { FileDisplayUI } from './FileDisplayUI';
import { FileUploadUI } from './FileUploadUI';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TenderFile } from './schema';


interface ProjectFileBusinessProps {
  tenderFile: TenderFile | null;
  isLoading: boolean;
  error: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  onDownload?: () => void;
}

export const ProjectFileBusiness: React.FC<ProjectFileBusinessProps> = ({
  tenderFile,
  isLoading,
  error,
  onUpload,
  onDelete,
  onDownload
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // 短暂延迟显示完成状态
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '上传失败');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
    } catch (err) {
      console.error('删除文件失败:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 如果有文件，显示文件信息
  if (tenderFile) {
    return (
      <FileDisplayUI
        file={tenderFile}
        onDelete={handleFileDelete}
        onDownload={onDownload}
        isDeleting={isDeleting}
      />
    );
  }

  // 没有文件，显示上传组件
  return (
    <FileUploadUI
      onFileSelect={handleFileUpload}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
      error={uploadError || undefined}
    />
  );
};
