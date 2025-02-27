// DocumentTree.tsx
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// 文档节点类型定义
export interface DocNode {
  id: string;
  title: string;
  level: number;
  content?: string;
  children: DocNode[];
  isNew?: boolean; // 标记是否为新增节点
  isModified?: boolean; // 标记是否被修改
}

interface DocumentTreeProps {
  document: DocNode;
  onNodeSelect: (node: DocNode) => void;
  className?: string;
}

const DocumentTree: React.FC<DocumentTreeProps> = ({ 
  document, 
  onNodeSelect,
  className 
}) => {
  return (
    <div className={cn("w-full overflow-auto", className)}>
      <h2 className="text-xl font-bold mb-4">文档结构</h2>
      <div className="pl-2">
        <TreeNode 
          node={document} 
          onNodeSelect={onNodeSelect} 
          level={0} 
        />
      </div>
    </div>
  );
};

interface TreeNodeProps {
  node: DocNode;
  onNodeSelect: (node: DocNode) => void;
  level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onNodeSelect, level }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  const handleSelect = () => {
    onNodeSelect(node);
  };

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 py-1.5 px-3 rounded-md",
          "text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "cursor-pointer",
          node.isNew && "bg-green-50 dark:bg-green-900/10",
          node.isModified && "bg-blue-50 dark:bg-blue-900/10"
        )}
        onClick={handleSelect}
      >
        <div 
          className={cn(
            "w-4 h-4 flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "transition-colors"
          )}
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <File className="h-4 w-4" />
          )}
        </div>
        
        <span className={cn(
          "flex-1 truncate",
          node.level === 1 && "font-semibold",
          node.level === 2 && "font-medium",
          "text-sm"
        )}>
          {node.title}
        </span>
        
        {node.isNew && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Plus className="h-3 w-3 mr-1" />
                  新增
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>此节点由大模型新增</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {node.isModified && !node.isNew && (
          <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            已修改
          </Badge>
        )}
      </div>
      
      {hasChildren && expanded && (
        <div className="pl-4 border-l border-muted ml-2 mt-1">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onNodeSelect={onNodeSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentTree;