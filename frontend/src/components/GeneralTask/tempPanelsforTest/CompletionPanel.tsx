import React from 'react';

interface CompletionPanelProps {
  task: any;
  isUpdating: boolean;
  onResetTask: () => Promise<void>;
}

const CompletionPanel: React.FC<CompletionPanelProps> = ({
  task,
  isUpdating,
  onResetTask
}) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center mb-6">
        <div className="bg-green-100 p-2 rounded-full">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold ml-3">任务已完成</h2>
      </div>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">最终结果</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
          {task.finalResult || task.originalResult || "无结果数据"}
        </div>
      </div>
      
      {task.completedAt && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            完成时间: {new Date(task.completedAt).toLocaleString()}
          </p>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={onResetTask}
          disabled={isUpdating}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          {isUpdating ? "处理中..." : "重置任务"}
        </button>
      </div>
    </div>
  );
};

export default CompletionPanel; 