import React from 'react';
import type { Type_TaskDetail } from './hook&APIs.tsx/tasksApi';
import TiptapEditor_lite from '@/components/shared/TiptapEditor_lite2' // Assuming TiptapEditor is in this location
import { Button } from '@/components/ui/button'; // Assuming you have a UI button component
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
  
  interface ConfigurationPanelProps {
    // 基础属性
    task: Type_TaskDetail;
    isUpdating: boolean;
  
    // 与流程相关的回调
    onLoadConfig: () => Promise<void>;
    onStartAnalysis: () => Promise<void>;
    onStartEditing: () => void;
  
    // UI编辑状态控制
    isEditing: boolean;
    
    editingContext: string;
    editingPrompt: string;
    editingCompanyInfo: any;
    onEditingContextChange: (context: string) => void;
    onEditingPromptChange: (prompt: string) => void;
    onEditingCompanyInfoChange: (companyInfo: any) => void;
  
    onCancelEditing: () => void;
    onSaveConfig: (context: string, prompt: string, companyInfo: any) => Promise<void>;
  }
  
  const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
    task,
    isUpdating,
    onLoadConfig,
    onStartAnalysis,
    onStartEditing,
    isEditing,
    editingContext,
    editingPrompt,
    editingCompanyInfo,
    onEditingContextChange,
    onEditingPromptChange,
    onEditingCompanyInfoChange,
    onCancelEditing,
    onSaveConfig
  }) => {
    // 处理加载模板的函数
    const handleLoadTemplateClick = () => {
      onLoadConfig();
    };
  
    // 处理保存配置的函数
    const handleSaveConfig = async () => {
      await onSaveConfig(editingContext, editingPrompt, editingCompanyInfo);
    };
  
    // 设置 TiptapEditor 的基本配置
    const editorConfig = {
      maxHeight: 800,
      showToc: true
    };
  
    return (
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">配置任务</CardTitle>
            
            {!isEditing && (
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleLoadTemplateClick}
                  disabled={isUpdating}
                >
                  刷新配置
                </Button>
                <Button 
                  size="sm"
                  onClick={() => onStartEditing()}
                  disabled={isUpdating}
                >
                  编辑配置
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
  
        <CardContent className="pt-2">
          {/* 编辑区域 - 横向排列 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 上下文编辑区域 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">上下文 (Context)</label>
              <div className="border rounded-md overflow-hidden">
                <TiptapEditor_lite
                  initialContent={isEditing ? editingContext : task.context || ''}
                  onChange={onEditingContextChange}
                  readOnly={!isEditing}
                  {...editorConfig}
                />
              </div>
            </div>
  
            {/* 提示词编辑区域 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">提示词 (Prompt)</label>
              <div className="border rounded-md overflow-hidden">
                <TiptapEditor_lite
                  initialContent={isEditing ? editingPrompt : task.prompt || ''}
                  onChange={onEditingPromptChange}
                  readOnly={!isEditing}
                  {...editorConfig}
                />
              </div>
            </div>
  
            {/* 公司信息编辑区域 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">公司信息 (Company Info)</label>
              <div className="border rounded-md overflow-hidden">
                <TiptapEditor_lite
                  initialContent={isEditing ? editingCompanyInfo : task.companyInfo || ''}
                  onChange={onEditingCompanyInfoChange}
                  readOnly={!isEditing}
                  {...editorConfig}
                />
              </div>
            </div>
          </div>
        </CardContent>
  
        <CardFooter className="flex justify-end pt-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={onCancelEditing}
                disabled={isUpdating}
                className="mr-2"
              >
                取消编辑
              </Button>
              <Button 
                onClick={handleSaveConfig}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中
                  </>
                ) : (
                  '保存配置'
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={onStartAnalysis}
              disabled={isUpdating || !task.context || !task.prompt}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中
                </>
              ) : (
                '开始分析'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };
  
  export default ConfigurationPanel;