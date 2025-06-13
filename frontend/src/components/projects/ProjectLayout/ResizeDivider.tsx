// ResizeDivider.tsx  完成审核
import React from 'react';
// import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ResizeDividerProps {
  onResizeStart: (e: React.MouseEvent) => void;
}

export const ResizeDivider: React.FC<ResizeDividerProps> = ({ onResizeStart }) => {
    return (
        <div 
          className="
            w-0.5                  /* 基础宽度1px（实际拖拽区域会通过绝对定位扩展） */
            bg-gray-200           /* 默认灰色分隔线颜色 */
            hover:bg-primary/80      /* 悬停时显示主品牌色（增强交互反馈） */
            cursor-col-resize    /* 显示列调整光标（双向箭头） */
            flex                 /* 启用flex布局 */
            items-center         /* 垂直居中 */
            justify-center       /* 水平居中 */
            z-30                 /* 分隔线基础层级 */
            transition-colors    /* 颜色变化添加过渡动画 */
            group               /* 启用子元素状态联动（group-hover） */
          "
          onMouseDown={onResizeStart}  // 拖拽开始事件绑定， 与onClink按下立即触发不同，onMouseDown是按下并释放后触发（更稳定，适合开始拖拽）
        >
          {/* 拖动手柄（视觉可操作区域） */}
          <div 
            className="
            h-6                 /* 固定高度48px（更小的可操作区域） */
            w-2                  /* 宽度16px（更窄的手柄宽度） */
            absolute             /* 绝对定位（相对于父元素） */
            bg-gray-100          /* 浅灰色背景（与分隔线区分） */
            border               /* 添加边框 */
            border-gray-300      /* 边框颜色 */
            rounded-full        /* 完全圆角（圆形手柄外观） */
            flex                 /* 启用flex布局 */
            items-center        /* 垂直居中 */
            justify-center      /* 水平居中 */
            transition-colors    /* 背景色变化过渡动画 */
            z-50                /* 确保手柄始终在最上层（提高层级） */
          ">
          </div>
        </div>
      );
    }