import React from 'react';

interface ResultEditorPanelProps {
  task: any;
  isUpdating: boolean;
  editingResult: string;
  onEditingResultChange: (value: string) => void;
  onCancelEditing: () => void;
  onSaveEditedResult: () => Promise<void>;
}

const ResultEditorPanel: React.FC<ResultEditorPanelProps> = ({
  task,
  isUpdating,
  editingResult,
  onEditingResultChange,
  onCancelEditing,
  onSaveEditedResult
}) => {
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
};

export default ResultEditorPanel; 