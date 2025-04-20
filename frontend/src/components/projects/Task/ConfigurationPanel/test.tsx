import React from 'react';
import { ConfigurationPanelTestProps } from './testData';
import ConfigurationPanel from './ConfigurationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * 测试组件，用于演示和测试ConfigurationPanel的功能
 * 这个组件包含两个测试视图：
 * 1. 正常视图：直接测试ConfigurationPanel在完整功能下的表现
 * 2. 状态调试视图：可以手动切换各种状态来测试组件
 */
const ConfigurationPanelTest: React.FC = () => {
  const props = ConfigurationPanelTestProps();
  
  // 创建测试状态视图
  const [testEmpty, setTestEmpty] = React.useState(false);
  const [testLoading, setTestLoading] = React.useState(false);
  
  // 创建一个临时的空任务
  const emptyTask = {
    ...props.task,
    context: '',
    instruction: '',
    supplement: ''
  };
  
  // 用于测试的修改后props
  const testProps = {
    ...props,
    task: testEmpty ? emptyTask : props.task,
    isUpdating: testLoading
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">ConfigurationPanel 测试</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="normal">
            <TabsList>
              <TabsTrigger value="normal">正常视图</TabsTrigger>
              <TabsTrigger value="debug">状态调试视图</TabsTrigger>
            </TabsList>
            
            {/* 正常视图：直接使用标准props */}
            <TabsContent value="normal" className="pt-4">
              <ConfigurationPanel {...props} />
            </TabsContent>
            
            {/* 调试视图：可以切换各种状态 */}
            <TabsContent value="debug" className="pt-4">
              <div className="mb-4 p-4 bg-slate-100 rounded-md">
                <h3 className="text-lg font-medium mb-2">测试控制</h3>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="emptyState" 
                      checked={testEmpty}
                      onChange={e => setTestEmpty(e.target.checked)}
                    />
                    <label htmlFor="emptyState">测试空内容状态</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="loadingState" 
                      checked={testLoading}
                      onChange={e => setTestLoading(e.target.checked)}
                    />
                    <label htmlFor="loadingState">测试加载状态</label>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTestEmpty(false);
                      setTestLoading(false);
                    }}
                  >
                    重置测试状态
                  </Button>
                </div>
              </div>
              
              <ConfigurationPanel {...testProps} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* 查看当前状态信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">当前状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">UI状态</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>编辑模式: <span className="font-mono">{String(props.isEditing)}</span></li>
                <li>加载中: <span className="font-mono">{String(props.isUpdating)}</span></li>
                <li>测试空内容: <span className="font-mono">{String(testEmpty)}</span></li>
                <li>测试加载中: <span className="font-mono">{String(testLoading)}</span></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">任务内容长度</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>上下文(Context): <span className="font-mono">{props.task.context?.length || 0} 字符</span></li>
                <li>指令(Instruction): <span className="font-mono">{props.task.instruction?.length || 0} 字符</span></li>
                <li>补充信息(Supplement): <span className="font-mono">{props.task.supplement?.length || 0} 字符</span></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">活动日志</h3>
            <div className="bg-slate-100 p-3 rounded-md h-32 overflow-y-auto">
              <pre className="text-xs">
                {`测试会话开始于: ${new Date().toLocaleString()}
编辑状态: ${props.isEditing ? '激活' : '未激活'}
内容已加载: ${props.task.context ? '是' : '否'}
任务ID: ${props.task.id}
任务创建时间: ${props.task.taskStartedAt}
`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurationPanelTest;