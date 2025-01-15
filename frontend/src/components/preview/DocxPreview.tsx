import { useState, useEffect } from 'react';
import mammoth from 'mammoth';

interface DocxPreviewProps {
  url: string;
  fileName: string;
}

export function DocxPreview({ url }: DocxPreviewProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocx = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setContent(result.value);
      } catch (err) {
        console.error('Error loading DOCX:', err);
        setError('文件加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadDocx();
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full overflow-auto">
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    </div>
  );
} 