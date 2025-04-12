import React, { useState } from 'react'
import { TenderFileUpload } from './TenderFileUpload/TenderFileupload'
import { DocxExtractionTask } from './DocxExtractionTask/DocxExtractionTask'
// import { DocOutlineAnalysisTask } from './_03_OutlineAnalysisTask'
import { TaskStatus, TaskLockStatus } from '@/_types/projects_dt_stru/projectTasks_interface'
import { OutlineAnalysisStreamingView } from '@/components/projects/TenderAnalysis/OutlineAnalysisTask/OutlineAnalysisStreamingView'
import TaskContainer from '@/components/Task/TaskContainer'
import { StageType } from '@/_types/projects_dt_stru/projectStage_interface'
import { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface'
interface TenderAnalysisPageProps {
  projectId: string
}

export const TenderAnalysisPage: React.FC<TenderAnalysisPageProps> = ({ projectId }) => {
  // 只保留需要在父组件层面协调的状态
  const [fileUploadStatus, setFileUploadStatus] = useState<TaskStatus>(TaskStatus.NOT_STARTED)
  const [extractionTaskLockStatus, setExtractionTaskLockStatus] = useState<TaskLockStatus>(TaskLockStatus.UNLOCKED)
  const [outlineAnalysisTaskLockStatus, setOutlineAnalysisTaskLockStatus] = useState<TaskLockStatus>(TaskLockStatus.UNLOCKED)

  // 简化的状态处理函数
  const handleFileUploadStateChange = (status: TaskStatus) => {
    console.log('File upload task status updated:', status)
    setFileUploadStatus(status)
  }
  
  const handleExtractionStateChange = (lockStatus: TaskLockStatus) => {
    console.log('Extraction task status updated:', lockStatus)
    setExtractionTaskLockStatus(lockStatus)
  }

  const handleOutlineAnalysisStateChange = (lockStatus: TaskLockStatus) => {
    console.log('Outline analysis task status updated:', lockStatus)
    setOutlineAnalysisTaskLockStatus(lockStatus)
  }
  
  // 导航处理函数
  const handleNavigateToExtractionTask = () => {
    console.log('Navigating to extraction task')
    const extractionElement = document.getElementById('extraction-task-section')
    if (extractionElement) {
      extractionElement.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  const handleNavigateToOutlineAnalysisTask = () => {
    console.log('Navigating to outline analysis task')
    const outlineElement = document.getElementById('outline-task-section')
    if (outlineElement) {
      outlineElement.scrollIntoView({ behavior: 'smooth' })
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
          onNavigateToNextTask={handleNavigateToOutlineAnalysisTask}     // 回调让页面滑动到下一个任务
        />
      </div>

      
      {/* Document Extraction Task */}
      <div id="extraction-task-section">
        <TaskContainer
          projectId={projectId}
          isEnabled={true}
          stageType={StageType.TENDER_ANALYSIS}
          taskType={TaskType.OUTLINE_ANALYSIS_TASK}
          // isEnabled={fileUploadStatus === TaskStatus.COMPLETED}  // 文件上传任务完成后，让该组件渲染启动，这样就显示手动启动的按钮
          // onStatusChange={handleExtractionStateChange}
          // onNavigateToNextTask={handleNavigateToOutlineAnalysisTask}     // 回调让页面滑动到下一个任务
        />
      </div>

      {/* Document Extraction Task */}
      {/* <div id="extraction-task-section">
        <OutlineAnalysisStreamingView
          projectId={projectId}
          stageType={StageType.TENDER_ANALYSIS}
          // isEnabled={fileUploadStatus === TaskStatus.COMPLETED}  // 文件上传任务完成后，让该组件渲染启动，这样就显示手动启动的按钮
          // onStatusChange={handleExtractionStateChange}
          // onNavigateToNextTask={handleNavigateToOutlineAnalysisTask}     // 回调让页面滑动到下一个任务
        />
      </div> */}

      
      {/* Document Outline Analysis Task */}
      {/* <div id="outline-task-section">
        <DocOutlineAnalysisTask 
          projectId={projectId}
          isEnabled={extractionTaskLockStatus === TaskLockStatus.LOCKED}  // 文件上传任务完成后，让该组件渲染启动，这样就显示手动启动的按钮
          onStatusChange={handleOutlineAnalysisStateChange}
          onNavigateToNextTask={handleNavigateToOutlineAnalysisTask}     // 回调让页面滑动到下一个任务
        />
      </div> */}
    </div>
  )
}