import React, { useState, useRef, useEffect } from 'react'
// import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from '@/_hooks/use-toast'
import { ProjectStatus } from '@/_types/projects_dt_stru/projects_interface'
import { useProjects } from '@/_hooks/useProjects/useProjects'
import { FileText, X, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import TiptapEditor from '@/components/TiptapEditor/TiptapEditor';

interface ProjectLayoutProps {
  projectId: string
  children: React.ReactNode  // 宽泛的类型定义，可以是React组件或HTML元素，或string, 或null, 或boolean, 等等
}

// 定义 Tab 配置
// 未来可以在这里添加新的tab和路由，比如添加招标公告的分析。 
const TABS = [
  {
    value: 'tender-analysis',
    label: '招标文件分析',
    to: '/projects/$id/tender-analysis',
  },
  {
    value: 'bid-writing',
    label: '投标文件编写',
    to: '/projects/$id/bid-writing',
  },
]


// React.FC 是 React Function Component
export const ProjectLayout: React.FC<ProjectLayoutProps> = ({ projectId, children }) => {
  // 用于控制文档抽屉的状态
  const [docDrawerOpen, setDocDrawerOpen] = useState(false);
  
  // 用于调整抽屉宽度的参数
  const [docDrawerWidth, setDocDrawerWidth] = useState(50); // 默认50%
  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  
  // 使用 useLocation 来监听路由变化， 而不是使用router, 之前使用router.state.location并不会自动触发更新
  const location = useLocation()
  
  // 根据当前路由动态设置选中的 Tab
  const currentTab = TABS.find((tab) => 
    location.pathname.endsWith(tab.value)
  )?.value || TABS[0].value

  // 使用项目相关钩子
  const { 
    singleProjectQuery, 
    updateProjectStatus, 
    projectTenderFileExtractionQuery, 
    updateProjectTenderFileExtraction 
  } = useProjects()
  
  const { data: project } = singleProjectQuery(projectId)
  const projectStatus = project?.status || ProjectStatus.IN_PROGRESS;
  
  // 获取招标文件提取信息
  const { data: tenderFileData, isLoading: isTenderFileLoading, refetch: refetchTenderFile } = projectTenderFileExtractionQuery(projectId);
  
  // 招标文件内容状态
  const [docContent, setDocContent] = useState<any>(tenderFileData?.tenderFileExtration);
  const [isDocContentChanged, setIsDocContentChanged] = useState(false);
  
  // 当从API获取到数据时，更新文档内容
  useEffect(() => {
    if (tenderFileData?.tenderFileExtration) {
      try {
        // // 尝试解析JSON字符串（如果后端存储为字符串）
        // const parsedContent = typeof tenderFileData.tenderFileExtration === 'string' 
        //   ? JSON.parse(tenderFileData.tenderFileExtration)
        //   : tenderFileData.tenderFileExtration;
        setDocContent(tenderFileData.tenderFileExtration);
        setIsDocContentChanged(false); // 重置变更状态
      } catch (error) {
        console.error('解析招标文件内容失败:', error);
        toast({
          title: "加载招标文件失败",
          description: "文件格式不正确，已加载默认内容",
          variant: "destructive",
        });
      }
    }
  }, [tenderFileData]);
  
  // 当抽屉打开时，刷新招标文件内容
  useEffect(() => {
    if (docDrawerOpen) {
      refetchTenderFile();
    }
  }, [docDrawerOpen, refetchTenderFile]);
  
  // 处理文档内容变更
  const handleDocContentChange = (newContent: any) => {
    setDocContent(newContent);
    setIsDocContentChanged(true);
  };
  
  // 保存文档内容
  const saveDocContent = async () => {
    try {
      await updateProjectTenderFileExtraction({
        projectId,
        extractionData: docContent
      });
      
      setIsDocContentChanged(false);
      toast({
        title: "保存成功",
        description: "招标文件内容已更新",
      });
      
      // 保存成功后刷新数据
      refetchTenderFile();
    } catch (error: any) {
      toast({
        title: "保存失败",
        description: error?.response?.data?.message || error.message || "更新招标文件内容时出错",
        variant: "destructive",
      });
    }
  };
  
  // 处理项目取消
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

  // 处理鼠标拖动调整大小
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    // 添加特殊的光标样式到 body，使拖动时整个页面都显示调整尺寸的光标
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // 防止文本选择
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;
    
    // 计算文档抽屉宽度百分比，并限制在20%到80%之间
    let newWidth = (mouseX / containerWidth) * 100;
    newWidth = Math.min(Math.max(newWidth, 20), 80);
    
    setDocDrawerWidth(100 - newWidth); // 反转，因为抽屉在右侧
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    
    // 恢复默认光标
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // 显示一个轻量级的成功消息，提示用户调整成功
    toast({
      title: "布局已调整",
      description: `主窗口: ${Math.round(100 - docDrawerWidth)}%, 文档窗口: ${Math.round(docDrawerWidth)}%`,
      duration: 2000,
    });
  };

  // 添加和移除鼠标事件监听器
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // 确保在组件卸载时恢复默认光标
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, docDrawerWidth]);

  // 切换文档抽屉显示状态
  const toggleDocDrawer = () => {
    setDocDrawerOpen(!docDrawerOpen);
    
    if (!docDrawerOpen) {
      // 打开抽屉时显示提示
      toast({
        title: "已打开招标文件",
        description: "可拖动中间分隔线调整窗口大小",
        duration: 3000,
      });
    }
  };

  return (
    <div className="w-full mx-auto py-6">
      {/* Tab 导航 - 添加了flex布局使按钮靠右 */}
      <div className="flex justify-between items-center mb-4 bg-gray-50 p-4 rounded-lg shadow-sm">
        <Tabs value={currentTab}>
          <TabsList className="w-auto bg-white shadow-sm">
            {TABS.map((tab) => (
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
        
        {/* 添加项目操作按钮区域 */}
        <div className="flex gap-3">
          {/* 添加文档查看按钮 */}
          <Button 
            variant={docDrawerOpen ? "default" : "outline"} 
            size="sm" 
            onClick={toggleDocDrawer}
            className="transition-all duration-300 ease-in-out"
          >
            <FileText className="w-4 h-4 mr-2" />
            {docDrawerOpen ? "隐藏招标文件" : "查看招标文件"}
          </Button>
          
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
                  <AlertDialogAction onClick={handleCancelProject} className="shadow-sm">
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
      
      {/* 显示项目状态提示（如果已取消） */}
      {projectStatus === ProjectStatus.CANCELLED && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          此项目已被取消，所有相关工作已停止。
        </div>
      )}
      
      {/* 显示项目状态提示（如果已取消） */}
      {projectStatus === ProjectStatus.CANCELLED && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 shadow-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="font-medium">此项目已被取消，所有相关工作已停止。</div>
          </div>
        </div>
      )}
      
      {/* 使用 Flex 布局实现左右分栏 */}
      <div 
        ref={containerRef}
        className={`flex transition-all duration-300 ease-in-out relative rounded-lg overflow-hidden shadow-md ${docDrawerOpen ? 'h-[calc(100vh-16rem)]' : ''}`}
      >
        {/* 主内容区域 - 添加独立滚动 */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-auto bg-white ${
            docDrawerOpen ? `w-[${100 - docDrawerWidth}%]` : 'w-full'
          }`}
          style={{ width: docDrawerOpen ? `${100 - docDrawerWidth}%` : '100%' }}
        >
          <div className="min-h-full p-6">
            {/* 在父组件即project$id路由里，ProjectLayout 包裹的内容会被放到children的位置*/}  
            {children}   
          </div>
        </div>
        
        {/* 可调整宽度的分隔线 */}
        {docDrawerOpen && (
          <div 
            ref={resizeRef}
            className="w-1 bg-gray-200 hover:bg-primary cursor-col-resize flex items-center justify-center z-10 transition-colors group"
            onMouseDown={handleMouseDown}
          >
            <div className="h-20 w-6 absolute bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <div className="flex flex-col items-center justify-center space-y-1">
                <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-primary" />
              </div>
            </div>
          </div>
        )}
        
        {/* 文档抽屉区域 - 添加独立滚动 */}
        <div 
          className={`bg-gray-50 border-l border-gray-200 transition-all duration-300 ease-in-out ${
            docDrawerOpen ? `w-[${docDrawerWidth}%]` : 'w-0'
          }`}
          style={{ width: docDrawerOpen ? `${docDrawerWidth}%` : '0', overflow: docDrawerOpen ? 'visible' : 'hidden' }}
        >
          {docDrawerOpen && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b sticky top-0 bg-white z-10 shadow-sm flex justify-between items-center">
                <div className="text-lg font-medium text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  招标文件内容
                </div>
                <div className="flex space-x-2">
                  {isDocContentChanged && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={saveDocContent}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      保存更改
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => setDocDrawerWidth(docDrawerWidth === 50 ? 80 : 50)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500" 
                    onClick={toggleDocDrawer}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-white m-3 rounded-md shadow-sm">
                {isTenderFileLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-gray-600">加载招标文件...</span>
                  </div>
                ) : (
                  <TiptapEditor
                    initialContent={docContent}
                    onChange={handleDocContentChange}
                    readOnly={false}
                    maxWidth="100%"
                    minWidth="100%"
                    maxHeight="100%"
                    minHeight="100%"
                    showToc={true}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}