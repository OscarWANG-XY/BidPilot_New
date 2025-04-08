// 导入与StreamingApi.ts中保持一致的接口
export interface StreamStartResponse {
  taskId: string;
  streamId: string;
  status: string;
  message: string;
}

export interface StreamStatusResponse {
  status: string;
  start_time: string;
  update_time?: string;
  error?: string;
  model?: string;
  celery_task_id?: string;
  project_id?: string;
  task_type?: string;
  metadata?: {
    tokens: number;
    runTime: string;
    [key: string]: any;
  };
}

export interface StreamResultResponse {
  status: string;
  content: string;
  chunks_count: number;
  metadata: {
    model?: string;
    celery_task_id?: string;
    project_id?: string;
    task_type?: string;
    tokens?: number;
    runTime?: string;
    [key: string]: any;
  };
}

// UUID生成工具函数
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, 
          v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 通用的UUID，如果需要可以每次重新生成
export const streamId = generateUUID();

// 样本分析内容 - 为流式模拟提供完整内容
export const fullAnalysisContent = `# 分析结果

## 公司概况

这家公司是一家领先的技术解决方案提供商，专注于人工智能和数据分析领域。公司成立于2018年，总部位于深圳，在北京、上海、广州和成都设有分支机构。目前员工人数约300人，其中研发人员占比60%。

## 市场分析

市场规模预计在未来五年内增长30%，主要驱动因素包括：

- 数字化转型加速
- 企业对AI解决方案的需求增加
- 数据驱动决策的普及
- 云计算和边缘计算的发展

当前市场渗透率约为15%，预计到2028年将达到45%。

## 竞争格局

主要竞争对手包括：

1. TechCorp Inc. - 市场份额25%，强项在企业级解决方案
2. DataSolutions Ltd. - 市场份额18%，数据处理领域领先
3. AIVentures - 市场份额12%，AI算法研究方面突出
4. 本地科技创新企业 - 合计市场份额约20%

我们公司当前市场份额约为15%，在中小企业市场中表现尤为强势。

## SWOT分析

### 优势
- 强大的技术团队，平均行业经验5年以上
- 创新的产品线，尤其在自然语言处理方面
- 良好的客户关系，客户续约率达85%
- 灵活的定制化能力，满足不同规模企业需求

### 劣势
- 营销资源有限，品牌知名度不及主要竞争对手
- 国际市场份额较小，全球化战略刚刚起步
- 产品线需要进一步丰富，特别是在计算机视觉领域
- 资金规模限制了更大范围的研发投入

### 机会
- 新兴市场扩张，特别是东南亚地区
- 产品线多元化，向更多垂直行业延伸
- 战略合作伙伴关系，特别是与大型云服务提供商
- 政府支持AI技术发展的政策红利

### 威胁
- 技术快速迭代，需要持续投入保持竞争力
- 竞争加剧，包括来自国际科技巨头的竞争
- 监管环境变化，数据隐私法规日益严格
- 人才争夺激烈，核心技术人员流失风险

## 发展建议

1. **技术路线**：加强自然语言处理技术优势，同时拓展计算机视觉能力，形成全面AI解决方案
2. **市场策略**：增加营销投入，提升品牌知名度；专注中小企业市场，同时谨慎拓展大企业客户
3. **人才建设**：完善技术人才激励机制，建立清晰的职业发展路径
4. **融资规划**：考虑新一轮融资，支持产品研发和市场扩张

## 风险评估

项目实施主要风险因素包括技术演进不及预期、市场竞争加剧、核心人才流失等。建议建立风险预警机制，定期评估项目进展与风险状况。`;

// Mock Stream Status Response - 进行中状态
export const mockStreamStatus: StreamStatusResponse = {
  status: 'RUNNING', // 可以是 'RUNNING', 'COMPLETED', 'FAILED', 或 'CANCELLED'
  start_time: new Date(Date.now() - 45 * 1000).toISOString(), // 45秒前开始
  update_time: new Date().toISOString(), // 当前时间
  model: 'gpt-4',
  celery_task_id: `celery-${generateUUID().substring(0, 8)}`,
  project_id: 'project-123',
  task_type: 'outline_analysis',
  metadata: {
    tokens: 1240,
    runTime: '45s',
    progress: '65%'
  }
};

