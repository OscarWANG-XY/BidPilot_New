import React from 'react'
import { Progress } from '@/components/ui/progress'

interface ExtractingProgressProps {
    isExtracting: boolean;
    extractionProgress: number;
  }
  
  export const ExtractingProgress: React.FC<ExtractingProgressProps> = ({ 
    isExtracting, 
    extractionProgress 
  }) => {
    if (!isExtracting) return null;
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">正在提取文档内容...</span>
          <span className="text-sm">{extractionProgress}%</span>
        </div>
        <Progress value={extractionProgress} className="h-2" />
        <p className="text-xs text-gray-500 mt-2">
          系统正在分析招标文件，请耐心等待。这可能需要几分钟时间。
        </p>
      </div>
    );
  };