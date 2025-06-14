// ProjectLayout.tsx
import React, { useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { toast } from '@/_hooks/use-toast';
import { ProjectStatus } from '@/_types/projects_dt_stru/projects_interface';
import { useProjects } from '@/_hooks/useProjects/useProjects';
// 导入子组件
import { ProjectNavigation } from './ProjectNavigation';
import { ProjectStatusAlert } from './ProjectStatusAlert';
import { DocumentDrawer } from './DocumentDrawer';
import { SplitLayout } from './SplitLayout';

// 定义 Tab 配置
const TABS = [
  {
    value: 'bidpilot',
    label: 'BidPilot',
    to: '/projects/$projectId/bidpilot',
  },
  {
    value: 'artifacts',
    label: '过程文件',
    to: '/projects/$projectId/artifacts',
  },
  {
    value: 'finalization',
    label: '最终文档',
    to: '/projects/$projectId/finalization',
  },
  {
    value: 'expertise',
    label: '专家建议',
    to: '/projects/$projectId/expertise',
  },
  {
    value: 'raw_data',
    label: '原始数据',
    to: '/projects/$projectId/raw_data',
  },
];

interface ProjectLayoutProps {
  projectId: string;
  children: React.ReactNode;
}

// 在 SplitLayout 组件中，使用 React.memo 包装左侧内容，防止不必要的重渲染
const MemoizedLeftContent = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="min-h-full p-0">
    {children}
  </div>
));

export const ProjectLayout: React.FC<ProjectLayoutProps> = ({ projectId, children }) => {
  // === 状态管理 ===
  // 1. 文档抽屉状态
  const [docDrawerOpen, setDocDrawerOpen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(50); // 默认50%
  
  // 2. 路由和项目数据状态
  const location = useLocation();
  const currentTab = TABS.find((tab) => 
    location.pathname.endsWith(tab.value)
  )?.value || TABS[0].value;
  
  const { singleProjectQuery } = useProjects();
  const { data: project} = singleProjectQuery(projectId);
  const projectStatus = project?.status || ProjectStatus.IN_PROGRESS;
  console.log('project查询结果', project);

  // 获取招标文件提取信息
  const tenderFileData = project?.tenderFileExtraction;
  console.log('tenderFileData查询结果', tenderFileData);

  // === 处理函数 ===
  // 1. 文档抽屉控制
  const handleDocDrawerToggle = () => {
    setDocDrawerOpen(!docDrawerOpen);
    
    if (!docDrawerOpen) {
      toast({
        title: "已打开招标文件",
        description: "可拖动中间分隔线调整窗口大小",
        duration: 3000,
      });
    }
  };
  
  // 3. 文档宽度变化处理
  const handleRightPanelWidthChange = (newWidth: number) => {
    setRightPanelWidth(newWidth);
  };

  // === 渲染 ===
  return (
    <div className="
      w-full      /* 宽度100%占满父容器 */
      mx-auto     /* 水平居中（需父容器有明确宽度时生效） */
      py-0        /* 垂直内边距为0（保持紧凑布局） */
      h-full      /* 高度100%占满父容器 */
    ">
      {/* 3. 使用 SplitLayout 组件管理左右分栏 */}
      <SplitLayout
        leftContent={
          <MemoizedLeftContent>
            {/* 1. 项目导航组件 */}
            <ProjectNavigation 
              tabs={TABS}
              projectId={projectId}
              currentTab={currentTab}
              projectStatus={projectStatus}
              docDrawerOpen={docDrawerOpen}
              onDocDrawerToggle={handleDocDrawerToggle}
            />
            
            {/* 2. 项目状态提示组件 */}
            <ProjectStatusAlert status={projectStatus} />
            
            {/* 3. 主要内容 */}
            {children}
          </MemoizedLeftContent>
        }
        rightContent={
          <DocumentDrawer 
            // 关于抽屉效果的props
            isOpen={true} // SplitLayout 已经处理显示逻辑
            rightPanelWidth={rightPanelWidth}   // 传递给DocumentDrawer，为了配合toggleMaximize使用。 改变不是右侧的宽度。  
            onClose={handleDocDrawerToggle}
            onWidthChange={(width) => {
              console.log("DocumentDrawer requested width change to:", width);
              handleRightPanelWidthChange(width);
            }}
            // 关于文档内容的props
            content={tenderFileData || ''}
          />
        }
        isRightPanelOpen={docDrawerOpen}
        initialRightPanelWidth={rightPanelWidth}
        className='h-screen'
        onWidthChange={(width) => {
          console.log("SplitLayout width changed to:", width);
          setRightPanelWidth(width);
        }}
      />
    </div>
  );
};