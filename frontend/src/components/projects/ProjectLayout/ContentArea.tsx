// ContentArea.tsx 完成审核
import React from 'react';

interface ContentAreaProps {
  isDrawerOpen: boolean;
  drawerWidth: number;
  children: React.ReactNode;
}

export const ContentArea: React.FC<ContentAreaProps> = ({ 
  isDrawerOpen, 
  drawerWidth, 
  children 
}) => {
  // 计算内容区域的宽度
  const contentWidth = isDrawerOpen ? 100 - drawerWidth : 100;
  
  return (
    <div 
      className="
        transition-all      /* 所有CSS属性变化时添加过渡效果 */
        duration-300        /* 过渡动画持续300毫秒 */
        ease-in-out        /* 过渡动画缓动函数：慢-快-慢 */
        overflow-auto      /* 内容溢出时显示滚动条 */
        bg-white           /* 白色背景 */
      "
      style={{ 
        width: `${contentWidth}%`  /* 动态宽度，由父组件控制的百分比值 */ 
      }}
    >
      <div className="
        min-h-full        /* 最小高度撑满父容器 */
        p-6              /* 内边距24px（1.5rem），提供内容呼吸空间 */
      ">
        {children}
      </div>
    </div>
  );
};