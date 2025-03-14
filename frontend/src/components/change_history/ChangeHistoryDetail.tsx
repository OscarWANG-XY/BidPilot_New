import React from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useChangeHistory } from '@/hooks/useChangeHistory';
import { ArrowLeft, Clock, User, FileText, Tag } from 'lucide-react';
import { 
  TaskChangeHistory 
} from '@/types/projects_dt_stru';

type HistoryType = 'project' | 'stage' | 'task';

interface ChangeHistoryDetailProps {
  historyType: HistoryType;
}

export const ChangeHistoryDetail: React.FC<ChangeHistoryDetailProps> = ({ historyType }) => {
  // 使用Tanstack Router的useParams获取参数
  const { historyId = '', projectId = '' } = useParams({ from: '/projects/$projectId/history/$historyId' });
  
  const navigate = useNavigate();

  // 选择适当的查询hook
  const { 
    singleProjectChangeHistoryQuery, 
    singleStageChangeHistoryQuery, 
    singleTaskChangeHistoryQuery 
  } = useChangeHistory();

  // 根据historyType选择查询
  const queryHook = React.useMemo(() => {
    if (historyType === 'project') {
      return singleProjectChangeHistoryQuery(historyId);
    } else if (historyType === 'stage') {
      return singleStageChangeHistoryQuery(historyId);
    } else {
      return singleTaskChangeHistoryQuery(historyId);
    }
  }, [historyType, historyId, singleProjectChangeHistoryQuery, singleStageChangeHistoryQuery, singleTaskChangeHistoryQuery]);

  const { data: historyItem, isLoading, isError } = queryHook;

  // 格式化日期时间
  const formatDateTime = (dateString: string | Date) => {
    if (!dateString) return '未知时间';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // 返回按钮处理函数
  const handleGoBack = () => {
    navigate({ 
      to: '/projects/$projectId/history', 
      params: { projectId } 
    });
  };

  // 复杂字段值的渲染
  const renderFieldValue = (value: string | null) => {
    if (value === null) return <span className="text-gray-400">无</span>;
    
    // 尝试解析JSON，如果是JSON则格式化显示
    try {
      const parsedValue = JSON.parse(value);
      return (
        <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
          {JSON.stringify(parsedValue, null, 2)}
        </pre>
      );
    } catch (e) {
      // 不是JSON，显示普通文本
      return <p className="whitespace-pre-wrap break-words">{value}</p>;
    }
  };

  // 检查是否是任务历史记录并且有变更摘要
  const hasChangeSummary = (): boolean => {
    if (historyType !== 'task' || !historyItem) return false;
    
    const taskHistory = historyItem as TaskChangeHistory;
    return !!(taskHistory.isComplexField && taskHistory.changeSummary);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">加载变更详情中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !historyItem) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="mb-4 text-red-500">加载变更详情失败</p>
            <Button onClick={handleGoBack}>返回变更历史</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            {`${historyItem.fieldName} 字段变更详情`}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回列表
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 变更基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-2">
            <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">变更时间</p>
              <p>{formatDateTime(historyItem.changedAt)}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <User className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">操作人</p>
              <p>{historyItem.changedBy?.phone || '系统'}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Tag className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">操作 ID</p>
              <p className="font-mono text-sm">{historyItem.operationId}</p>
            </div>
          </div>
          
          {historyType === 'task' && (
            <div className="flex items-start space-x-2">
              <Tag className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">任务类型</p>
                <p>{(historyItem as TaskChangeHistory).taskType}</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* 备注信息 */}
        {historyItem.remarks && (
          <div>
            <h3 className="text-lg font-medium mb-2">备注</h3>
            <p className="bg-gray-50 p-4 rounded-md">{historyItem.remarks}</p>
          </div>
        )}
        
        {/* 变更内容 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">变更内容</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="font-medium mb-2">旧值</h4>
              <div className="bg-gray-50 p-4 rounded-md min-h-[50px]">
                {renderFieldValue(historyItem.oldValue)}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">新值</h4>
              <div className="bg-gray-50 p-4 rounded-md min-h-[50px]">
                {renderFieldValue(historyItem.newValue)}
              </div>
            </div>
          </div>
        </div>
        
        {/* 对于复杂字段，显示摘要信息 */}
        {hasChangeSummary() && (
          <div>
            <h3 className="text-lg font-medium mb-2">变更摘要</h3>
            <p className="bg-gray-50 p-4 rounded-md">
              {(historyItem as TaskChangeHistory).changeSummary}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" onClick={handleGoBack}>返回变更历史</Button>
      </CardFooter>
    </Card>
  );
};