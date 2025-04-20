// ProjectLayout.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { toast } from '@/_hooks/use-toast';
import { ProjectStatus } from '@/_types/projects_dt_stru/projects_interface';
import { useProjects } from '@/_hooks/useProjects/useProjects';
import { useUnsavedChangesWarning } from '../../../_hooks/useUnsavedChangeWarning';
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
  
  const { singleProjectQuery, updateProjectStatus, updateProjectTenderFileExtraction, isUpdating } = useProjects();
  const { data: project} = singleProjectQuery(projectId);
  const projectStatus = project?.status || ProjectStatus.IN_PROGRESS;
  console.log('project查询结果', project);

  // 获取招标文件提取信息
  const tenderFileData = project?.tenderFileExtraction;
  console.log('tenderFileData查询结果', tenderFileData);

  // 创建带项目ID前缀的本地存储键
  const getStorageKey = (key: string) => `project_${projectId}_${key}`;

  // 招标文件内容状态
  const [isEditing, setIsEditing] = useState<boolean>(() => {
    const saved = localStorage.getItem(getStorageKey('isEditing'));
    return saved === 'true';
  });

  const [editingContent, setEditingContent] = useState<any>(() => {
    return localStorage.getItem(getStorageKey('editingContent')) || '';
  });
  

  
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

  const handleStartEditing = async() => {
    if (tenderFileData) {
      setEditingContent(tenderFileData);
      setIsEditing(true);
      localStorage.setItem(getStorageKey('editingContent'), tenderFileData);
      localStorage.setItem(getStorageKey('isEditing'), 'true');
    }
  };

  const handleCancelEditing = async() => {
    if(tenderFileData) {
      setEditingContent(tenderFileData);
    }
    setIsEditing(false);
    localStorage.setItem(getStorageKey('isEditing'), 'false');
    localStorage.removeItem(getStorageKey('editingContent'));
  };

  const handleSaveEditingContent = async() => {
    try {
      await updateProjectTenderFileExtraction({
        projectId: projectId,
        extractionData: editingContent
      });
      
      setIsEditing(false);
      localStorage.removeItem(getStorageKey('isEditing'));
      localStorage.removeItem(getStorageKey('editingContent'));
      
      toast({
        title: "保存成功",
        description: "招标文件内容已更新",
      });
    } catch (error: any) {
      toast({
        title: "保存失败",
        description: error?.response?.data?.message || error.message || "更新招标文件内容时出错",
        variant: "destructive",
      });
    }
  };
  
  // 同步编辑内容到localStorage 
  useEffect(() => {
    if(isEditing) {
      localStorage.setItem(getStorageKey('editingContent'), editingContent || '');
    }
  }, [isEditing, editingContent, projectId]);

  // 当项目变更时，清理无关的编辑状态
  useEffect(() => {
    if(projectId) {
      // 不再需要单独存储currentProject，因为我们现在使用项目ID作为键前缀
      // 检查是否有编辑状态，如果没有则重置
      if(!tenderFileData) {
        setIsEditing(false);
        localStorage.removeItem(getStorageKey('editingContent'));
        localStorage.removeItem(getStorageKey('isEditing'));
      }
    }
  }, [tenderFileData, projectId]);

    // 使用自定义Hook来处理未保存更改的提醒
    useUnsavedChangesWarning(isEditing, '您有未保存的编辑内容，确定要离开吗？');



  // === 渲染 ===
  return (
    <div className="
      w-full      /* 宽度100%占满父容器 */
      mx-auto     /* 水平居中（需父容器有明确宽度时生效） */
      py-0        /* 垂直内边距为0（保持紧凑布局） */
      h-full      /* 高度100%占满父容器 */
    ">
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
          <MemoizedLeftContent children={children} />
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
            // 关于文档内容和编辑的props
            content={tenderFileData}
            isupdating={isUpdating}
            editingContent={editingContent}
            isEditing={isEditing}
            onStartEditing={handleStartEditing}
            onEditingContent={setEditingContent}
            onCancelEditing={handleCancelEditing}
            onSaveEditing={handleSaveEditingContent}
          />
        }
        isRightPanelOpen={docDrawerOpen}
        initialRightPanelWidth={rightPanelWidth} //在SplitLayout中，加了一个useEffect,确保props变化进行传递，屏幕大小不会变化
        className='h-[calc(100vh-9rem)]'
        // className={docDrawerOpen ? 
        //   'h-[calc(100vh-9rem)]' :  /* 当抽屉打开时，高度为视口高度减去9rem（144px） */
        //   ''                          /* 默认高度 */
        // }
        onWidthChange={(width) => {
          console.log("SplitLayout width changed to:", width);
          setRightPanelWidth(width);
        }}
      />
    </div>
  );
};