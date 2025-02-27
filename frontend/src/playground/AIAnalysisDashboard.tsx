import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const AIAnalysisDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // 模拟分析步骤和结果数据
  const analysisSteps = [
    {
      id: "step1",
      title: "数据预处理",
      description: "清洗和准备输入数据",
      details: "在这个步骤中，我们去除了异常值，处理了缺失数据，并将文本进行了标准化处理。此外，还进行了特征归一化，确保不同尺度的特征能够公平比较。",
      duration: "2.3秒"
    },
    {
      id: "step2",
      title: "特征提取",
      description: "从输入中提取关键特征",
      details: "使用自然语言处理技术提取文本中的关键词、情感倾向和主题类别。同时使用词嵌入技术将文本转换为向量表示，以便后续模型处理。",
      duration: "4.1秒"
    },
    {
      id: "step3",
      title: "模型推理",
      description: "应用大规模语言模型进行分析",
      details: "通过多层Transformer架构的神经网络模型进行推理，模型包含120亿参数，能够理解复杂的语境和语义关系。针对输入内容进行了25次前向传播计算，并使用注意力机制进行跨文本的信息整合。",
      duration: "3.7秒"
    },
    {
      id: "step4",
      title: "结果优化",
      description: "对初步结果进行调整和优化",
      details: "基于初步推理结果，应用后处理算法进行结果优化。包括逻辑一致性检查、事实核验和输出格式化处理。同时应用了基于规则的内容安全过滤机制。",
      duration: "1.5秒"
    }
  ];
  
  const analysisResults = {
    summary: "这份文档主要讨论了气候变化对全球农业生产的影响，并探讨了可能的适应策略",
    keyPoints: [
      "全球温度上升预计将减少主要农作物产量10-25%",
      "水资源短缺将成为农业生产的主要限制因素",
      "发展中国家农民面临更高的适应挑战",
      "需要开发更多抗旱、抗热新品种作物"
    ],
    confidence: 87,
    executionTime: "11.6秒",
    modelVersion: "GPT-4 Turbo (2023-12)"
  };
  
  const handleRunAnalysis = () => {
    setIsLoading(true);
    // 模拟分析过程
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="text-2xl font-bold">AI 分析仪表盘</CardTitle>
          <CardDescription className="text-gray-100">
            使用大语言模型进行深度文本分析
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">分析步骤</h3>
            <Accordion type="single" collapsible className="w-full">
              {analysisSteps.map((step) => (
                <AccordionItem key={step.id} value={step.id}>
                  <AccordionTrigger className="text-left font-medium">
                    <div className="flex justify-between w-full pr-4">
                      <span>{step.title} - {step.description}</span>
                      <span className="text-gray-500 text-sm">{step.duration}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {step.details}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">分析结果</h3>
            <Card className="border bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-medium">摘要</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-2">
                <p className="text-gray-800">{analysisResults.summary}</p>
              </CardContent>
            </Card>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">关键发现</h4>
              <ul className="list-disc pl-5 space-y-1">
                {analysisResults.keyPoints.map((point, index) => (
                  <li key={index} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-2xl font-bold text-blue-600">{analysisResults.confidence}%</div>
                <div className="text-sm text-gray-500">置信度</div>
              </div>
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-2xl font-bold text-green-600">{analysisResults.executionTime}</div>
                <div className="text-sm text-gray-500">执行时间</div>
              </div>
              <div className="bg-white p-3 rounded-lg border text-center">
                <div className="text-sm font-medium text-purple-600">{analysisResults.modelVersion}</div>
                <div className="text-sm text-gray-500">模型版本</div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300 transition-colors"
            onClick={() => window.location.reload()}
          >
            重置
          </button>
          <button
            className={`px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleRunAnalysis}
            disabled={isLoading}
          >
            {isLoading ? '分析中...' : '运行新分析'}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AIAnalysisDashboard;