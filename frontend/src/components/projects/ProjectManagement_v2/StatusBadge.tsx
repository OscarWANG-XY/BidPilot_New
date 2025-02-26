// StatusBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { StatusBadgeProps } from '@/components/projects/ProjectManagement_v2/types';

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" /> 已完成</Badge>;
    case 'in-progress':
      return <Badge className="bg-blue-500"><Clock className="mr-1 h-3 w-3" /> 进行中</Badge>;
    case 'pending':
      return <Badge className="bg-gray-400"><Clock className="mr-1 h-3 w-3" /> 未开始</Badge>;
    case 'at-risk':
      return <Badge className="bg-amber-500"><AlertTriangle className="mr-1 h-3 w-3" /> 风险</Badge>;
    default:
      return <Badge className="bg-gray-400">未知</Badge>;
  }
};

export default StatusBadge;