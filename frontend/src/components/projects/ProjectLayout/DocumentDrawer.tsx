// DocumentDrawer.tsx  完成审核
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, X, Maximize2 } from 'lucide-react';
// import TiptapEditor from '@/components/TiptapEditor/TiptapEditor_Pro';

// DocumentDrawer 组件的 props 接口
interface DocumentDrawerProps {
  isOpen: boolean;
  rightPanelWidth: number;
  onClose: () => void;
  onWidthChange: (newWidth: number) => void;
  content: string;
}

export const DocumentDrawer: React.FC<DocumentDrawerProps> = ({
  isOpen,
  rightPanelWidth,
  onClose,
  onWidthChange,
  content,
}) => {
  // 如果抽屉关闭，不渲染任何内容
  if (!isOpen) {
    return null;
  }

  // 切换宽度 (50% <-> 80%)
  const toggleMaximize = () => {
    // These values (50, 80) refer to the percentage of the overall layout
    // that the right panel should occupy
    console.log("toggleMaximize called, current width:", rightPanelWidth);
    onWidthChange(rightPanelWidth === 50 ? 80 : 50);
  };

  return (
    <div className="bg-gray-50 border-l border-gray-200 transition-all duration-300 ease-in-out h-full" 
            style={{ width: `${100}%`, overflow: isOpen ? 'visible' : 'hidden' }}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b sticky top-0 bg-gray-50 z-10 shadow-sm flex justify-between items-center">
          <div className="text-lg font-medium text-gray-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            招标文件内容
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" 
              onClick={toggleMaximize} 
              title={rightPanelWidth === 50 ? "扩大文档区域" : "恢复默认大小"}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500" 
              onClick={onClose} 
              title="关闭文档"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="h-full overflow-auto p-4 bg-white m-3 rounded-md shadow-sm">
          {/* <TiptapEditor
            initialContent={content}
            readOnly={true}
            maxWidth="100%"
            minWidth="100%"
            maxHeight="100%"
            minHeight="100%"
            showToc={true}
          /> */}
        </div>
      </div>
    </div>
  );
};