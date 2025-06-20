import React, { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Upload, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { toast } from '@/_hooks/use-toast'
import { FileManager } from '@/components/files/_FileManager'
import { useFiles } from '@/_hooks/useFiles'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'

// 组件props类型定义
interface TenderFileUploadProps {
  projectId: string
  isEnabled?: boolean
  isLocked?: boolean  // 外部控制是否锁定
  onSubmit?: (hasValidFile: boolean) => void  // 提交时的回调
}

export const TenderFileUpload: React.FC<TenderFileUploadProps> = ({ 
  projectId, 
  isEnabled = true,
  isLocked = false,
  onSubmit,
}) => {
  // 组件内部状态 - 使用简单的useState
  const [isNavigating, setIsNavigating] = useState(false)  //跟踪异步操作的进行状态。 
  const [fileManagerKey, setFileManagerKey] = useState(0)

  // 获取文件数据
  const { refetch: refreshFiles, files } = useFiles(projectId)

  // 分析文件状态
  const docxFiles = useMemo(() => {
    return files.filter(file => 
      file.name.toLowerCase().endsWith('.docx') || 
      file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  }, [files])

  const hasDocxFile = docxFiles.length > 0
  const hasExactlyOneDocxFile = docxFiles.length === 1

  // 检查文件上传是否允许
  const handleFileUpload = (file: File): boolean => {
    // 检查组件是否被锁定
    if (isLocked) {
      toast({
        title: "操作被锁定",
        description: "组件已被锁定，无法修改上传的文件",
        variant: "destructive"
      })
      return false
    }

    // 检查文件类型
    const isDocxFile = file.name.toLowerCase().endsWith('.docx') || 
                      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    
    if (!isDocxFile) {
      toast({
        title: "文件类型错误",
        description: "只允许上传Word文档(.docx)文件",
        variant: "destructive"
      })
      return false
    }
    
    // 检查是否已有docx文件
    if (hasDocxFile) {
      toast({
        title: "已存在文档",
        description: "项目已有Word文档，请先删除现有文档再上传新文档",
        variant: "destructive"
      })
      return false
    }
    
    console.log('File validation passed, proceeding with upload:', file)
    return true
  }

  // 文件上传成功后刷新文件列表
  const handleUploadSuccess = async () => {
    console.log('File uploaded successfully, refreshing file list')
    await refreshFiles()
  }
  
  // 检查文件删除是否允许
  const handleDeleteCheck = () => {
    if (isLocked) {
      toast({
        title: "操作被锁定",
        description: "组件已被锁定，无法删除上传的文件",
        variant: "destructive"
      })
      return false
    }
    return true
  }

  // 文件删除成功后重置文件管理器
  const handleDeleteSuccess = () => {
    setFileManagerKey(prev => prev + 1)
  }
  
  // 文件加载状态变化处理（占位函数）
  const handleLoadingChange = (loading: boolean) => {
    console.log('Files loading state changed:', loading)
  }

  // 处理确认提交
  const handleSubmit = async () => {
    console.log("'确认提交'按钮被点击")

    if (!hasExactlyOneDocxFile) {
      toast({
        title: "文件要求",
        description: "需要上传且只能上传一个招标文件才能提交",
        variant: "destructive"
      })
      return
    }

    setIsNavigating(true)
    console.log("开始提交流程")
    
    try {
      // 调用外部提交回调
      if (onSubmit) {
        await onSubmit(hasExactlyOneDocxFile)
      }
      
      toast({
        title: "提交成功",
        description: "文件已成功提交",
        variant: "default"
      })
      
    } catch (error) {
      console.error('提交失败:', error)
      toast({
        title: "提交失败",
        description: "提交失败，请稍后重试",
        variant: "destructive"
      })
    } finally {
      setIsNavigating(false)
    }
  }

  // 根据锁定状态设置卡片样式
  const cardClassName = isLocked 
    ? "mb-6 border-green-400 border-2 bg-green-50"
    : "mb-6 border-blue-400 border-2 bg-blue-50"

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Upload className="h-5 w-5 mr-2" />
          上传招标文件
          {isLocked && (
            <span title="此组件已锁定">
              <Lock className="h-4 w-4 ml-2 text-gray-500" />
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isEnabled ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              请上传招标文件（仅支持.docx格式），系统将自动分析文件内容，为后续阶段提供支持。
              {isLocked && <span className="text-amber-600 ml-1">组件已锁定，无法修改文件。</span>}
            </p>
            
            {hasDocxFile && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
                <p className="text-sm text-amber-800">
                  {isLocked 
                    ? "文件已锁定。组件已被锁定，无法修改文件。" 
                    : "已上传Word文档。如需更新，请先删除现有文档再上传新文档。"}
                </p>
              </div>
            )}

            <FileManager 
              key={`file-manager-${fileManagerKey}`}
              projectId={projectId} 
              acceptedFileTypes=".docx"
              allowMultiple={false}
              readOnly={isLocked}
              onFileUpload={handleFileUpload} 
              onUploadSuccess={handleUploadSuccess}
              onDeleteCheck={handleDeleteCheck}
              onDeleteSuccess={handleDeleteSuccess}
              onLoadingChange={handleLoadingChange}
            />
            
            {!isLocked && hasExactlyOneDocxFile && (
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleSubmit}
                  disabled={isNavigating || isLocked}
                > 
                  确认提交     
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <Alert variant="default">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>任务未激活</AlertTitle>
            <AlertDescription>
              请先完成前置任务
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default TenderFileUpload