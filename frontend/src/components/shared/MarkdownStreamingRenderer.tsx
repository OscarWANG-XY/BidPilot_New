import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, StopCircle, Copy, Download, CheckCircle } from 'lucide-react'; // 添加CheckCircle图标
import { MarkdownStreamingViewer } from './MarkdownViewer';
import { useToast } from '@/hooks/use-toast';

interface MarkdownStreamingRendererProps {
  title?: string;
  content: string;
  isStreaming: boolean;
  isComplete?: boolean; // 添加完成状态
  onStop?: () => void;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
}

export const MarkdownStreamingRenderer: React.FC<MarkdownStreamingRendererProps> = ({
  title = 'AI Analysis',
  content,
  isStreaming,
  isComplete = false, // 默认为false
  onStop,
  className,
  isLoading = false,
  error = null,
}) => {
  const { toast } = useToast();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "The content has been copied to your clipboard.",
      duration: 2000,
    });
  };
  
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {isComplete && !isLoading && !error && (
            <div className="flex items-center gap-1 text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Complete</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <MarkdownStreamingViewer 
            content={content} 
            isStreaming={isStreaming} 
            isComplete={isComplete} // 传递完成状态
          />
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <div>
          {isStreaming && onStop && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={onStop}
              className="flex items-center gap-1"
            >
              <StopCircle className="h-4 w-4" />
              Stop
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopy}
            disabled={!content || isLoading}
            className="flex items-center gap-1"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            disabled={!content || isLoading}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};