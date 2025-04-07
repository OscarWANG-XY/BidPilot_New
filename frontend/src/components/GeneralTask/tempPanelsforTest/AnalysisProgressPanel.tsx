import React from 'react';
import { TaskStatus } from '../hook&APIs.tsx/tasksApi';

interface AnalysisProgressPanelProps {
  task: any;
  isUpdating: boolean;
  onTerminateAnalysis: () => Promise<void>;
}

const AnalysisProgressPanel: React.FC<AnalysisProgressPanelProps> = ({
  task,
  isUpdating,
  onTerminateAnalysis
}) => {
  // Calculate progress percentage (mock implementation)
  const progressPercentage = task.progress ? task.progress : 0;
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">分析进行中</h2>
      
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="mt-2 text-right text-sm text-gray-600">
          {progressPercentage}% 完成
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">当前步骤</h3>
        <p className="text-gray-700">{task.currentStep || "正在初始化分析..."}</p>
      </div>
      
      {task.logs && task.logs.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">分析日志</h3>
          <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
            {task.logs.map((log: string, index: number) => (
              <p key={index} className="text-sm text-gray-700 mb-1">{log}</p>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={onTerminateAnalysis}
          disabled={isUpdating}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUpdating ? "处理中..." : "终止分析"}
        </button>
      </div>
    </div>
  );
};

export default AnalysisProgressPanel; 