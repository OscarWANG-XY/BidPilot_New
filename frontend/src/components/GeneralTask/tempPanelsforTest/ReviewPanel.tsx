import React from 'react';

interface ReviewPanelProps {
  task: any;
  isUpdating: boolean;
  onAcceptResult: () => Promise<void>;
  onRestartAnalysis: () => Promise<void>;
  onStartEditing: () => void;
  isEditing: boolean;
  editingResult: string;
  onEditingResultChange: (value: string) => void;
  onCancelEditing: () => void;
  onSaveEditedResult: () => Promise<void>;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({
  task,
  isUpdating,
  onAcceptResult,
  onRestartAnalysis,
  onStartEditing,
  isEditing,
  editingResult,
  onEditingResultChange,
  onCancelEditing,
  onSaveEditedResult
}) => {
  if (isEditing) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">编辑分析结果</h2>
        
        <div className="mb-6">
          <textarea
            value={editingResult}
            onChange={(e) => onEditingResultChange(e.target.value)}
            className="w-full h-96 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="编辑分析结果..."
          />
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancelEditing}
            disabled={isUpdating}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={onSaveEditedResult}
            disabled={isUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUpdating ? "保存中..." : "保存编辑"}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">审核分析结果</h2>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">分析结果</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
          {task.originalResult || "无分析结果"}
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          onClick={onRestartAnalysis}
          disabled={isUpdating}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed"
        >
          重新分析
        </button>
        <button
          onClick={onStartEditing}
          disabled={isUpdating}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          编辑结果
        </button>
        <button
          onClick={onAcceptResult}
          disabled={isUpdating}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUpdating ? "处理中..." : "接受结果"}
        </button>
      </div>
    </div>
  );
};

export default ReviewPanel; 