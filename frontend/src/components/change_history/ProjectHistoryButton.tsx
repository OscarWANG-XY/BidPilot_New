import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { History } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProjectHistoryButtonProps {
  projectId: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ProjectHistoryButton: React.FC<ProjectHistoryButtonProps> = ({
  projectId,
  variant = 'outline',
  size = 'default',
  className = '',
}) => {
  const navigate = useNavigate();

  const handleViewHistory = () => {
    navigate({ 
      to: '/projects/$projectId/history', 
      params: { projectId } 
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleViewHistory}
            className={className}
          >
            <History className="h-4 w-4 mr-2" />
            变更历史
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>查看项目的所有变更历史记录</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};