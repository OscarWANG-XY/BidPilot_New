// ProjectNavigation.tsx
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { ProjectStatus } from '@/_types/projects_dt_stru/projects_interface';

// 定义标签页的结构
interface TabItem {
  value: string;
  label: string;
  to: string;
}

// ProjectNavigation 组件的 props 接口
interface ProjectNavigationProps {
  tabs: TabItem[];
  projectId: string;
  currentTab: string;
  projectStatus: ProjectStatus;
  docDrawerOpen: boolean;
  onDocDrawerToggle: () => void;
}

export const ProjectNavigation: React.FC<ProjectNavigationProps> = ({
  tabs,
  projectId,
  currentTab,
  projectStatus,
  docDrawerOpen,
  onDocDrawerToggle,
}) => {
  return (
    <div className="flex justify-between items-center mb-0 p-0 rounded-lg">
      {/* 
        外层容器样式：
        - flex：水平排列导航和按钮区域
        - justify-between：两端对齐
        - items-center：垂直居中对齐
        - mb-4：底部外边距
        - bg-gray-50：浅灰背景
        - p-4：内边距
        - rounded-lg：圆角
        - shadow-sm：浅阴影
      */}
      
      {/* 标签页导航 */}
      <Tabs value={currentTab}>
        <TabsList className="bg-transparent border-0 p-0 h-auto m-0">
          {/*
            标签列表样式：
            - w-auto：宽度自适应
            - bg-white：白色背景
            - shadow-sm：浅阴影，提升层次感
          */}
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value} 
              className="
                relative px-2 py-1 text-sm font-normal
                bg-transparent border-0 shadow-none
                text-muted-foreground hover:text-foreground
                data-[state=active]:text-foreground
                data-[state=active]:bg-transparent
                data-[state=active]:shadow-none
                transition-colors duration-200
                before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5
                before:bg-transparent before:transition-colors before:duration-200
                data-[state=active]:before:bg-primary
                rounded-none
              " 
              asChild
            >
              {/*
                每个标签按钮样式：
                - px-6 py-2：内边距，增强点击区域
                - data-[state=active]:bg-primary：激活状态下背景色为主题色
                - data-[state=active]:text-primary-foreground：激活状态下文字色为前景主题色
                - font-medium：中等字体粗细
              */}
              <Link to={tab.to} params={{ projectId: projectId }}>
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      {/* 操作按钮区域 */}
      <div className="flex gap-3">
        {/*按钮区域样式： flex：水平排列按钮   gap-3：按钮之间间距*/}
  
        {/* 文档查看按钮 */}
        <Button 
          variant={docDrawerOpen ? "default" : "outline"} 
          size="sm" 
          onClick={onDocDrawerToggle}
          className="transition-all duration-300 ease-in-out"
        >
          {/* - variant：根据是否展开切换样式 - size="sm"：小尺寸按钮 - transition-all duration-300 ease-in-out：平滑的过渡动画 */}
          <FileText className="w-4 h-4 mr-2" />
          {/* 图标样式：- w-4 h-4：图标大小； - mr-2：图标与文字之间的间距*/}
          {/* {docDrawerOpen ? "隐藏招标文件" : "查看招标文件"} */}
        </Button>
          
        {/* 项目已取消：显示红色提示标签 */}
        {projectStatus === ProjectStatus.CANCELLED && (
          <div className="px-4 py-2 bg-red-50 text-red-800 rounded-md text-sm font-medium border border-red-200 shadow-sm">
            {/*  px-4 py-2：内边距  bg-red-50：浅红背景  text-red-800：深红字体 rounded-md：中等圆角 text-sm：小字号 font-medium：中等字体粗细 border border-red-200：浅红边框  shadow-sm：浅阴影
            */}
            项目已取消
          </div>
        )}
  
        {/* 项目已完成：显示绿色提示标签 */}
        {projectStatus === ProjectStatus.COMPLETED && (
          <div className="px-4 py-2 bg-green-50 text-green-800 rounded-md text-sm font-medium border border-green-200 shadow-sm">
            {/* 同上，颜色为绿色 */}
            项目已完成
          </div>
        )}
      </div>
    </div>
  );  
};