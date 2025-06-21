// ================================ 容器组件层 ================================
import React from 'react';
import { useProjects } from '@/_hooks/useProjects'; // 假设这是您的 hook 路径
import { ProjectFileBusiness } from './ProjectFileBusiness';
import { TenderFile } from './schema';

export interface ProjectFileManagerProps {
  projectId: string;
}

const ProjectFileManagerContainer: React.FC<ProjectFileManagerProps> = ({ projectId }) => {
  const { 
    tenderFileQuery, 
    uploadTenderFile, 
    deleteTenderFile,
    downloadTenderFile,
    checkTenderFileExist,
    refreshFileExist
  } = useProjects();

  // 检查文件是否存在
  const { 
    data: fileExistData, 
    isLoading: isCheckingExist,
    error: checkError 
  } = checkTenderFileExist(projectId, 'tender_file');

  const fileExists = fileExistData?.exists || false;

  // 只有在文件存在时才查询文件详细信息
  const { 
    data: tenderFileData, 
    isLoading: isLoadingFileData, 
    error: queryError 
  } = tenderFileQuery(projectId, fileExists);

  // 如果是404错误且文件应该不存在，忽略错误
  const shouldIgnoreError = queryError?.message?.includes('404') && !fileExists;
  const error = shouldIgnoreError ? null : (checkError?.message || queryError?.message || null);

  // 将 API 返回的文件数据转换为 TenderFile 格式
  const convertToTenderFile = (fileData: any): TenderFile | null => {
    if (!fileData) return null;

    // 添加调试日志
    console.log('原始文件数据:', fileData);
    console.log('upload_date 值:', fileData.uploadDate);
    console.log('upload_date 类型:', typeof fileData.uploadDate);

    
    const convertedFile = {
      id: projectId, // 使用 projectId 作为 id
      fileName: fileData.filename,
      fileSize: fileData.size,
      uploadTime: fileData.uploadDate,
      fileUrl: fileData.presignedUrl || fileData.url // 优先使用 presigned_url，回退到 url
    };
    
    console.log('转换后的文件数据:', convertedFile);
    
    return convertedFile;
  };

  const tenderFile = convertToTenderFile(tenderFileData);

  const handleUpload = async (file: File) => {
    try {
      await uploadTenderFile({ projectId, file });
      // 上传成功后重新检查文件存在性
      refreshFileExist(projectId, 'tender_file');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '上传失败');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTenderFile(projectId);
      // 删除成功后重新检查文件存在性（这个函数现在会同时清除两个缓存）
      refreshFileExist(projectId, 'tender_file');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '删除失败');
    }
  };

  // 改进的下载处理函数 - 使用API层的下载功能
  const handleDownload = async () => {
    if (!tenderFile?.fileName) {
      console.error('文件名缺失');
      return;
    }

    try {
      console.log('开始下载文件:', tenderFile.fileName);
      await downloadTenderFile({ 
        projectId, 
        fileName: tenderFile.fileName 
      });
      console.log('文件下载完成');
    } catch (error) {
      console.error('下载文件时出错:', error);
      // 可以在这里添加用户友好的错误提示
    }
  };

  // 计算总的加载状态
  const isLoading = isCheckingExist || (fileExists && isLoadingFileData);

  return (
    <ProjectFileBusiness
      tenderFile={fileExists ? tenderFile : null}
      isLoading={isLoading}
      error={error}
      onUpload={handleUpload}
      onDelete={handleDelete}
      onDownload={tenderFile?.fileUrl ? handleDownload : undefined}
    />
  );
};

// ================================ 导出 ================================
export default ProjectFileManagerContainer;
