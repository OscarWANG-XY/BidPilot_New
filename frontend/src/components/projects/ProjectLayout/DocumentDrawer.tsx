// DocumentDrawer.tsx  完成审核
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, X, Maximize2 } from 'lucide-react';
import TiptapEditor from '@/components/TiptapEditor/TiptapEditor';

// DocumentDrawer 组件的 props 接口
interface DocumentDrawerProps {
  isOpen: boolean;
  rightPanelWidth: number;
  content: any;
  onClose: () => void;
  onWidthChange: (newWidth: number) => void;
}

export const DocumentDrawer: React.FC<DocumentDrawerProps> = ({
  isOpen,
  rightPanelWidth,
  content,
  onClose,
  onWidthChange
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
    <div 
      className="
        bg-gray-50          /* 浅灰色背景，与主内容区形成视觉区分 */
        border-l            /* 左侧边框线 */
        border-gray-200     /* 浅灰色边框，与背景协调 */
        transition-all      /* 所有CSS属性变化添加过渡效果 */
        duration-300       /* 过渡动画持续300ms */
        ease-in-out        /* 缓动函数：慢-快-慢 */
      "
      style={{ 
        width: `${100}%`,  /* 宽度100%，和SplitLayout的宽度保一致 */
        overflow: isOpen ? 'visible' : 'hidden' /* 面板关闭时彻底隐藏内容 */
      }}
    >
      {/* 主容器采用flex布局 */}
      <div className="
        h-full            /* 高度撑满父容器 */
        flex              /* 启用flex布局 */
        flex-col          /* 垂直方向排列子元素 */
      ">
        {/* 文档标题栏 - 固定顶部 */}
        <div className="
          p-4             /* 内边距16px */
          border-b        /* 底部边框线 */
          sticky          /* 粘性定位 */
          top-0          /* 固定在顶部 */
          bg-white       /* 白色背景 */
          z-10           /* 确保显示在最上层 */
          shadow-sm      /* 轻微底部阴影，增加层次感 */
          flex           /* flex布局 */
          justify-between /* 子元素两端对齐 */
          items-center   /* 垂直居中 */
        ">
          {/* 标题文字部分 */}
          <div className="
            text-lg        /* 大号字体 */
            font-medium    /* 中等字重 */
            text-gray-800  /* 深灰色文字 */
            flex          /* flex布局 */
            items-center  /* 垂直居中 */
          ">
            <FileText className="
              w-5 h-5      /* 图标尺寸20x20px */
              mr-2         /* 右外边距8px */
              text-primary /* 主品牌色图标 */
            " />
            招标文件内容
          </div>
  
          {/* 操作按钮组 */}
          <div className="
            flex          /* flex布局 */
            space-x-2     /* 按钮间距8px */
          ">
            {/* 最大化/恢复按钮 */}
            <Button 
              variant="ghost"  /* 幽灵按钮样式（无背景） */
              size="sm"        /* 小尺寸按钮 */
              className="
                h-8 w-8      /* 固定尺寸32x32px */
                p-0          /* 无内边距（图标居中） */
              " 
              onClick={toggleMaximize}
              title={rightPanelWidth === 50 ? "扩大文档区域" : "恢复默认大小"}
            >
              <Maximize2 className="h-4 w-4" />  {/* 16x16px图标 */}
            </Button>
            
            {/* 关闭按钮 */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="
                h-8 w-8      /* 固定尺寸32x32px */
                p-0          /* 无内边距 */
                hover:bg-red-50  /* 悬停时浅红色背景 */
                hover:text-red-500 /* 悬停时红色图标 */
              " 
              onClick={onClose}
              title="关闭文档"
            >
              <X className="h-4 w-4" />  {/* 16x16px关闭图标 */}
            </Button>
          </div>
        </div>
        
        {/* 文档内容区域 */}
        <div className="
          flex-1         /* 占据剩余可用空间 */
          overflow-auto  /* 内容溢出时显示滚动条 */
          p-4           /* 内边距16px */
          bg-white       /* 白色背景 */
          m-3           /* 外边距12px */
          rounded-md    /* 中等圆角6px */
          shadow-sm     /* 轻微阴影 */
        ">
          <TiptapEditor
            initialContent={content}
            onChange={() => {}}
            readOnly={true}
            maxWidth="100%"    /* 编辑器最大宽度 */
            minWidth="100%"    /* 编辑器最小宽度 */
            maxHeight="100%"   /* 编辑器最大高度 */
            minHeight="100%"   /* 编辑器最小高度 */
            showToc={true}    /* 显示目录 */
          />
        </div>
      </div>
    </div>
  );
};