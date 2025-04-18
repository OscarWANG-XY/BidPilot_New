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
    value: 'tender-analysis',
    label: '招标文件分析',
    to: '/projects/$projectId/tender-analysis',
  },
  {
    value: 'bid-writing',
    label: '投标文件编写',
    to: '/projects/$projectId/bid-writing',
  },
];

// 示例文档内容
const sampleDocContent = {
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "招标文件示例" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "本文档包含项目招标的详细信息和要求。" }
      ]
    },
    // ... 其他文档内容
  ]
};

interface ProjectLayoutProps {
  projectId: string;
  children: React.ReactNode;
}

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
  
  const { singleProjectQuery, updateProjectStatus, projectTenderFileExtractionQuery, updateProjectTenderFileExtraction } = useProjects();
  const { data: project } = singleProjectQuery(projectId);
  const projectStatus = project?.status || ProjectStatus.IN_PROGRESS;
    // 获取招标文件提取信息
  const { data: tenderFileData, isLoading: isTenderFileLoading, refetch: refetchTenderFile } = projectTenderFileExtractionQuery(projectId);

  // 招标文件内容状态
  const [docContent, setDocContent] = useState<any>(tenderFileData?.tenderFileExtration);
  const [isDocContentChanged, setIsDocContentChanged] = useState(false);
  // 
  
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
  
  // 2. 项目取消处理
  const handleCancelProject = async () => {
    try {
      await updateProjectStatus({
        id: projectId,
        status: ProjectStatus.CANCELLED,
        remarks: "用户手动取消项目"
      });
      
      toast({
        title: "项目已取消",
        description: "项目状态已更新为已取消",
      });
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error?.response?.data?.message || error.message || "取消项目时出错",
        variant: "destructive",
      });
    }
  };
  
  // 3. 文档宽度变化处理
  const handleRightPanelWidthChange = (newWidth: number) => {
    setRightPanelWidth(newWidth);
  };
  
  // === 渲染 ===
  return (
    <div className="w-full mx-auto py-6">
      {/* 1. 项目导航组件 */}
      <ProjectNavigation 
        tabs={TABS}
        projectId={projectId}
        currentTab={currentTab}
        projectStatus={projectStatus}
        docDrawerOpen={docDrawerOpen}
        onDocDrawerToggle={handleDocDrawerToggle}
        onCancelProject={handleCancelProject}
      />
      
      {/* 2. 项目状态提示组件 */}
      <ProjectStatusAlert status={projectStatus} />
      
      {/* 3. 使用 SplitLayout 组件管理左右分栏 */}
      <SplitLayout
        leftContent={
          <div className="min-h-full p-6">
            {children}
          </div>
        }
        rightContent={
          <DocumentDrawer 
            isOpen={true} // SplitLayout 已经处理显示逻辑
            rightPanelWidth={rightPanelWidth}   // 传递给DocumentDrawer，为了配合toggleMaximize使用。 改变不是右侧的宽度。  
            content={sampleDocContent}
            onClose={handleDocDrawerToggle}
            onWidthChange={(width) => {
              console.log("DocumentDrawer requested width change to:", width);
              handleRightPanelWidthChange(width);
            }}
          />
        }
        isRightPanelOpen={docDrawerOpen}
        initialRightPanelWidth={rightPanelWidth} //在SplitLayout中，加了一个useEffect,确保props变化进行传递，屏幕大小不会变化
        className={docDrawerOpen ? 'h-[calc(100vh-16rem)]' : ''}
        onWidthChange={(width) => {
          console.log("SplitLayout width changed to:", width);
          setRightPanelWidth(width);
        }}
      />
    </div>
  );
};