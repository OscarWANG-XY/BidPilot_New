import React, { useState } from 'react';
import MarkdownEditor from './MarkdownEditor';
import testData from './MD_testData';

const MarkdownEditorTest: React.FC = () => {
  const [selectedTest, setSelectedTest] = useState('basicMarkdown');
  const [content, setContent] = useState(testData.basicMarkdown);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');

  const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const testKey = e.target.value;
    setSelectedTest(testKey);
    setContent(testData[testKey as keyof typeof testData]);
  };

  // 模拟流式输出
  const simulateStreaming = () => {
    setIsStreaming(true);
    setStreamContent('');
    
    const fullContent = testData.streamingExample;
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < fullContent.length) {
        setStreamContent(prev => prev + fullContent[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 30); // 每30毫秒添加一个字符
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Markdown 编辑器测试</h1>
      
      <div className="mb-6 space-y-2">
        <div>
          <label className="block text-sm font-medium mb-1">选择测试数据:</label>
          <select 
            value={selectedTest} 
            onChange={handleTestChange}
            className="w-full p-2 border border-gray-300 rounded"
          >
            {Object.keys(testData).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={isReadOnly} 
              onChange={() => setIsReadOnly(!isReadOnly)}
              className="mr-2"
            />
            只读模式
          </label>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">编辑器</h2>
        <MarkdownEditor 
          content={content} 
          onChange={setContent} 
          readOnly={isReadOnly}
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">流式输出测试</h2>
        <button 
          onClick={simulateStreaming} 
          disabled={isStreaming}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isStreaming ? '正在生成...' : '模拟流式输出'}
        </button>
        
        <MarkdownEditor 
          content={streamContent} 
          readOnly={true} 
          streamingContent={isStreaming} 
        />
      </div>
    </div>
  );
};

export default MarkdownEditorTest;