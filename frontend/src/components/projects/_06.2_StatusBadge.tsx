import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PhaseStatus, TaskStatus } from './types';

interface StatusBadgeProps {
  status: PhaseStatus | TaskStatus;
  showText?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showText = true }) => {
  const getStatusConfig = () => {
    switch (status) {
      case PhaseStatus.NOT_STARTED:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          text: '未开始'
        };
      case PhaseStatus.IN_PROGRESS:
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          text: '进行中'
        };
      case PhaseStatus.COMPLETED:
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" />,
          text: '已完成'
        };
      case PhaseStatus.BLOCKED:
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
          text: '阻塞中'
        };
      case TaskStatus.PENDING:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          text: '待处理'
        };
      case TaskStatus.PROCESSING:
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          text: '处理中'
        };
      case TaskStatus.COMPLETED:
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" />,
          text: '已完成'
        };
      case TaskStatus.FAILED:
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
          text: '失败'
        };
      case TaskStatus.CONFIRMED:
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" />,
          text: '已确认'
        };
      case TaskStatus.BLOCKED:
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
          text: '阻塞中'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          text: '未知状态'
        };
    }
  };

  const { color, icon, text } = getStatusConfig();

  return (
    <Badge variant="outline" className={`flex items-center text-xs px-2 py-0.5 ${color}`}>
      {icon}
      {showText && <span>{text}</span>}
    </Badge>
  );
};

export default StatusBadge; 