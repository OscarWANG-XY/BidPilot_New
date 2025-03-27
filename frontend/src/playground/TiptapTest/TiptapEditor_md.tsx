import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 大模型流式输出的 Markdown 展示组件
const AIResponseRenderer = ({ streamingResponse, onSaveToEditor }) => {
  // 引用最新的累积响应
  const accumulatedResponse = useRef('');
  
  // 处理流式响应
  useEffect(() => {
    if (streamingResponse) {
      accumulatedResponse.current += streamingResponse;
    }
  }, [streamingResponse]);
  
  return (
    <Card className="p-4 my-4 bg-gray-50 rounded-lg">
      <div className="prose max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // 自定义渲染表格，提升招投标文档中表格的可读性
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300" {...props} />
              </div>
            ),
            // 处理招投标中常见的代码和公式
            code: ({ node, inline, className, children, ...props }) => {
              return inline ? (
                <code className="px-1 py-0.5 bg-gray-100 rounded text-sm" {...props}>
                  {children}
                </code>
              ) : (
                <div className="bg-gray-800 rounded-md">
                  <pre className="p-4 overflow-x-auto text-sm text-white">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
          }}
        >
          {accumulatedResponse.current}
        </ReactMarkdown>
      </div>
      
      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline" 
          onClick={() => navigator.clipboard.writeText(accumulatedResponse.current)}
        >
          复制内容
        </Button>
        <Button 
          onClick={() => onSaveToEditor(accumulatedResponse.current)}
        >
          保存到编辑器
        </Button>
      </div>
    </Card>
  );
};

// 大模型分析与响应控制组件
const BidAnalysisPanel = ({ documentContent, onSaveToTiptap }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [showMarkdownEditor, setShowMarkdownEditor] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  
  // 模拟大模型流式输出
  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setStreamingResponse('');
    
    // 这里模拟从后端获取流式响应
    // 实际应用中应使用 SSE 或 WebSocket
    const fakeStreamResponse = async () => {
      const response = [
        "# 招标文件分析\n\n",
        "## 1. 项目概况\n\n",
        "- **项目名称**: 智能交通系统升级\n",
        "- **预算范围**: 500-700万元\n",
        "- **实施周期**: 12个月\n\n",
        "## 2. 技术要求\n\n",
        "| 项目 | 最低要求 | 建议方案 |\n",
        "| --- | --- | --- |\n",
        "| 系统架构 | 分布式 | 微服务架构 |\n",
        "| 数据处理能力 | 10,000 TPS | 15,000 TPS |\n",
        "| 存储容量 | 50TB | 75TB |\n\n",
        "## 3. 风险评估\n\n",
        "1. 技术方案存在以下潜在风险...\n",
        "2. 预算可能存在超支风险...\n\n",
        "## 4. 建议策略\n\n",
        "根据分析，建议采取以下投标策略..."
      ];
      
      // 模拟流式输出
      for (const chunk of response) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setStreamingResponse(prev => prev + chunk);
      }
      
      setIsAnalyzing(false);
    };
    
    fakeStreamResponse();
  };
  
  // 保存到 Tiptap 编辑器
  const handleSaveToEditor = async (markdown) => {
    // 这里调用你的转换服务
    // 实际情况下应该是API调用
    try {
      // 假设有一个API将Markdown转换为Tiptap JSON
      // const response = await fetch('/api/convert/markdown-to-tiptap', {
      //   method: 'POST',
      //   body: JSON.stringify({ markdown }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
      // const json = await response.json();
      
      // 将转换后的JSON传给Tiptap
      onSaveToTiptap(markdown); // 实际应传入转换后的JSON
    } catch (error) {
      console.error('Error converting Markdown to Tiptap:', error);
    }
  };
  
  const toggleMarkdownEditor = () => {
    setShowMarkdownEditor(!showMarkdownEditor);
    if (!showMarkdownEditor) {
      setMarkdownContent(streamingResponse);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Button 
          onClick={startAnalysis} 
          disabled={isAnalyzing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isAnalyzing ? '分析中...' : '开始分析招标文件'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={toggleMarkdownEditor}
        >
          {showMarkdownEditor ? '关闭Markdown编辑' : '编辑Markdown'}
        </Button>
      </div>
      
      {streamingResponse && !showMarkdownEditor && (
        <AIResponseRenderer 
          streamingResponse={streamingResponse} 
          onSaveToEditor={handleSaveToEditor} 
        />
      )}
      
      {showMarkdownEditor && (
        <Card className="p-4">
          <textarea
            className="w-full h-64 p-2 border rounded font-mono text-sm"
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <Button onClick={() => handleSaveToEditor(markdownContent)}>
              应用更改
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BidAnalysisPanel;