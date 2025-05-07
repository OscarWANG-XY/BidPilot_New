import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import TiptapEditor_lite from '@/__deprecated/shared/TiptapEditor_lite2';
import TiptapEditor from '@/components/TiptapEditor/TiptapEditor'

interface ConfigurationPreviewProps {
  context?: any;
  instruction?: any;
  supplement?: any;
}

const ConfigurationPreview: React.FC<ConfigurationPreviewProps> = ({
  context,
  instruction,
  supplement
}) => {
  // 设置 TiptapEditor 的基本配置
  const editorConfig = {
    maxHeight: 400, // 固定高度
    showToc: true
  };
  
  return (
    <Card className="max-w-5xl mx-auto w-full shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">配置预览</CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <Accordion type="multiple" defaultValue={["context", "instruction", "supplement"]} className="w-full">
          {/* 上下文预览区域 */}
          <AccordionItem value="context" className="focus-within:ring-2 ring-blue-500">
            <AccordionTrigger className="text-sm font-medium">上下文 (Context)</AccordionTrigger>
            <AccordionContent>
              <div className="border rounded-md overflow-hidden h-[400px]">
                <TiptapEditor
                  initialContent={context || ''}
                  readOnly={true}
                  {...editorConfig}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 提示词预览区域 */}
          <AccordionItem value="instruction" className="focus-within:ring-2 ring-blue-500">
            <AccordionTrigger className="text-sm font-medium">指令 (instruction)</AccordionTrigger>
            <AccordionContent>
              <div className="border rounded-md overflow-hidden h-[400px]">
                <TiptapEditor
                  initialContent={instruction || ''}
                  readOnly={true}
                  {...editorConfig}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 补充信息预览区域 */}
          <AccordionItem value="supplement" className="focus-within:ring-2 ring-blue-500">
            <AccordionTrigger className="text-sm font-medium">补充信息 (supplement)</AccordionTrigger>
            <AccordionContent>
              <div className="border rounded-md overflow-hidden h-[400px]">
                <TiptapEditor
                  initialContent={supplement || ''}
                  readOnly={true}
                  {...editorConfig}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ConfigurationPreview; 