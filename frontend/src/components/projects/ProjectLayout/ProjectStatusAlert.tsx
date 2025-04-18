// ProjectStatusAlert.tsx  完成审核 
import React from 'react';
import { ProjectStatus } from '@/_types/projects_dt_stru/projects_interface';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ProjectStatusAlertProps {
  status: ProjectStatus;
}

export const ProjectStatusAlert: React.FC<ProjectStatusAlertProps> = ({ status }) => {
  // 如果项目状态不是已取消或需要提示的状态，则不显示任何内容
  if (status !== ProjectStatus.CANCELLED && status !== ProjectStatus.COMPLETED) {
    return null;
  }

// 根据不同的项目状态显示不同的提示内容
switch (status) {
    case ProjectStatus.CANCELLED:
      return (
        <div className={`
          mb-4        /* 下外边距16px，与其他元素保持间距 */
          p-4         /* 内边距16px，保证内容呼吸空间 */
          bg-red-50   /* 浅红色背景，表示警告状态 */
          border      /* 边框基础样式 */
          border-red-200  /* 浅红色边框，与背景色协调 */
          rounded-md  /* 6px圆角，柔和边缘 */
          text-red-700  /* 深红色文字，确保可读性 */
          shadow-sm   /* 小型阴影，增加层次感 */
        `}>
          <div className={`
            flex         /* 启用flex布局 */
            items-center /* 子元素垂直居中 */
            space-x-2    /* 子元素水平间距8px */
          `}>
            <AlertCircle className="w-5 h-5" />  {/* 图标固定20x20px尺寸 */}
            <div className="font-medium">  {/* 中等字重，强调文本 */}
              此项目已被取消，所有相关工作已停止。
            </div>
          </div>
        </div>
      );
  
    case ProjectStatus.COMPLETED:
      return (
        <div className={`
          mb-4          /* 下外边距16px */
          p-4           /* 内边距16px */
          bg-green-50   /* 浅绿色背景，表示成功状态 */
          border        /* 边框基础样式 */
          border-green-200  /* 浅绿色边框 */
          rounded-md    /* 6px圆角 */
          text-green-700  /* 深绿色文字 */
          shadow-sm     /* 小型阴影 */
        `}>
          <div className={`
            flex         /* flex布局 */
            items-center /* 垂直居中 */
            space-x-2    /* 水平间距8px */
          `}>
            <CheckCircle className="w-5 h-5" />  {/* 图标尺寸20x20px */}
            <div className="font-medium">  {/* 中等字重文本 */}
              此项目已完成，您可以查看所有相关内容。
            </div>
          </div>
        </div>
      );
    }
  }