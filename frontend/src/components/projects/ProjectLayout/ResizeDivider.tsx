// ResizeDivider.tsx  完成审核
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ResizeDividerProps {
  onResizeStart: (e: React.MouseEvent) => void;
}

export const ResizeDivider: React.FC<ResizeDividerProps> = ({ onResizeStart }) => {
    return (
        <div 
          className="
            w-1                  /* 基础宽度1px（实际拖拽区域会通过绝对定位扩展） */
            bg-gray-200           /* 默认灰色分隔线颜色 */
            hover:bg-primary      /* 悬停时显示主品牌色（增强交互反馈） */
            cursor-col-resize    /* 显示列调整光标（双向箭头） */
            flex                 /* 启用flex布局 */
            items-center         /* 垂直居中 */
            justify-center       /* 水平居中 */
            z-10                 /* 确保手柄显示在其他内容上方 */
            transition-colors    /* 颜色变化添加过渡动画 */
            group               /* 启用子元素状态联动（group-hover） */
          "
          onMouseDown={onResizeStart}  // 拖拽开始事件绑定， 与onClink按下立即触发不同，onMouseDown是按下并释放后触发（更稳定，适合开始拖拽）
        >
          {/* 拖动手柄（视觉可操作区域） */}
          <div 
            className="
            h-20                 /* 固定高度80px（足够大的可操作区域） */
            w-6                  /* 宽度24px（实际可见手柄宽度） */
            absolute             /* 绝对定位（相对于父元素） */
            bg-gray-100          /* 浅灰色背景（与分隔线区分） */
            rounded-full        /* 完全圆角（圆形手柄外观） */
            flex                 /* 启用flex布局 */
            items-center        /* 垂直居中 */
            justify-center      /* 水平居中 */
            group-hover:bg-primary/20  /* 父元素悬停时显示半透明主色背景 */
            transition-colors    /* 背景色变化过渡动画 */
          ">
            {/* 手柄内部指示器（双箭头） */}
            <div 
             className="
              flex               /* flex布局 */
              flex-col          /* 垂直排列子元素 */
              items-center      /* 水平居中 */
              justify-center   /* 垂直居中 */
              space-y-1         /* 子元素垂直间距4px */
            ">
              <ChevronLeft className="
                  w-4 h-4       /* 图标尺寸16x16px */
                  text-gray-500  /* 默认中灰色图标 */
                  group-hover:text-primary  /* 悬停时变主品牌色 */
                " 
              />
              <ChevronRight className="
                  w-4 h-4       /* 图标尺寸16x16px */
                  text-gray-500  /* 默认中灰色图标 */
                  group-hover:text-primary  /* 悬停时变主品牌色 */
                " 
              />
            </div>
          </div>
        </div>
      );
    }