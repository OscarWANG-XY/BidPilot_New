/*
### 2.1 ConfigurationPanel
- 初次渲染该组件时，自动加载Context, Instruction, Supplement模板内容
只读模式
- Context, Instruction, Supplement 分别在共享组件 TiptapEditorLite 只读展示
- 加载模板按钮 -> 回调handleLoadConfig ->更新Context, Instruction, Supplement的内容
- 开始编辑按钮 -> 回调handleStartConfigEditing -> Panel 切换到 编辑模式
- 开始分析按钮 -> 回调handleStartAnlaysis -> 离开当前Panel, 进入AnalysisProgressPanel  
编辑模式
if(isEditingConfig) 
- TiptapEditorLite 可编辑被触发，Context,Instruction,Supplement 进入可编辑状态 
- 取消编辑按钮 -> 回调handleStartConfigEDITING, Panel 退回 只读模式
- 保存编辑按钮 -> 回调handelSavConfig, Panel退回 只读模式
*/



import React from 'react';
import type { Type_TaskDetail } from '../hook&APIs.tsx/tasksApi';
import TiptapEditor from '@/components/TiptapEditor/TiptapEditor' // Assuming TiptapEditor is in this location
import { Button } from '@/components/ui/button'; // Assuming you have a UI button component
//import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
    // onLoadConfig: () => Promise<void>;
    onStartAnalysis: () => Promise<void>;
    onStartEditing: () => void;
  
    // UI编辑状态控制
    isEditing: boolean;
    
    editingContext: any;
    editingInstruction: any;
    editingSupplement: any;
    onEditingContextChange: (context: any) => void;
    onEditingInstructionChange: (instruction: any) => void;
    onEditingSupplementChange: (supplement: any) => void;
  
    onCancelEditing: () => void;
    onSaveConfig: (context: any, instruction: any, supplement: any) => Promise<void>;
  }
  
  const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
    task,
    isUpdating,
    // onLoadConfig,
    onStartAnalysis,
    onStartEditing,
    isEditing,
    editingContext,
    editingInstruction,
    editingSupplement,
    onEditingContextChange,
    onEditingInstructionChange,
    onEditingSupplementChange,
    onCancelEditing,
    onSaveConfig
  }) => {
    
    // 处理加载模板的函数
    // const handleLoadTemplateClick = () => {
    //   onLoadConfig();
    // };
  
    // 处理保存配置的函数
    const handleSaveConfig = async () => {
      await onSaveConfig(editingContext, editingInstruction, editingSupplement);
    };
  
    // 设置 TiptapEditor 的基本配置
    const editorConfig = {
      showToc: true
    };
  
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">配置任务</h3>
        </div>
  
        <div>    
          <Accordion 
            type="multiple" 
            defaultValue={["context"]}  // 默认展开第一个区域
            className="w-full">
  
            {/* 上下文编辑区域 */}
            <AccordionItem value="context" className="border-b">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="text-sm font-medium">上下文 (Context)</span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">
                <div className="border rounded-md overflow-hidden">
                  <TiptapEditor
                    initialContent={isEditing ? editingContext : task.context || ''}
                    onChange={onEditingContextChange}
                    readOnly={!isEditing}
                    maxWidth="100%"
                    minWidth="100%"
                    maxHeight="100%"
                    minHeight="100%"
                    {...editorConfig}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
  
            {/* 提示词编辑区域 */}
            <AccordionItem value="instruction" className="border-b">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="text-sm font-medium">指令 (instruction)</span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">
                <div className="border rounded-md overflow-hidden">
                  <TiptapEditor
                    initialContent={isEditing ? editingInstruction : task.instruction || ''}
                    onChange={onEditingInstructionChange}
                    readOnly={!isEditing}
                    maxWidth="100%"
                    minWidth="100%"
                    maxHeight="100%"
                    minHeight="100%"
                    {...editorConfig}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
  
            {/* 公司信息编辑区域 */}
            <AccordionItem value="supplement" className="border-b">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="text-sm font-medium">补充信息 (supplement)</span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">
                <div className="border rounded-md overflow-hidden">
                  <TiptapEditor
                    initialContent={isEditing ? editingSupplement : task.supplement || ''}
                    onChange={onEditingSupplementChange}
                    readOnly={!isEditing}
                    maxWidth="100%"
                    minWidth="100%"
                    maxHeight="100%"
                    minHeight="100%"
                    {...editorConfig}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
  
        <div className="flex justify-between pt-4 border-t">
          {!isEditing && (
            <Button 
              size="sm"
              onClick={() => onStartEditing()}
              disabled={isUpdating}
            >
              编辑配置
            </Button>
          )}
          
          {isEditing ? (
            <div className="flex gap-x-2 ml-auto">
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
              disabled={isUpdating || !task.context || !task.instruction}
              className="ml-auto"
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
        </div>
      </div>
    );
  };
  
  export default ConfigurationPanel;