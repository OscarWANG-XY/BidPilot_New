import React from 'react';
import TiptapEditor from '@/components/TiptapEditor/TiptapEditor';
import { Button } from '@/components/ui/button';

interface ResultPreviewProps {
  finalResult: string;
  isLoading?: boolean;
  onExport?: () => void;
  onPrint?: () => void;
}

const ResultPreview: React.FC<ResultPreviewProps> = ({
  finalResult,
  isLoading = false,
  onExport,
  onPrint
}) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">结果预览</h2>
        <div className="flex space-x-2">
          {onExport && (
            <Button 
              variant="outline" 
              onClick={onExport}
              disabled={isLoading}
            >
              导出结果
            </Button>
          )}
          {onPrint && (
            <Button 
              onClick={onPrint}
              disabled={isLoading}
            >
              打印结果
            </Button>
          )}
        </div>
      </div>

      {/* TiptapEditor for viewing the result */}
      <TiptapEditor
        initialContent={finalResult}
        readOnly={true}
        showToc={true}
        maxHeight={600}
      />
    </div>
  );
};

export default ResultPreview;
