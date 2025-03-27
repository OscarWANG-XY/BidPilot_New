import React, { useState, useEffect } from 'react';
import { useOutlineAnalysisStream } from '@/hooks/useOutlineAnalysisStream';
import { TaskStatus } from '@/types/projects_dt_stru/projectTasks_interface';
import { StageType } from '@/types/projects_dt_stru/projectStage_interface';
import { Button, Spin, Alert, Space, Typography, Card, Progress } from 'antd';
import { CheckCircleOutlined, SyncOutlined, WarningOutlined, LoadingOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface OutlineAnalysisStreamingProps {
  projectId: string;
  stageType: StageType;
}

export const OutlineAnalysisStreaming: React.FC<OutlineAnalysisStreamingProps> = ({ projectId, stageType }) => {
  const {
    streamId,
    streamContent,
    isStreaming,
    streamError,
    streamComplete,
    streamStatus,
    streamResult,
    startStream,
    stopStreaming,
    isStartingStream,
    outlineAnalysisTaskQuery,
  } = useOutlineAnalysisStream(projectId, stageType);

  const { data: taskData, isLoading: isLoadingTask } = outlineAnalysisTaskQuery(projectId, stageType);
  
  // State for tracking animation
  const [animate, setAnimate] = useState(false);
  
  // Format the stream content for display with line breaks
  const formattedContent = streamContent.replace(/\n/g, '<br>');
  
  // Add animation effect when new content arrives
  useEffect(() => {
    if (isStreaming) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
  }, [streamContent, isStreaming]);
  
  // Calculate progress based on estimation (very rough)
  const calculateProgress = () => {
    if (!isStreaming) {
      return streamComplete ? 100 : 0;
    }
    
    // Rough estimation based on content length
    // Adjust these values based on your average output size
    const estimatedTotalLength = 5000; 
    const progress = Math.min(Math.round((streamContent.length / estimatedTotalLength) * 100), 99);
    return progress;
  };
  
  // Get status display
  const getStatusDisplay = () => {
    if (isStartingStream) return '启动中...';
    if (isStreaming) return '分析进行中...';
    if (streamComplete) return '分析完成';
    if (streamError) return '分析出错';
    if (taskData?.status === TaskStatus.COMPLETED) return '已完成';
    if (taskData?.status === TaskStatus.FAILED) return '任务失败';
    return '准备就绪';
  };
  
  // Get status icon
  const getStatusIcon = () => {
    if (isStartingStream || isStreaming) return <SyncOutlined spin />;
    if (streamComplete || taskData?.status === TaskStatus.COMPLETED) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (streamError || taskData?.status === TaskStatus.FAILED) return <WarningOutlined style={{ color: '#f5222d' }} />;
    return null;
  };
  
  return (
    <Card 
      title={
        <Space>
          <Title level={4}>文档大纲分析</Title>
          {getStatusIcon()}
          <Text type="secondary">{getStatusDisplay()}</Text>
        </Space>
      }
      extra={
        <Space>
          {!isStreaming && !streamComplete && !streamError && (
            <Button 
              type="primary" 
              onClick={() => startStream()} 
              loading={isStartingStream}
              disabled={isLoadingTask || taskData?.status === TaskStatus.COMPLETED}
            >
              开始分析
            </Button>
          )}
          {isStreaming && (
            <Button danger onClick={stopStreaming}>
              停止分析
            </Button>
          )}
        </Space>
      }
    >
      {isLoadingTask && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin tip="加载任务信息..." />
        </div>
      )}
      
      {streamError && (
        <Alert
          message="分析过程中出错"
          description={streamError}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      
      {isStreaming && (
        <Progress 
          percent={calculateProgress()} 
          status="active" 
          style={{ marginBottom: '16px' }}
        />
      )}
      
      <div 
        className={`stream-content ${animate ? 'animate-new-content' : ''}`}
        style={{ 
          border: '1px solid #f0f0f0', 
          borderRadius: '4px',
          padding: '16px',
          minHeight: '300px',
          maxHeight: '600px',
          overflowY: 'auto',
          backgroundColor: '#fafafa',
          whiteSpace: 'pre-wrap',
          transition: 'background-color 0.3s'
        }}
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
      
      {streamStatus && !isStreaming && (
        <div style={{ marginTop: '16px' }}>
          <Text type="secondary">
            流ID: {streamId} | 
            状态: {streamStatus.status} | 
            模型: {streamStatus.model || 'N/A'}
          </Text>
        </div>
      )}
      
      <style jsx>{`
        .animate-new-content {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </Card>
  );
};