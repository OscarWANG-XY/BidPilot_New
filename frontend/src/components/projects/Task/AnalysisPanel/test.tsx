import React, { useState, useEffect, useCallback, useRef } from 'react';
import AnalysisPanel from './AnalysisPanel';
import { testScenarios, mockStreamResult } from './testData';

const AnalysisPanelTest: React.FC = () => {
  // State to track which test scenario to display
  const [currentScenario, setCurrentScenario] = useState<keyof typeof testScenarios>('activeStreaming');
  
  // State for streaming simulation
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);
  const [simulatedContent, setSimulatedContent] = useState('');
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentIndex = useRef(0);
  
  // Full content to stream chunk by chunk
  const fullContent = mockStreamResult.content;
  const contentChunks = useRef<string[]>([]);
  
  // Prepare content chunks on mount
  useEffect(() => {
    // Split content into paragraphs first
    const paragraphs = fullContent.split('\n\n');
    const chunks: string[] = [];
    
    // Further split long paragraphs into smaller chunks
    paragraphs.forEach(paragraph => {
      if (paragraph.length < 30) {
        chunks.push(paragraph + '\n\n');
      } else {
        // Split paragraph into sentences or segments
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        let currentChunk = '';
        
        sentences.forEach(sentence => {
          currentChunk += sentence + ' ';
          if (currentChunk.length > 20) {
            chunks.push(currentChunk);
            currentChunk = '';
          }
        });
        
        if (currentChunk) {
          chunks.push(currentChunk + '\n\n');
        } else {
          chunks[chunks.length - 1] += '\n\n';
        }
      }
    });
    
    contentChunks.current = chunks;
  }, [fullContent]);
  
  // Start simulating streaming
  const startStreamSimulation = useCallback(() => {
    if (isSimulatingStream) return;
    
    setIsSimulatingStream(true);
    setCurrentScenario('activeStreaming');
    setSimulatedContent('');
    contentIndex.current = 0;
    
    // Stream chunks at random intervals (between 50ms and 300ms)
    streamIntervalRef.current = setInterval(() => {
      if (contentIndex.current < contentChunks.current.length) {
        setSimulatedContent(prev => prev + contentChunks.current[contentIndex.current]);
        contentIndex.current++;
      } else {
        // End streaming when all content is displayed
        stopStreamSimulation(true);
      }
    }, Math.random() * 250 + 50);
  }, [isSimulatingStream]);
  
  // Stop simulating streaming
  const stopStreamSimulation = useCallback((completed = false) => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    
    setIsSimulatingStream(false);
    
    // If stream completed naturally, switch to completed state
    if (completed) {
      setTimeout(() => {
        setCurrentScenario('completedStreaming');
      }, 1000);
    }
  }, []);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);
  
  // Mock the terminateAnalysis function
  const handleTerminateAnalysis = async (): Promise<void> => {
    console.log('终止分析中...');
    stopStreamSimulation();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Switch to completedStreaming when terminated
    setCurrentScenario('completedStreaming');
    console.log('分析已终止');
  };

  // Create a modified version of the test scenario with our mock handler and simulated content
  const testProps = {
    ...testScenarios[currentScenario],
    onTerminateAnalysis: handleTerminateAnalysis,
    // Override stream content with simulated content when streaming
    ...(isSimulatingStream && {
      streamContent: simulatedContent,
      isStreaming: true,
    })
  };
  
  // Handle scenario change - stop simulation if active
  useEffect(() => {
    if (currentScenario !== 'activeStreaming' && isSimulatingStream) {
      stopStreamSimulation();
    }
  }, [currentScenario, isSimulatingStream, stopStreamSimulation]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">分析面板测试页面</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">选择测试场景:</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(testScenarios).map((scenario) => (
            <button
              key={scenario}
              onClick={() => setCurrentScenario(scenario as keyof typeof testScenarios)}
              className={`px-4 py-2 rounded-md ${
                currentScenario === scenario
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {scenario}
            </button>
          ))}
        </div>
      </div>
      
      {/* 流式模拟控制 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">流式输出模拟:</h2>
        <div className="flex gap-2">
          <button
            onClick={startStreamSimulation}
            disabled={isSimulatingStream}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            开始模拟流式输出
          </button>
          <button
            onClick={() => stopStreamSimulation()}
            disabled={!isSimulatingStream}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            停止模拟
          </button>
        </div>
        {isSimulatingStream && (
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <div className="animate-pulse mr-2 h-3 w-3 bg-green-500 rounded-full"></div>
            <span>正在模拟流式输出... ({Math.round((contentIndex.current / contentChunks.current.length) * 100)}%)</span>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">当前场景: {currentScenario}{isSimulatingStream ? ' (流式模拟中)' : ''}</h2>
        <div className="p-4 bg-gray-100 rounded-md overflow-auto max-h-40">
          <pre className="text-xs">
            {JSON.stringify({
              ...testScenarios[currentScenario],
              ...(isSimulatingStream && {
                streamContent: `${simulatedContent.substring(0, 100)}... (${simulatedContent.length} 字符)`,
                isStreaming: true
              })
            }, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-4">分析面板组件:</h2>
        <AnalysisPanel {...testProps} />
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>
          <strong>注意:</strong> 点击"停止分析"按钮将模拟终止分析过程，
          并自动从"activeStreaming"（数据流动中）场景切换到"completedStreaming"（完成）场景。
        </p>
        <p className="mt-2">
          <strong>流式模拟说明:</strong> "开始模拟流式输出"按钮会逐步显示内容，模拟真实的API流式响应。
          每个内容块以随机的时间间隔（50-300毫秒）发送，以模拟网络延迟和服务器处理时间的变化。
        </p>
      </div>
    </div>
  );
};

export default AnalysisPanelTest;

// Usage:
// Import this component and use it in your app for testing:
// <AnalysisPanelTest />