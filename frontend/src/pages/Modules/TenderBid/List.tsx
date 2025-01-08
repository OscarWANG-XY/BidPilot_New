import { useNavigate } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BiddingTask {
  id: string;
  title: string;
  status: '进行中' | '待处理' | '已完成';
  currentStep: string;
  progress: number;
  deadline: string;
}

export function TenderBidList() {
  const navigate = useNavigate();
  
  const biddingTasks: BiddingTask[] = [
    {
      id: "BID-2024-001",
      title: "城市道路维修项目招标",
      status: "进行中",
      currentStep: "投标文件审核",
      progress: 60,
      deadline: "2024-02-15",
    },
    {
      id: "BID-2024-002",
      title: "公共设施改造项目",
      status: "待处理",
      currentStep: "招标文件上传",
      progress: 20,
      deadline: "2024-02-20",
    }
  ];

  const getStatusVariant = (status: BiddingTask['status']) => {
    switch (status) {
      case '进行中': return 'default';
      case '待处理': return 'secondary';
      case '已完成': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate('parse')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建招标任务
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {biddingTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription>{task.id}</CardDescription>
                </div>
                <Badge variant={getStatusVariant(task.status)}>
                  {task.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">截止日期: {task.deadline}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>当前进度: {task.currentStep}</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`${task.id}`)}
              >
                查看详情
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 