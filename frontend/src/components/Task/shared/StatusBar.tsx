import React from 'react';
import { TaskStatus } from '../hook&APIs.tsx/tasksApi';

interface StatusBarProps {
  task: any;
  isLoading: boolean;
  isError: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ task, isLoading, isError }) => {
  // 获取状态显示文本
  const getStatusText = () => {
    if (isLoading) return '加载中...';
    if (isError) return '加载错误';
    if (!task) return '无任务数据';
    
    switch (task.status) {
      case TaskStatus.PENDING:
        return '等待前置任务';
      case TaskStatus.CONFIGURING:
        return '配置中';
      case TaskStatus.ANALYZING:
        return '分析中';
      case TaskStatus.REVIEWING:
        return '审核中';
      case TaskStatus.COMPLETED:
        return '已完成';
      default:
        return `未知状态: ${task.status}`;
    }
  };
  
  // 获取状态颜色
  const getStatusColor = () => {
    if (isLoading) return 'bg-gray-400';
    if (isError) return 'bg-red-500';
    if (!task) return 'bg-gray-400';
    
    switch (task.status) {
      case TaskStatus.PENDING:
        return 'bg-gray-400';
      case TaskStatus.CONFIGURING:
        return 'bg-blue-400';
      case TaskStatus.ANALYZING:
        return 'bg-yellow-400';
      case TaskStatus.REVIEWING:
        return 'bg-purple-400';
      case TaskStatus.COMPLETED:
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2`}></div>
        <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
      </div>
      
      {task && (
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          {task.id && (
            <span>任务ID: {task.id.substring(0, 8)}...</span>
          )}
          {task.createdAt && (
            <span>创建时间: {new Date(task.createdAt).toLocaleString()}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusBar; 