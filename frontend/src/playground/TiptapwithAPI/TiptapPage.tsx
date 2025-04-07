// src/pages/TestgroundPage.tsx
import React, { useState } from 'react';
import { useTipTaps } from './useTiptap';
import TiptapEditor from './TiptapEditor';

const TestgroundPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { useTipTapList, useTipTapDelete } = useTipTaps();
  
  // Fetch all testground entries
  const { data: testgrounds, isLoading, isError } = useTipTapList();
  
  // Delete mutation
  const deleteMutation = useTipTapDelete();

  // Handle creating a new entry
  const handleCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
  };

  // Handle editing an existing entry
  const handleEdit = (id: number) => {
    setIsCreating(false);
    setSelectedId(id);
  };

  // Handle deleting an entry
  const handleDelete = async (id: number) => {
    if (window.confirm('确定要删除这个测试记录吗？')) {
      try {
        await deleteMutation.mutateAsync(id);
        if (selectedId === id) {
          setSelectedId(null);
          setIsCreating(false);
        }
      } catch (error) {
        console.error('Failed to delete testground:', error);
      }
    }
  };

  // Handle after save
  const handleSaveComplete = (id: number) => {
    setIsCreating(false);
    setSelectedId(id);
  };

  if (isLoading) {
    return <div className="p-8 text-center">加载中...</div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500">加载失败，请检查API连接</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tiptap 测试工具</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          创建新记录
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar with list of testgrounds */}
        <div className="lg:col-span-1 border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">测试记录列表</h2>
          
          {testgrounds && testgrounds.length > 0 ? (
            <ul className="space-y-2">
              {testgrounds.map((item) => (
                <li 
                  key={item.id} 
                  className={`p-3 rounded border cursor-pointer ${
                    selectedId === item.id ? 'bg-blue-100 border-blue-300' : ''
                  }`}
                  onClick={() => handleEdit(item.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{item.description}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">暂无记录，请创建一个</p>
          )}
        </div>
        
        {/* Right section with editor */}
        <div className="lg:col-span-2">
          {isCreating ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">创建新记录</h2>
              <TiptapEditor onSave={handleSaveComplete} />
            </div>
          ) : selectedId ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">编辑记录</h2>
              <TiptapEditor 
                id={selectedId} 
                onSave={handleSaveComplete} 
              />
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              请从左侧选择一个记录进行编辑，或创建一个新记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestgroundPage;