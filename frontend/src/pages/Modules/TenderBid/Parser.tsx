import { FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Step {
  id: number;
  title: string;
  status: 'completed' | 'current' | 'pending';
}

export function TenderBidParser() {
  const steps: Step[] = [
    { id: 1, title: "招标文件上传", status: "completed" },
    { id: 2, title: "文件解析", status: "completed" },
    { id: 3, title: "生成投标文件", status: "current" },
    { id: 4, title: "投标文件审核", status: "pending" },
    { id: 5, title: "提交确认", status: "pending" }
  ];

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'current':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-300" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>文件解析与处理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className="flex flex-col items-center gap-2 relative"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                ${step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'current' ? 'bg-blue-100' : 'bg-gray-100'}`}
              >
                {getStepIcon(step.status)}
              </div>
              <span className="text-sm text-center whitespace-nowrap">
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className="absolute left-[50%] w-[calc(100%-2rem)] h-[2px] top-4 -z-10
                  bg-gradient-to-r from-green-500 to-gray-200" />
              )}
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">文件上传</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>招标文件.pdf</span>
              <Button size="sm" variant="outline">预览</Button>
            </div>
            <Progress value={33} className="w-full" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">取消</Button>
              <Button className="flex-1">开始解析</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 