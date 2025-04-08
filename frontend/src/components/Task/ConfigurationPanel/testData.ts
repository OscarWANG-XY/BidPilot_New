import { useState } from 'react';
import type { Type_TaskDetail, TaskStatus } from '../hook&APIs.tsx/tasksApi';
import { TaskType } from '@/types/projects_dt_stru/projectTasks_interface';

// Mock task data
export const mockTask: Type_TaskDetail = {
  id: 'task-123',
  name: '市场竞争分析任务',
  type: TaskType.OUTLINE_ANALYSIS_TASK,
  status: 'PENDING' as TaskStatus,
  taskStartedAt: '2025-04-01T08:00:00Z',
  // 测试数据里，我们需要确保context, prompt, companyInfo 是 TiptapJSON 转化成的string类型。 
  context: JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '市场分析背景' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '本次分析旨在了解当前市场竞争格局，识别主要竞争对手，评估各自的优势和劣势，以及确定潜在的市场机会。' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '请关注以下几个方面：' }]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '市场规模和增长趋势' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '主要竞争对手的市场份额' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '竞争对手的产品特点和定价策略' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '目标客户群体的需求和偏好' }] }]
          }
        ]
      }
    ]
  }),
  prompt: JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '分析提示词' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '请基于提供的市场数据和公司信息，进行全面的竞争分析：' }]
      },
      {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '概述当前市场规模、增长率和主要趋势' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '识别并分析前5名竞争对手的优势、劣势、机会和威胁' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '评估我们公司相对于竞争对手的竞争优势' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '提供具体的市场策略建议，包括产品定位、价格策略和营销方向' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '总结关键发现和行动建议' }] }]
          }
        ]
      }
    ]
  }),
  companyInfo: JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '公司基本信息' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '我们公司是一家成立于2018年的科技企业，主要提供企业SaaS解决方案，专注于数据分析和业务智能领域。' }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '公司核心产品' }]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '数据可视化平台' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '业务预测分析工具' }] }]
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '集成式报表系统' }] }]
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '目标客户' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '中大型企业的市场部门、销售团队和高管决策层。' }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '当前市场份额' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '约8%，在过去两年中稳步增长。' }]
      }
    ]
  }),
  // 其他必要的字段
  streamingResult: '',
  originalResult: '',
  finalResult: '',
  // 添加其他可能需要的字段
};

// 创建一个自定义hook来管理ConfigurationPanel所需的状态和行为
export const useConfigurationPanelTest = () => {
  const [task, setTask] = useState<Type_TaskDetail>(mockTask);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 编辑状态下的内容
  const [editingContext, setEditingContext] = useState(task.context || '');
  const [editingPrompt, setEditingPrompt] = useState(task.prompt || '');
  const [editingCompanyInfo, setEditingCompanyInfo] = useState(task.companyInfo || '');

  // 模拟加载配置的函数
  const handleLoadConfig = async () => {
    setIsUpdating(true);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟获取到的最新配置
    const updatedTask = {
      ...mockTask,
      context: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '更新后的市场分析背景' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '本分析旨在全面了解2025年第一季度市场竞争格局，识别主要竞争对手的最新动态，评估各自的优势和劣势，以及确定新兴的市场机会。' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '重点关注：' }]
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '后疫情时代的市场规模变化和增长趋势' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '主要竞争对手的最新市场份额和战略调整' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '竞争对手的产品创新和定价策略变化' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '目标客户群体的需求演变和新兴偏好' }] }]
              }
            ]
          }
        ]
      }),
      prompt: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '分析提示词 (2025版)' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '请基于最新提供的市场数据和公司信息，进行全面的竞争分析：' }]
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '概述2025年第一季度市场规模、增长率和新兴趋势' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '识别并深入分析前5名竞争对手的最新SWOT状况' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '评估我们公司相对于竞争对手的核心竞争优势和潜在风险' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '提供具体的市场策略建议，特别关注数字化转型后的产品定位、弹性价格策略和全渠道营销方向' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '总结关键发现和可立即执行的行动建议' }] }]
              }
            ]
          }
        ]
      }),
      companyInfo: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '公司最新信息 (2025年4月)' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '我们公司是一家成立于2018年的科技企业，经过7年发展，现已成为企业SaaS解决方案的领先提供商，专注于AI增强型数据分析和业务智能领域。' }]
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: '公司核心产品线' }]
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'AI驱动的数据可视化平台' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '预测分析工具集成解决方案' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '实时业务智能报表系统' }] }]
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '新推出：跨平台移动分析应用' }] }]
              }
            ]
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: '目标客户扩展' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '除传统的中大型企业外，现已拓展至快速增长的中小企业市场，覆盖市场部门、销售团队、产品开发和高管决策层。' }]
          },
          {
            type: 'heading',
            attrs: { level: 3 },
            content: [{ type: 'text', text: '最新市场份额' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '截至2025年第一季度已达12.5%，同比增长2.8个百分点。' }]
          }
        ]
      }),
    };
    
    setTask(updatedTask);
    setEditingContext(updatedTask.context || '');
    setEditingPrompt(updatedTask.prompt || '');
    setEditingCompanyInfo(updatedTask.companyInfo || '');
    
    setIsUpdating(false);
  };

  // 模拟开始分析的函数
  const handleStartAnalysis = async () => {
    setIsUpdating(true);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsUpdating(false);
    
    // 这里通常会有导航到分析进度面板的逻辑
    alert('开始分析 - 在实际应用中将导航到分析进度面板');
  };

  // 开始编辑状态
  const handleStartEditing = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEditing = () => {
    // 恢复到任务原始数据
    setEditingContext(task.context || '');
    setEditingPrompt(task.prompt || '');
    setEditingCompanyInfo(task.companyInfo || '');
    
    setIsEditing(false);
  };

  // 保存配置
  const handleSaveConfig = async (context: string, prompt: string, companyInfo: string) => {
    setIsUpdating(true);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 更新任务数据
    const updatedTask = {
      ...task,
      context,
      prompt,
      companyInfo,
    };
    
    setTask(updatedTask);
    setIsUpdating(false);
    setIsEditing(false);
    
    // 模拟成功保存的提示
    alert('配置已成功保存');
  };

  return {
    task,
    isUpdating,
    isEditing,
    editingContext,
    editingPrompt,
    editingCompanyInfo,
    handleLoadConfig,
    handleStartAnalysis,
    handleStartEditing,
    handleCancelEditing,
    handleSaveConfig,
    setEditingContext,
    setEditingPrompt,
    setEditingCompanyInfo,
  };
};

// 模拟示例使用方法，用于测试组件
export const ConfigurationPanelTestProps = () => {
  const {
    task,
    isUpdating,
    isEditing,
    editingContext,
    editingPrompt,
    editingCompanyInfo,
    handleLoadConfig,
    handleStartAnalysis,
    handleStartEditing,
    handleCancelEditing,
    handleSaveConfig,
    setEditingContext,
    setEditingPrompt,
    setEditingCompanyInfo,
  } = useConfigurationPanelTest();

  // 返回配置面板所需的所有属性
  return {
    task,
    isUpdating,
    onLoadConfig: handleLoadConfig,
    onStartAnalysis: handleStartAnalysis,
    onStartEditing: handleStartEditing,
    isEditing,
    editingContext,
    editingPrompt,
    editingCompanyInfo,
    onEditingContextChange: setEditingContext,
    onEditingPromptChange: setEditingPrompt,
    onEditingCompanyInfoChange: setEditingCompanyInfo,
    onCancelEditing: handleCancelEditing,
    onSaveConfig: handleSaveConfig,
  };
};