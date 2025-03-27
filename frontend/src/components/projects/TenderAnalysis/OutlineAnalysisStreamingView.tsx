import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MarkdownStreamingRenderer } from '@/components/shared/MarkdownStreamingRenderer';
import { useOutlineAnalysisStream } from '@/hooks/useProjects/useTaskOutlineAnalysis';
import { StageType } from '@/types/projects_dt_stru/projectStage_interface';

interface OutlineAnalysisStreamingViewProps {
  projectId: string;
  stageType: StageType;
}

export const OutlineAnalysisStreamingView: React.FC<OutlineAnalysisStreamingViewProps> = ({
  projectId,
  stageType,
}) => {
  const {
    streamContent,
    streamResult, // 添加获取最终结果
    isStreaming,
    streamComplete, // 添加流完成状态
    streamError,
    startStream,
    stopStreaming,
    isStartingStream,
  } = useOutlineAnalysisStream(projectId, stageType);

  // 使用显示内容 - 优先使用完整结果，其次使用流内容
  const displayContent = streamComplete && streamResult?.content 
    ? streamResult.content  // 流完成后使用完整结果
    : streamContent;        // 流进行中使用实时内容

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Outline Analysis</h2>
        
        {!isStreaming && !streamComplete && (
          <Button 
            onClick={() => startStream()} 
            disabled={isStartingStream}
            className="flex items-center gap-2"
          >
            {isStartingStream ? 'Starting...' : 'Start Analysis'}
          </Button>
        )}
      </div>
      
      <MarkdownStreamingRenderer
        title="Outline Analysis"
        content={displayContent}
        isStreaming={isStreaming}
        isComplete={streamComplete} // 传递完成状态
        onStop={stopStreaming}
        isLoading={isStartingStream}
        error={streamError}
        className="w-full"
      />
    </div>
  );
};