// SplitLayout.tsx   完成审核
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from '@/_hooks/use-toast';
import { ResizeDivider } from './ResizeDivider';


// 添加节流函数
// 和直接把setTimeout放在handleMouseMove中不同的是，throttle函数可以减少触发频率，从而减少性能开销。 setTimeout只是延迟和排队。 
// 对于鼠标移动事件，中间状态通常是过渡值，所以丢弃了也不影响最终结果， 这样可以大幅减少计算开销。 
function throttle<T extends (...args: any[]) => any>(     //(...args: any[]) => any表示接收任何参数和返回值的函数。 T表示任意函数类型。  
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    
    return function(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {     // 通过inThrottle来控制是否执行函数，执行以后里面进入丢弃状态，并持续一段时间，从而起到减少频率的效果。 
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

interface SplitLayoutProps {
  leftContent: React.ReactNode; // 左侧内容区域， 直接插入在JSX里
  rightContent: React.ReactNode; // 右侧内容区域， 直接插入在JSX里 
  isRightPanelOpen: boolean; // 右侧面板是否打开
  initialRightPanelWidth?: number; // 初始右侧面板宽度
  minLeftWidth?: number; // 左侧面板最小宽度百分比
  minRightWidth?: number; // 右侧面板最小宽度百分比
  className?: string; // 自定义样式
  onWidthChange?: (newWidth: number) => void; // 添加宽度变化回调
}

export const SplitLayout: React.FC<SplitLayoutProps> = ({
  leftContent,
  rightContent,
  isRightPanelOpen,
  initialRightPanelWidth = 50,
  minLeftWidth = 20, // 左侧面板最小宽度百分比为20% 
  minRightWidth = 20, // 右侧面板最小宽度百分比为20%
  className = '',
  onWidthChange
}) => {
  // 状态管理
  const [rightPanelWidth, setRightPanelWidth] = useState(initialRightPanelWidth); // 存储右侧面板宽度
  const [isResizing, setIsResizing] = useState(false);  // 是否正在调整大小

  // 存储容器引用，在下面handleMouseMove中用于计算宽度
  // 在后面render JSX里关联的位置看，绑定的是最外层的div
  // 组件挂载前 为null，挂载后 为DOM元素, 卸载后 为null 
  const containerRef = useRef<HTMLDivElement>(null);  
  
  // 处理大小调整开始
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止默认行为
    setIsResizing(true);
    
    // 添加特殊的光标样式到 body （光标指的时鼠标箭头， ='col-resize'时，会变成双向左右箭头）
    document.body.style.cursor = 'col-resize'; // 修改光标样式
    document.body.style.userSelect = 'none'; // 防止文本选择（防止用户在调整大小的时候，选中文字）
  };
  
  // 处理鼠标移动调整大小
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return; //安全判断
    
    // 获取容器尺寸（用于计算拖拽比例）
    const containerRect = containerRef.current.getBoundingClientRect();   // 获取容器元素的边界矩形，包括宽度、高度、位置等。
    const containerWidth = containerRect.width;  // 获取容器的宽度
    const mouseX = e.clientX - containerRect.left;  // 获取鼠标在容器中的位置（相对于容器的左边缘） 
    
    // 计算右侧面板宽度百分比，并应用最小宽度限制
    let leftWidthPercent = (mouseX / containerWidth) * 100;
    let rightWidthPercent = 100 - leftWidthPercent;
    
    // 确保左右两侧都不小于最小宽度
    if (leftWidthPercent < minLeftWidth) {
      leftWidthPercent = minLeftWidth;
      rightWidthPercent = 100 - minLeftWidth;
    } else if (rightWidthPercent < minRightWidth) {
      rightWidthPercent = minRightWidth;
      leftWidthPercent = 100 - minRightWidth;
    }
    
    setRightPanelWidth(rightWidthPercent);
    // minLeftWidth, minRightWidth 虽然设定后通常不会变化，但根据hooks的黄金法则，外部引用都应为依赖，避免闭包陷阱（函数捕获到过期值）
  },[isResizing, minLeftWidth, minRightWidth, onWidthChange]);
  
  // 创建节流版本的处理函数，限制为 16ms (约等于 60fps)
  const throttledHandleMouseMove = throttle(handleMouseMove, 100);

  // 处理鼠标释放，结束调整  在以下监听useEffect中使用
  const handleMouseUp = () => {
    if (!isResizing) return;   //如果不是在 resizing的状态下监听 mouseup事件，是无意义的（属于正常的鼠标点击和释放），所以这个时候不执行函数处理。 
    
    setIsResizing(false);
    
    // 恢复默认光标（恢复成正常的光标，鼠标箭头）
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // 显示调整成功的提示
    toast({
      title: "布局已调整",
      description: `主窗口: ${Math.round(100 - rightPanelWidth)}%, 文档窗口: ${Math.round(rightPanelWidth)}%`,
      duration: 2000,
    });

    // 确保最终宽度也通过回调通知父组件
    if (onWidthChange) {
        onWidthChange(rightPanelWidth);
    }
  };
  
  // 监听鼠标移动和释放事件
  useEffect(() => {
    // 只有当 isResizing时 才监听。 
    if (isResizing) {
      window.addEventListener('mousemove', throttledHandleMouseMove);   // 监听节流函数，而不是直接监听 handleMouseMove，从源头减少触发频率
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', throttledHandleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // 确保在组件卸载时恢复默认光标 （恢复成正常的鼠标箭头）
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

  }, [isResizing, throttledHandleMouseMove, handleMouseUp]);
  
  // 确保初始宽度在允许范围内
  useEffect(() => {
    if (initialRightPanelWidth < minRightWidth) {
      setRightPanelWidth(minRightWidth);
    } else if (initialRightPanelWidth > (100 - minLeftWidth)) {
      setRightPanelWidth(100 - minLeftWidth);
    }
  }, [initialRightPanelWidth, minLeftWidth, minRightWidth]);
  
  // 确保初始宽度在允许范围内
  useEffect(() => {
    setRightPanelWidth(initialRightPanelWidth);
  }, [initialRightPanelWidth]); // This will update when the prop changes


  return (
    <div 
      ref={containerRef} // 关联最外层DOM元素，用于获取容器引用
      className={`
        flex                     /* 启用Flex布局（默认横向排列） */
        ${isResizing ? '' : 'transition-all duration-300'} /* 拖拽时不加过渡动画避免卡顿，非拖拽时添加300ms全属性过渡 */
        ease-in-out              /* 过渡动画的缓动函数（慢-快-慢） */
        relative                 /* 创建相对定位上下文 */
        rounded-lg              /* 12px大圆角（比rounded-md更大） */
        overflow-hidden          /* 隐藏溢出内容（保持圆角效果） */
        ${className}            /* 允许外部传入的额外类名 */
      `}
    >
      {/* 左侧主内容区域 */}
      <div 
        className={`
          ${isResizing ? '' : 'transition-all duration-300'} /* 同步主容器的动画控制逻辑 */
          ease-in-out          /* 相同的缓动函数保证动画一致性 */
          overflow-auto        /* 内容溢出时显示滚动条 */
        `}
        style={{ 
          width: isRightPanelOpen 
            ? `${100 - rightPanelWidth}%`  /* 动态计算宽度：100%减去右侧面板宽度 */
            : '100%'                       /* 右侧面板关闭时占满全部宽度 */
        }}
      >
        {/* 内容容器，限制最大宽度以提供最佳阅读体验 */}
        <div 
          className="
            w-full               /* 在容器内占满宽度 */
            max-w-4xl           /* 最大宽度限制为896px，适合大多数内容 */
            mx-auto             /* 水平居中 */
            px-6                /* 左右内边距24px，提供呼吸空间 */
                            /* py为上下内边距16px */
          "
        >
          {leftContent}
        </div> 
      </div>
      
      {/* 可拖拽调整宽度的分隔线（仅在右侧面板打开时显示） */}
      {isRightPanelOpen && (
        <ResizeDivider onResizeStart={handleResizeStart} />
      )}
      
      {/* 右侧可折叠面板 */}
      <div 
        className={`
          ${isResizing ? '' : 'transition-all duration-300'} /* 同步动画控制 */
          ease-in-out          /* 相同缓动函数 */
          bg-gray-100           /* 浅灰色背景（与左侧形成视觉区分） */
          border-l             /* 左侧边框线 */
          border-gray-200      /* 浅灰色边框（与背景协调） */
        `}
        style={{ 
          width: isRightPanelOpen 
            ? `${rightPanelWidth}%`   /* 动态宽度（通过拖拽调整） */
            : '0',                   /* 完全折叠时宽度为0 */
          overflow: isRightPanelOpen 
            ? 'visible'              /* 展开时允许内容溢出 */
            : 'hidden'               /* 折叠时彻底隐藏内容 */
        }}
      >
        {isRightPanelOpen && rightContent} {/* 条件渲染避免隐藏内容占用DOM */}
      </div>
    </div>
  );
};





  // 宽度选择说明：
  
  // 1. max-w-3xl (768px) - 适合纯文本内容，类似飞书默认宽度   // 768px， 实际宽度要再减去一个内边距px-6 = 48px
  // 2. max-w-4xl (896px) - 适合混合内容（文本+代码+图片），推荐选择
  // 3. max-w-5xl (1024px) - 适合代码为主的内容
  // 4. max-w-6xl (1152px) - 适合宽表格和复杂布局
  
  // 根据内容类型选择合适的最大宽度：
  // - 如果主要是文档阅读：使用 max-w-3xl
  // - 如果是聊天界面：使用 max-w-4xl
  // - 如果是代码编辑器：使用 max-w-5xl 或 max-w-6xl
