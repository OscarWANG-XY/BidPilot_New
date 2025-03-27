import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MarkdownStreamingViewerProps {
  content: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  className?: string;
  containerClassName?: string;
}

export const MarkdownStreamingViewer: React.FC<MarkdownStreamingViewerProps> = ({
  content,
  isStreaming = false,
  isComplete = false,
  className,
  containerClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // 处理内容以处理不完整的markdown块
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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
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
                  style={vscDarkPlus as any}
                  language={match ? match[1] : ''}
                  PreTag="div"
                  {...rest}
                >
                  {String(children).replace(/\n$/, '')}
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