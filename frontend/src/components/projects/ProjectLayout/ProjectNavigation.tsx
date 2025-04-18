// ProjectNavigation.tsx
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  onCancelProject: () => void;
}

export const ProjectNavigation: React.FC<ProjectNavigationProps> = ({
  tabs,
  projectId,
  currentTab,
  projectStatus,
  docDrawerOpen,
  onDocDrawerToggle,
  onCancelProject
}) => {
  return (
    <div className="flex justify-between items-center mb-4 bg-gray-50 p-4 rounded-lg shadow-sm">
      {/* 标签页导航 */}
      <Tabs value={currentTab}>
        <TabsList className="w-auto bg-white shadow-sm">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value} 
              className="px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium" 
              asChild
            >
              <Link to={tab.to} params={{ projectId: projectId }}>
                {tab.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      {/* 操作按钮区域 */}
      <div className="flex gap-3">
        {/* 文档查看按钮 */}
        <Button 
          variant={docDrawerOpen ? "default" : "outline"} 
          size="sm" 
          onClick={onDocDrawerToggle}
          className="transition-all duration-300 ease-in-out"
        >
          <FileText className="w-4 h-4 mr-2" />
          {docDrawerOpen ? "隐藏招标文件" : "查看招标文件"}
        </Button>
        
        {/* 根据项目状态显示不同的按钮或标签 */}
        {projectStatus === ProjectStatus.IN_PROGRESS && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shadow-sm">
                取消项目
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-0 shadow-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>确认取消项目</AlertDialogTitle>
                <AlertDialogDescription>
                  取消项目后，所有相关工作将停止。此操作不可逆，确定要继续吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="shadow-sm">返回</AlertDialogCancel>
                <AlertDialogAction onClick={onCancelProject} className="shadow-sm">
                  确认取消
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {projectStatus === ProjectStatus.CANCELLED && (
          <div className="px-4 py-2 bg-red-50 text-red-800 rounded-md text-sm font-medium border border-red-200 shadow-sm">
            项目已取消
          </div>
        )}
        
        {projectStatus === ProjectStatus.COMPLETED && (
          <div className="px-4 py-2 bg-green-50 text-green-800 rounded-md text-sm font-medium border border-green-200 shadow-sm">
            项目已完成
          </div>
        )}
      </div>
    </div>
  );
};