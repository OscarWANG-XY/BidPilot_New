import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  ProjectChangeHistory, 
  StageChangeHistory, 
  TaskChangeHistory 
} from '@/types/projects_dt_stru';
import { ArrowUpDown, Search, History, ExternalLink } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useParams } from '@tanstack/react-router';

// 定义通用属性，适用于所有变更历史类型
type ChangeHistoryItem = ProjectChangeHistory | StageChangeHistory | TaskChangeHistory;

interface ChangeHistoryTableProps {
  title: string;
  items: ChangeHistoryItem[];
  isLoading: boolean;
  historyType: 'project' | 'stage' | 'task';
  onSearch?: (searchTerm: string) => void;
  onSort?: (field: string) => void;
  onFilterField?: (fieldName: string) => void;
}

export const ChangeHistoryTable: React.FC<ChangeHistoryTableProps> = ({
  title,
  items,
  isLoading,
  historyType,
  onSearch,
  onSort,
  onFilterField
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { projectId } = useParams({ from: '/projects/$projectId/history/' });

  // 处理搜索
  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  // 处理排序
  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  // 处理字段筛选
  const handleFieldFilter = (value: string) => {
    if (onFilterField) {
      onFilterField(value==='all-fields' ? '' : value);
    }
  };

  // 处理查看详情
  const handleViewDetail = (item: ChangeHistoryItem) => {
    navigate({ 
      to: `/projects/$projectId/history/${historyType}/$historyId`,
      params: { 
        projectId, 
        historyId: item.id 
      }
    });
  };

  // 格式化日期时间
  const formatDateTime = (dateString: string | Date) => {
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

  // 提取所有唯一的字段名用于筛选

  console.log('历史记录项目:', items);
  console.log('所有记录的字段名:', items.map(item => ({fieldName: item.fieldName, type: typeof item.fieldName})));
  const uniqueFieldNames = Array.from(new Set(items.map(item => item.fieldName)));

  // 提取所有唯一的字段名用于筛选console.log('所有字段名:', uniqueFieldNames);
  console.log('是否有空字段名:', uniqueFieldNames.some(field => !field || field === ''));
  //console.log('是否有null字段名:', uniqueFieldNames.includes(null));
  //console.log('是否有undefined字段名:', uniqueFieldNames.includes(undefined));

  // 尝试过滤空值
  const filteredFieldNames = uniqueFieldNames.filter(field => field && field.trim() !== '');
  console.log('过滤后的字段名:', filteredFieldNames); 
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {/* 搜索框 */}
          <div className="flex">
            <Input
              placeholder="搜索变更记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 mr-2"
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4 mr-1" />
              搜索
            </Button>
          </div>
          
          {/* 字段筛选 */}
          {onFilterField && uniqueFieldNames.length > 0 && (
            <Select onValueChange={handleFieldFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="筛选字段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-fields">所有字段</SelectItem>
                {uniqueFieldNames.map(field => (
                    <SelectItem key={`field-${field}`} value={field}>
                      {field}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">加载中...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            暂无变更记录
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('changedAt')}
                      className="flex items-center"
                    >
                      变更时间
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('fieldName')}
                      className="flex items-center"
                    >
                      变更字段
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>旧值</TableHead>
                  <TableHead>新值</TableHead>
                  <TableHead className="w-[150px]">操作人</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {formatDateTime(item.changedAt)}
                    </TableCell>
                    <TableCell>{item.fieldName}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.oldValue === null ? <span className="text-gray-400">无</span> : item.oldValue}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.newValue === null ? <span className="text-gray-400">无</span> : item.newValue}
                    </TableCell>
                    <TableCell>
                      {item.changedBy?.phone || '系统'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.remarks || <span className="text-gray-400">无</span>}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetail(item)}
                        title="查看详细信息"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};