// Mock Stream Status Response - 已完成状态
export const mockStreamStatusCompleted: StreamStatusResponse = {
  status: 'COMPLETED',
  start_time: new Date(Date.now() - 120 * 1000).toISOString(), // 2分钟前开始
  update_time: new Date().toISOString(), // 当前时间
  model: 'gpt-4',
  celery_task_id: `celery-${generateUUID().substring(0, 8)}`,
  project_id: 'project-123',
  task_type: 'outline_analysis',
  metadata: {
    tokens: 2850,
    runTime: '120s',
    progress: '100%'
  }
};

// Mock Stream Result Response - 完整的分析结果
export const mockStreamResult: StreamResultResponse = {
  status: 'COMPLETED',
  content: fullAnalysisContent,
  chunks_count: 42, // 内容被分成了多少块
  metadata: {
    model: 'gpt-4',
    celery_task_id: `celery-${generateUUID().substring(0, 8)}`,
    project_id: 'project-123',
    task_type: 'outline_analysis',
    tokens: 2850,
    runTime: '120s',
    startTimestamp: Date.now() - 120 * 1000,
    endTimestamp: Date.now(),
    averageChunkProcessingTime: '2.85s'
  }
};

// Mock streaming content - 部分内容（用于模拟过程中）
export const mockStreamingContent = fullAnalysisContent.substring(0, fullAnalysisContent.length / 3);

// Mock error response - 错误信息
export const mockStreamError = '分析过程中发生错误：连接到大模型服务超时，请检查网络连接并重试。';

// Create test data scenarios
export const testScenarios = {
  // 1. 初始状态 - 刚开始流式分析
  initialStreaming: {
    streamId,
    streamContent: '',
    isStreaming: true,
    streamError: null,
    streamComplete: false,
    streamStatus: {
      ...mockStreamStatus,
      update_time: new Date().toISOString(),
      metadata: {
        ...mockStreamStatus.metadata,
        tokens: 0,
        runTime: '2s',
        progress: '0%'
      }
    },
    streamResult: null,
    isStartingStream: true,
    onTerminateAnalysis: async () => { console.log('终止分析请求已发送'); }
  },
  
  // 2. 数据流动中 - 持续接收内容
  activeStreaming: {
    streamId,
    streamContent: mockStreamingContent,
    isStreaming: true,
    streamError: null,
    streamComplete: false,
    streamStatus: {
      ...mockStreamStatus,
      update_time: new Date().toISOString()
    },
    streamResult: null,
    isStartingStream: false,
    onTerminateAnalysis: async () => { console.log('终止分析请求已发送'); }
  },
  
  // 3. 分析完成
  completedStreaming: {
    streamId,
    streamContent: fullAnalysisContent,
    isStreaming: false,
    streamError: null,
    streamComplete: true,
    streamStatus: mockStreamStatusCompleted,
    streamResult: mockStreamResult,
    isStartingStream: false,
    onTerminateAnalysis: async () => { console.log('终止分析请求已发送'); }
  },
  
  // 4. 错误状态
  errorState: {
    streamId,
    streamContent: mockStreamingContent.substring(0, 200), // 只显示一小部分内容
    isStreaming: false,
    streamError: mockStreamError,
    streamComplete: false,
    streamStatus: {
      ...mockStreamStatus,
      status: 'FAILED',
      error: mockStreamError,
      update_time: new Date().toISOString(),
      metadata: {
        ...mockStreamStatus.metadata,
        runTime: '35s',
        progress: '30%'
      }
    },
    streamResult: null,
    isStartingStream: false,
    onTerminateAnalysis: async () => { console.log('终止分析请求已发送'); }
  }
};

// 默认导出：活跃的流式场景（便于快速测试）
export default testScenarios.activeStreaming;

// 使用示例:
/*
import AnalysisPanel from './AnalysisPanel';
import testData, { testScenarios } from './testData';

// 使用默认测试数据
<AnalysisPanel {...testData} />

// 或者使用特定场景
<AnalysisPanel {...testScenarios.completedStreaming} />
*/