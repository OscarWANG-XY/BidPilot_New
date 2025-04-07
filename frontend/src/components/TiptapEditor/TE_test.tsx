import React, { useState } from 'react';
import TiptapEditor from './TiptapEditor';
import { allTestData } from './TE_testData';

const TiptapEditorTest: React.FC = () => {
  // 当前选中的测试数据
  const [selectedTest, setSelectedTest] = useState<string>('basicTextContent');
  // 编辑器内容
  const [editorContent, setEditorContent] = useState<string>(
    JSON.stringify(allTestData.basicTextContent)
  );
  // 是否只读模式
  const [readOnly, setReadOnly] = useState<boolean>(false);
  // 是否显示目录
  const [showToc, setShowToc] = useState<boolean>(true);
  // 编辑器高度
  const [editorHeight, setEditorHeight] = useState<number>(400);
  // 编辑器宽度
  const [editorWidth, setEditorWidth] = useState<number>(1000);
  // 输出内容
  const [outputContent, setOutputContent] = useState<string>('');

  // 切换测试数据
  const handleTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const testName = e.target.value;
    setSelectedTest(testName);
    setEditorContent(JSON.stringify(allTestData[testName as keyof typeof allTestData]));
  };

  // 处理编辑器内容变化
  const handleEditorChange = (content: string) => {
    setOutputContent(content);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">TiptapEditor_lite 测试页面</h1>
      
      {/* 测试控制面板 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* 测试数据选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              测试数据
            </label>
            <select
              value={selectedTest}
              onChange={handleTestChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {Object.keys(allTestData).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          
          {/* 只读模式切换 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              编辑模式
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={!readOnly}
                onChange={() => setReadOnly(!readOnly)}
                className="mr-2"
                id="editMode"
              />
              <label htmlFor="editMode">
                {readOnly ? '只读模式' : '编辑模式'}
              </label>
            </div>
          </div>
          
          {/* 目录显示切换 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目录显示
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={showToc}
                onChange={() => setShowToc(!showToc)}
                className="mr-2"
                id="showToc"
              />
              <label htmlFor="showToc">
                {showToc ? '显示目录' : '隐藏目录'}
              </label>
            </div>
          </div>
        </div>
        
        {/* 尺寸调整控制 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 编辑器高度调整 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              编辑器高度: {editorHeight}px
            </label>
            <input
              type="range"
              min="200"
              max="800"
              step="50"
              value={editorHeight}
              onChange={(e) => setEditorHeight(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          {/* 编辑器宽度调整 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              编辑器宽度: {editorWidth}px
            </label>
            <input
              type="range"
              min="500"
              max="1500"
              step="50"
              value={editorWidth}
              onChange={(e) => setEditorWidth(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* 编辑器组件 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">编辑器</h2>
        <TiptapEditor
          initialContent={editorContent}
          onChange={handleEditorChange}
          maxHeight={editorHeight}
          minHeight={editorHeight}
          maxWidth={`${editorWidth}px`}
          minWidth="300px"
          showToc={showToc}
          readOnly={readOnly}
        />
      </div>
      
      {/* 输出内容 */}
      <div>
        <h2 className="text-xl font-semibold mb-2">编辑器输出内容</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-60">
            {outputContent}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TiptapEditorTest;