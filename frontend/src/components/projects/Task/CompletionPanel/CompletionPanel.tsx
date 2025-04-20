import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from '@tanstack/react-router';

interface CompletionPanelProps {
  onResetTask: () => Promise<void>;
  nextTaskPath: string;
}

const CompletionPanel: React.FC<CompletionPanelProps> = ({
  onResetTask,
  nextTaskPath
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
      <h3 className="text-lg font-semibold">任务完成</h3>
      <p className="text-muted-foreground">您已完成当前任务，请选择下一步操作：</p>
      
      <div className="flex gap-4 mt-2">
        <Button 
          variant="outline" 
          onClick={onResetTask}
        >
          重置任务
        </Button>
        
        <Button 
          variant="default" 
          asChild
        >
          <Link to={nextTaskPath}>
            下一步
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default CompletionPanel; 