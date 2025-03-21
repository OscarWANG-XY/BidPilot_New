import React, { useState } from 'react'
import { TenderFileUpload } from './_01_TenderFileupload_v2'
import { DocxExtractionTask } from './_02_DocxExtractionTask_v2'
import { DocxTreeBuildTask } from './_03_DocxTreeBuildTask_v2'
import { TaskStatus } from '@/types/projects_dt_stru/projectTasks_interface'

interface TenderAnalysisPageProps {
  projectId: string
}

export const TenderAnalysisPage: React.FC<TenderAnalysisPageProps> = ({ projectId }) => {
  // 只保留需要在父组件层面协调的状态
  const [fileUploadStatus, setFileUploadStatus] = useState<TaskStatus>(TaskStatus.NOT_STARTED)
  const [extractionTaskStatus, setExtractionTaskStatus] = useState<TaskStatus>(TaskStatus.NOT_STARTED)
  
  // 简化的状态处理函数
  const handleFileUploadStateChange = (status: TaskStatus) => {
    console.log('File upload task status updated:', status)
    setFileUploadStatus(status)
  }
  
  const handleExtractionStateChange = (status: TaskStatus) => {
    console.log('Extraction task status updated:', status)
    setExtractionTaskStatus(status)
  }
  
  // 导航处理函数
  const handleNavigateToExtractionTask = () => {
    console.log('Navigating to extraction task')
    const extractionElement = document.getElementById('extraction-task-section')
    if (extractionElement) {
      extractionElement.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  const handleNavigateToTreeTask = () => {
    console.log('Navigating to tree building task')
    const treeElement = document.getElementById('tree-task-section')
    if (treeElement) {
      treeElement.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  // 未来可考虑添加进度指示器。
  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">招标文件分析</h1>
      
      {/* File Upload Task */}
      <div id="upload-task-section">
        <TenderFileUpload 
          projectId={projectId}
          isEnabled={true}
          onStateChange={handleFileUploadStateChange}
          onNavigateToNextTask={handleNavigateToExtractionTask}    // 回调让页面滑动到提取任务
        />
      </div>
      
      {/* Document Extraction Task */}
      <div id="extraction-task-section">
        <DocxExtractionTask 
          projectId={projectId}
          isEnabled={fileUploadStatus === TaskStatus.COMPLETED}  // 文件上传任务完成后，让该组件渲染启动，这样就显示手动启动的按钮
          onStatusChange={handleExtractionStateChange}
          onNavigateToNextTask={handleNavigateToTreeTask}     // 回调让页面滑动到下一个任务
        />
      </div>
      
      {/* Document Tree Building Task */}
      <div id="tree-task-section">
        <DocxTreeBuildTask 
          projectId={projectId}
          isEnabled={extractionTaskStatus === TaskStatus.COMPLETED}
        />
      </div>
    </div>
  )
}