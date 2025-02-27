// DocumentViewer.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocNode } from './DocumentTree';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  selectedNode: DocNode | null;
  className?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  selectedNode,
  className 
}) => {
  if (!selectedNode) {
    return (
      <Card className={cn("w-full h-full flex items-center justify-center", className)}>
        <CardContent className="text-center text-gray-500 p-8">
          请从左侧文档树中选择一个节点查看内容
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center gap-2">
        <CardTitle className={cn(
          selectedNode.level === 1 ? "text-2xl" : 
          selectedNode.level === 2 ? "text-xl" : 
          "text-lg"
        )}>
          {selectedNode.title}
        </CardTitle>
        
        {selectedNode.isNew && (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            新增
          </Badge>
        )}
        
        {selectedNode.isModified && !selectedNode.isNew && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            已修改
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        {selectedNode.content ? (
          <div className="prose dark:prose-invert max-w-none">
            {selectedNode.content}
          </div>
        ) : (
          <p className="text-gray-500 italic">此节点没有内容</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentViewer;