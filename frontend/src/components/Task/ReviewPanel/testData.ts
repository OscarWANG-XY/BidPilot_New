import { TaskStatus } from '../hook&APIs.tsx/tasksApi';
import { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface';
import type { Type_TaskDetail } from '../hook&APIs.tsx/tasksApi';
import type { StageType } from '@/_types/projects_dt_stru/projectStage_interface';

// 测试用的项目ID和阶段类型
export const TEST_PROJECT_ID = 'test-project-123';
export const TEST_STAGE_TYPE: StageType = 'market_research' as StageType;

// Tiptap JSON 格式的示例内容
export const SAMPLE_TIPTAP_CONTENT = JSON.stringify({
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "分析报告" }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "市场概览" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "本次分析主要关注了行业的最新发展趋势和主要竞争对手的市场策略。" }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "主要发现" }]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "市场规模预计在未来5年内增长30%" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "新兴技术正在改变传统业务模式" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "消费者行为呈现出明显的转变趋势" }]
            }
          ]
        }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "建议" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "基于以上分析，我们建议公司考虑以下策略调整：" }
      ]
    },
    {
      "type": "orderedList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "加大研发投入" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "优化产品线结构" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "拓展国际市场" }]
            }
          ]
        }
      ]
    }
  ]
});

// 编辑后的 Tiptap JSON 内容示例
export const SAMPLE_EDITED_CONTENT = JSON.stringify({
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "修改后的分析报告" }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "市场概览" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "本次分析主要关注了行业的最新发展趋势和主要竞争对手的市场策略，并结合公司现状提出针对性建议。" }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "主要发现" }]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "市场规模预计在未来5年内增长30%" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "新兴技术正在改变传统业务模式" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "消费者行为呈现出明显的转变趋势" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "竞争对手正加速数字化转型" }]
            }
          ]
        }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "建议" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "基于以上分析，我们建议公司考虑以下策略调整：" }
      ]
    },
    {
      "type": "orderedList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "加大研发投入，特别是AI和自动化领域" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "优化产品线结构，聚焦高增长产品" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "拓展国际市场，重点关注东南亚区域" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "建立数据驱动的决策体系" }]
            }
          ]
        }
      ]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "风险评估" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "实施上述策略可能面临的主要风险包括：" }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "技术转型期间的生产力暂时下降" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "国际市场的政策和文化适应问题" }]
            }
          ]
        }
      ]
    }
  ]
});

// 用于ReviewPanel测试的模拟任务数据
export const MOCK_REVIEW_TASK: Type_TaskDetail = {
  id: 'task-789',
  name: '市场分析任务',
  type: 'DOCX_EXTRACTION_TASK' as TaskType,
  status: TaskStatus.REVIEWING,
  context: '分析公司在当前市场中的竞争优势和面临的挑战',
  prompt: '请对公司的市场定位进行深入分析，并提出未来发展建议',
  relatedCompanyInfo: JSON.stringify({
    name: '示例科技有限公司',
    industry: '人工智能',
    founded: 2015,
    employees: 120
  }),
  finalResult: SAMPLE_TIPTAP_CONTENT,
  taskStartedAt: '2025-04-08T10:30:00Z',
  taskCompletedAt: '2025-04-08T10:45:30Z',
  analysisDuration: 930, // 单位：秒
  inTokens: 1250,
  outTokens: 3500,
  totalTokens: 4750
};

// ReviewPanel属性的模拟处理函数
export const mockReviewPanelHandlers = {
  // 模拟编辑结果变更处理器
  handleEditingResultChange: (value: string) => {
    console.log('编辑结果已更改:', value);
    return value;
  },
  
  // 模拟取消编辑处理器
  handleCancelEditing: () => {
    console.log('已取消编辑');
  },
  
  // 模拟保存编辑结果处理器
  handleSaveEditedResult: async () => {
    console.log('正在保存编辑结果...');
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('编辑结果已保存');
  }
};

// 模拟更新状态
export const MOCK_STATES = {
  isUpdating: false,
  isEditing: false
};

// 模拟开始编辑状态的函数
export const simulateStartEditing = () => {
  return {
    ...MOCK_STATES,
    isEditing: true
  };
};

// 模拟保存中状态的函数
export const simulateSaving = () => {
  return {
    ...MOCK_STATES,
    isUpdating: true
  };
};

// 测试组件使用示例：
/*
import { useState } from 'react';
import ReviewPanel from './ReviewPanel';
import { 
  MOCK_REVIEW_TASK, 
  SAMPLE_TIPTAP_CONTENT,
  mockReviewPanelHandlers 
} from './testData';

const TestReviewPanel = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingResult, setEditingResult] = useState(SAMPLE_TIPTAP_CONTENT);
  
  const handleEditingResultChange = (value: string) => {
    setEditingResult(value);
  };
  
  const handleCancelEditing = () => {
    setIsEditing(false);
  };
  
  const handleStartEditing = () => {
    setEditingResult(MOCK_REVIEW_TASK.finalResult || '');
    setIsEditing(true);
  };
  
  const handleSaveEditedResult = async () => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟API调用
    setIsUpdating(false);
    setIsEditing(false);
  };
  
  return (
    <div className="p-4 border rounded">
      <h1 className="text-xl mb-4">测试审核面板</h1>
      <ReviewPanel
        finalResult={MOCK_REVIEW_TASK.finalResult || ''}
        isUpdating={isUpdating}
        isEditing={isEditing}
        editingResult={editingResult}
        onEditingResultChange={handleEditingResultChange}
        onCancelEditing={handleCancelEditing}
        onSaveEditedResult={handleSaveEditedResult}
      />
      
      <div className="mt-4 p-2 bg-gray-100">
        <h2 className="font-bold">测试控制:</h2>
        <div className="flex space-x-2 mt-2">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded" 
            onClick={() => handleStartEditing()}
          >
            开始编辑
          </button>
          <button 
            className="px-3 py-1 bg-orange-500 text-white rounded" 
            onClick={() => setIsUpdating(!isUpdating)}
          >
            切换更新状态
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestReviewPanel;
*/