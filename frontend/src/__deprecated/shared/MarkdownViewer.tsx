import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';   
import remarkGfm from 'remark-gfm';   // 支持GFM（GitHub Flavored Markdown）语法
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';  // 用于代码块的高亮显示
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';  // 代码块的样式 
import { cn } from '@/lib/utils';   // 用于合并 className 


interface MarkdownStreamingViewerProps {
  content: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  className?: string;   // 内部内容的样式
  containerClassName?: string;  // 容器本身的样式
}

export const MarkdownStreamingViewer: React.FC<MarkdownStreamingViewerProps> = ({
  content,
  isStreaming = false,    // 初始化为false
  isComplete = false,    // 初始化为false
  className,
  containerClassName,
}) => {
  
  // 引用容器DOM元素，用于流式传输时自动滚动到底部 
  const containerRef = useRef<HTMLDivElement>(null);

  // 存储处理后的markdown内容
  const [processedContent, setProcessedContent] = useState<string>('');
  
  // 处理markdown内容以确保它可渲染
  useEffect(() => {
    if (!content) {
      setProcessedContent('');
      return;
    }
    
    // 处理内容以处理不完整的markdown元素
    let safeContent = content;
    
    // 处理不完整的代码块
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)(?:```|$)/g;
    safeContent = safeContent.replace(codeBlockRegex, (match, lang, code) => {
      // 如果代码块没有关闭，则关闭它
      if (!match.endsWith('```')) {
        return `\`\`\`${lang}\n${code}\n\`\`\``;
      }
      return match;
    });
    
    // 处理不完整的标题、列表等
    // 按行边界拆分内容以更安全地渲染
    const lines = safeContent.split('\n');
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      // 追踪代码块状态
      if (lines[i].startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      
      // 只处理代码块外的行
      if (!inCodeBlock) {
        // 处理不完整的列表项
        if (/^(\s*[-*+]|\s*\d+\.)\s*$/.test(lines[i])) {
          lines[i] = lines[i] + ' '; // 添加空格使其渲染
        }
      }
    }
    
    setProcessedContent(lines.join('\n'));
  }, [content]);

  // 流式传输时自动滚动到底部
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [processedContent, isStreaming]);

  // 如果完成，滚动到顶部
  useEffect(() => {
    if (isComplete && containerRef.current && !isStreaming) {
      containerRef.current.scrollTop = 0;
    }
  }, [isComplete, isStreaming]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-y-auto max-h-[70vh] p-4 rounded-md bg-background border",
        containerClassName
      )}
    >
      {isStreaming && (
        <div className="absolute top-2 right-2 flex items-center">
          <span className="animate-pulse h-2 w-2 rounded-full bg-green-500 mr-2"></span>
          <span className="text-xs text-muted-foreground">Streaming...</span>
        </div>
      )}
      
      <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
        <ReactMarkdown   // MARKDOWN渲染器
          remarkPlugins={[remarkGfm]}  // 添加GFM插件， 支持GFM语法
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              
              if (!className?.includes('language-')) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
              
              // 移除导致SyntaxHighlighter类型错误的props
              const { node, ref, ...rest } = props as any;
              
              return (
                <SyntaxHighlighter
                  style={vscDarkPlus as any}       // 使用VS Code的dark+主题样式
                  language={match ? match[1] : ''} // 设置代码语言
                  PreTag="div"                     // 使用div作为包裹元素
                  {...rest}                       // 传递其他属性
                >
                  {String(children).replace(/\n$/, '')  //处理子内容
                  }   
                </SyntaxHighlighter>
              );
            },
            // 组件定义与之前保持一致
            h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
            h2: ({ ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
            // ... 其他组件
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
      
      {isStreaming && (
        <div className="h-6 w-full" /> // 底部额外空间以便更好滚动
      )}
    </div>
  );
};