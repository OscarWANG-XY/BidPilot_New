import React from 'react';
import MarkdownEditor from '../../MarkdownEditor/MarkdownEditor';

export interface AnalysisPanelProps {
  // Streaming related props
  streamContent: string;
  isStreaming: boolean;
  streamError: string | null;
  streamComplete: boolean;
  streamStatus: any;
  streamResult: any;
  isStartingStream: boolean;
  
  onTerminateAnalysis: () => Promise<void>;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  streamContent,
  isStreaming,
  streamError,
  streamComplete,
  streamStatus,
  streamResult,
  isStartingStream,
  onTerminateAnalysis
}) => {
  // Check if analysis is running (this assumes task state management is handled elsewhere)
  const isAnalysisRunning = isStreaming || isStartingStream;
  
  // Display content: prefer streamResult.content for analysis results, fallback to streamContent
  const displayContent = streamResult?.content || streamContent || '';

  // Determine if content is being updated
  const isContentStreaming = isStreaming || isStartingStream;

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Error message display */}
      {streamError && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          <p className="font-medium">分析过程中出现错误:</p>
          <p>{streamError}</p>
        </div>
      )}

      {/* Streaming status indicator */}
      {isContentStreaming && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md flex items-center">
          <div className="animate-pulse mr-2 h-3 w-3 bg-blue-500 rounded-full"></div>
          <span>正在生成分析结果...</span>
        </div>
      )}

      {/* Content display area */}
      <div className="flex-grow">
        <MarkdownEditor
          content={displayContent}
          readOnly={true}
          isStreaming={isContentStreaming}
          minHeight="300px"
          className="w-full"
        />
      </div>
      
      {/* Control area and resource metrics */}
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
        {/* Stop analysis button */}
        <div>
          {isAnalysisRunning && (
            <button
              onClick={onTerminateAnalysis}
              disabled={!isAnalysisRunning}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              停止分析
            </button>
          )}
        </div>
        
        {/* Resource usage metrics */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex flex-col">
            <span className="font-medium">Tokens 使用量</span>
            <span>{streamStatus?.metadata?.tokens || 0}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">运行时间</span>
            <span>{streamStatus?.metadata?.runTime || '0s'}</span>
          </div>
          {/* Stream status indicator */}
          {streamStatus && (
            <div className="flex flex-col">
              <span className="font-medium">状态</span>
              <span className={`${streamComplete ? 'text-green-600' : 'text-blue-600'}`}>
                {streamComplete ? '已完成' : streamStatus.status || '处理中'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;