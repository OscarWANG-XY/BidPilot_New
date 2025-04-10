import React, { useState } from 'react';
import ReviewPanel from './ReviewPanel';
import { 
  SAMPLE_TIPTAP_CONTENT,
  SAMPLE_EDITED_CONTENT
} from './testData';

const ReviewPanelTest: React.FC = () => {
  // 基本状态管理
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingResult, setEditingResult] = useState(SAMPLE_TIPTAP_CONTENT);
  const [finalResult, setFinalResult] = useState(SAMPLE_TIPTAP_CONTENT);
  
  // 处理结果编辑变更
  const handleEditingResultChange = (value: string) => {
    console.log('内容已更改');
    setEditingResult(value);
  };
  
  // 开始编辑处理
  const handleStartEditing = () => {
    console.log('开始编辑');
    setEditingResult(finalResult);
    setIsEditing(true);
  };
  
  // 取消编辑处理
  const handleCancelEditing = () => {
    console.log('取消编辑');
    setIsEditing(false);
  };
  
  // 保存编辑结果处理
  const handleSaveEditedResult = async () => {
    console.log('保存编辑结果');
    setIsUpdating(true);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 更新最终结果并退出编辑模式
    setFinalResult(editingResult);
    setIsUpdating(false);
    setIsEditing(false);
  };
  
  // 使用样例编辑内容
  const useExampleEditedContent = () => {
    setEditingResult(SAMPLE_EDITED_CONTENT);
  };
  
  // 重置为原始内容
  const resetToOriginal = () => {
    setFinalResult(SAMPLE_TIPTAP_CONTENT);
    setEditingResult(SAMPLE_TIPTAP_CONTENT);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">ReviewPanel 测试页面</h1>
          <p className="text-gray-600 mt-1">用于测试 ReviewPanel 组件的各种状态和交互</p>
        </div>
        
        <div className="p-4">
          {/* 测试控制面板 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-3">测试控制</h2>
            <div className="flex flex-wrap gap-3">
              {isEditing && (
                <>
                  <button 
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition disabled:bg-green-300"
                    onClick={handleSaveEditedResult}
                    disabled={isUpdating}
                  >
                    {isUpdating ? '保存中...' : '保存编辑'}
                  </button>
                  
                  <button 
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition disabled:bg-gray-300"
                    onClick={handleCancelEditing}
                    disabled={isUpdating}
                  >
                    取消编辑
                  </button>
                  
                  <button 
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition"
                    onClick={useExampleEditedContent}
                  >
                    使用样例内容
                  </button>
                </>
              )}
              
              <button 
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition"
                onClick={() => setIsUpdating(!isUpdating)}
              >
                切换加载状态
              </button>
              
              <button 
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
                onClick={resetToOriginal}
              >
                重置内容
              </button>
            </div>
            
            <div className="mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">当前状态:</span>
                <span className={`px-2 py-1 rounded ${isEditing ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {isEditing ? '编辑中' : '查看模式'}
                </span>
                <span className={`px-2 py-1 rounded ${isUpdating ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                  {isUpdating ? '保存中' : '空闲'}
                </span>
              </div>
            </div>
          </div>
          
          {/* ReviewPanel 组件 */}
          <div className="border border-gray-200 rounded-lg">
            <ReviewPanel
              finalResult={finalResult}
              isUpdating={isUpdating}
              isEditing={isEditing}
              editingResult={editingResult}
              onStartEditing={handleStartEditing}
              onEditingResultChange={handleEditingResultChange}
              onCancelEditing={handleCancelEditing}
              onSaveEditedResult={handleSaveEditedResult}
            />
          </div>
        </div>
      </div>
      
      {/* 调试信息 */}
      <div className="mt-8 p-4 bg-gray-800 text-white rounded-lg shadow-md overflow-auto max-h-64">
        <h3 className="text-lg font-semibold mb-2">组件状态（调试）</h3>
        <div>
          <p className="mb-1"><span className="font-medium">isEditing:</span> {String(isEditing)}</p>
          <p className="mb-1"><span className="font-medium">isUpdating:</span> {String(isUpdating)}</p>
          <p className="mb-3"><span className="font-medium">内容长度:</span> {editingResult.length} 字符</p>
          <details>
            <summary className="cursor-pointer hover:text-blue-300 transition">查看当前编辑内容（点击展开）</summary>
            <pre className="mt-2 p-2 bg-gray-700 rounded text-sm overflow-auto">
              {editingResult.slice(0, 500)}...
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
};

export default ReviewPanelTest;