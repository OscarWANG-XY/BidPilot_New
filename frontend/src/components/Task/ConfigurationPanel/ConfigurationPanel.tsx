/*
### 2.1 ConfigurationPanel
- 初次渲染该组件时，自动加载Context, Prompt, CompanyInfo模板内容
只读模式
- Context, Prompt, CompanyInfo 分别在共享组件 TiptapEditorLite 只读展示
- 加载模板按钮 -> 回调handleLoadConfig ->更新Context, Prompt, CompanyInfo的内容
- 开始编辑按钮 -> 回调handleStartConfigEditing -> Panel 切换到 编辑模式
- 开始分析按钮 -> 回调handleStartAnlaysis -> 离开当前Panel, 进入AnalysisProgressPanel  
编辑模式
if(isEditingConfig) 
- TiptapEditorLite 可编辑被触发，Context,Prompt,CompanyInfo 进入可编辑状态 
- 取消编辑按钮 -> 回调handleStartConfigEDITING, Panel 退回 只读模式
- 保存编辑按钮 -> 回调handelSavConfig, Panel退回 只读模式
*/



import React from 'react';
import type { Type_TaskDetail } from '../hook&APIs.tsx/tasksApi';
import TiptapEditor_lite from '@/components/shared/TiptapEditor_lite2' // Assuming TiptapEditor is in this location
import { Button } from '@/components/ui/button'; // Assuming you have a UI button component
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
  
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
    editingRelatedCompanyInfo: any;
    onEditingContextChange: (context: string) => void;
    onEditingPromptChange: (prompt: string) => void;
    onEditingRelatedCompanyInfoChange: (relatedCompanyInfo: any) => void;
  
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
    editingRelatedCompanyInfo,
    onEditingContextChange,
    onEditingPromptChange,
    onEditingRelatedCompanyInfoChange,
    onCancelEditing,
    onSaveConfig
  }) => {
    
    // 处理加载模板的函数
    const handleLoadTemplateClick = () => {
      onLoadConfig();
    };
  
    // 处理保存配置的函数
    const handleSaveConfig = async () => {
      await onSaveConfig(editingContext, editingPrompt, editingRelatedCompanyInfo);
    };
  
    // 设置 TiptapEditor 的基本配置
    const editorConfig = {
      maxHeight: 400, // 固定高度
      showToc: true
    };
  
    return (
      <Card className="max-w-5xl mx-auto w-full shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">配置任务</CardTitle>
            
            {!isEditing && (
              <div className="flex space-x-2">
                {/*刷新配置按钮*/}
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleLoadTemplateClick}
                  disabled={isUpdating}
                >
                  刷新配置
                </Button>
                {/*编辑配置按钮*/}
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
  
        <CardContent className="pt-4">
          {/* 编辑区域 - 纵向排列 */}
          <Accordion type="multiple" defaultValue={["context", "prompt", "companyInfo"]} className="w-full">
            {/* 上下文编辑区域 */}
            <AccordionItem value="context" className="focus-within:ring-2 ring-blue-500">
              <AccordionTrigger className="text-sm font-medium">上下文 (Context)</AccordionTrigger>
              <AccordionContent>
                <div className="border rounded-md overflow-hidden h-[400px]">
                  <TiptapEditor_lite
                    initialContent={isEditing ? editingContext : task.context || ''}
                    onChange={onEditingContextChange}
                    readOnly={!isEditing}
                    {...editorConfig}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
  
            {/* 提示词编辑区域 */}
            <AccordionItem value="prompt" className="focus-within:ring-2 ring-blue-500">
              <AccordionTrigger className="text-sm font-medium">提示词 (Prompt)</AccordionTrigger>
              <AccordionContent>
                <div className="border rounded-md overflow-hidden h-[400px]">
                  <TiptapEditor_lite
                    initialContent={isEditing ? editingPrompt : task.prompt || ''}
                    onChange={onEditingPromptChange}
                    readOnly={!isEditing}
                    {...editorConfig}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
  
            {/* 公司信息编辑区域 */}
            <AccordionItem value="companyInfo" className="focus-within:ring-2 ring-blue-500">
              <AccordionTrigger className="text-sm font-medium">公司信息 (Company Info)</AccordionTrigger>
              <AccordionContent>
                <div className="border rounded-md overflow-hidden h-[400px]">
                  <TiptapEditor_lite
                    initialContent={isEditing ? editingRelatedCompanyInfo : task.relatedCompanyInfo || ''}
                    onChange={onEditingRelatedCompanyInfoChange}
                    readOnly={!isEditing}
                    {...editorConfig}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
  
        <CardFooter className="flex justify-end pt-4">
          {isEditing ? (
            <div className="flex gap-x-2">
              {/*取消编辑的按钮*/}
              <Button 
                variant="outline" 
                size="sm"
                onClick={onCancelEditing}
                disabled={isUpdating}
              >
                取消编辑
              </Button>
              {/*保存配置的按钮*/}
              <Button 
                size="sm"
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
            </div>
          ) : (
            // {/* 开始分析 按钮*/}
            <Button 
              size="sm"
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