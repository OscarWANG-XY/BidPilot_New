import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChangeHistoryTable } from '@/components/change_history/ChangeHistoryTable';
import { useChangeHistory } from '@/_hooks/useProjects/useProjectsHistory';
import { useProjects } from '@/_hooks/useProjects/useProjects';
import { 
  ArrowLeft, 
  FileText, 
  ListTodo, 
  LayersIcon, 
  HistoryIcon 
} from 'lucide-react';
import { useParams, useNavigate } from '@tanstack/react-router';

interface ChangeHistoryParams {
  project?: string;
  stage?: string;
  task?: string;
  fieldName?: string;
  search?: string;
  ordering?: string;
}

export const ProjectHistoryPage: React.FC = () => {
  const { projectId } = useParams({ from: '/projects/$projectId/history/' });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('project');
  const [params, setParams] = useState<ChangeHistoryParams>({ project: projectId });
  
  // 使用hooks
  const { singleProjectQuery } = useProjects();
  const { 
    projectChangeHistoryQuery, 
    stageChangeHistoryQuery, 
    taskChangeHistoryQuery 
  } = useChangeHistory();
  
  // 获取项目数据
  const { data: project, isLoading: isProjectLoading } = singleProjectQuery(projectId);
  
  // 获取变更历史数据
  const { 
    data: projectHistory, 
    isLoading: isProjectHistoryLoading 
  } = projectChangeHistoryQuery({ project: projectId, ...params });
  
  const { 
    data: stageHistory, 
    isLoading: isStageHistoryLoading 
  } = stageChangeHistoryQuery({ project: projectId, ...params });
  
  const { 
    data: taskHistory, 
    isLoading: isTaskHistoryLoading 
  } = taskChangeHistoryQuery({ project: projectId, ...params });

  // 处理标签切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // 重置参数，只保留项目ID
    setParams({ project: projectId });
  };

  // 处理搜索
  const handleSearch = (searchTerm: string) => {
    setParams(prev => ({ ...prev, search: searchTerm }));
  };

  // 处理排序
  const handleSort = (field: string) => {
    // 在当前排序字段前添加或移除'-'号来实现正序和倒序
    const currentOrdering = params.ordering || '';
    let newOrdering = '';
    
    if (currentOrdering === field) {
      // 当前为正序，改为倒序
      newOrdering = `-${field}`;
    } else if (currentOrdering === `-${field}`) {
      // 当前为倒序，清除排序
      newOrdering = '';
    } else {
      // 使用新字段排序
      newOrdering = field;
    }
    
    setParams(prev => ({ ...prev, ordering: newOrdering }));
  };

  // 处理字段筛选
  const handleFilterField = (fieldName: string) => {
    setParams(prev => ({ ...prev, fieldName: fieldName || undefined }));
  };

  // 返回项目详情页
  const handleGoBack = () => {
    navigate({ 
      to: '/projects/$projectId', 
      params: { projectId } 
    });
  };

  if (isProjectLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">加载项目数据中...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="mb-4">未找到项目数据</p>
            <Button onClick={handleGoBack}>返回项目列表</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <HistoryIcon className="h-6 w-6 mr-2" />
            {project.projectName} - 变更历史
          </h1>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="project" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            项目变更
          </TabsTrigger>
          <TabsTrigger value="stage" className="flex items-center">
            <LayersIcon className="h-4 w-4 mr-2" />
            阶段变更
          </TabsTrigger>
          <TabsTrigger value="task" className="flex items-center">
            <ListTodo className="h-4 w-4 mr-2" />
            任务变更
          </TabsTrigger>
        </TabsList>

        {/* 项目变更历史 */}
        <TabsContent value="project">
          <ChangeHistoryTable
            title="项目变更历史"
            items={projectHistory || []}
            isLoading={isProjectHistoryLoading}
            historyType="project"
            onSearch={handleSearch}
            onSort={handleSort}
            onFilterField={handleFilterField}
          />
        </TabsContent>

        {/* 阶段变更历史 */}
        <TabsContent value="stage">
          <ChangeHistoryTable
            title="阶段变更历史"
            items={stageHistory || []}
            isLoading={isStageHistoryLoading}
            historyType="stage"
            onSearch={handleSearch}
            onSort={handleSort}
            onFilterField={handleFilterField}
          />
        </TabsContent>

        {/* 任务变更历史 */}
        <TabsContent value="task">
          <ChangeHistoryTable
            title="任务变更历史"
            items={taskHistory || []}
            isLoading={isTaskHistoryLoading}
            historyType="task"
            onSearch={handleSearch}
            onSort={handleSort}
            onFilterField={handleFilterField}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};