import { TaskStatus } from './hook&APIs.tsx/tasksApi';
import { TaskType } from '@/_types/projects_dt_stru/projectTasks_interface';

// 模拟任务数据，用于组件测试
export const testTasks = {
  // 配置阶段的任务
  configuring: {
    id: 'task-001-configuring',
    projectId: 'project-001',
    stageType: 'TENDER_ANALYSIS',
    status: TaskStatus.CONFIGURING,
    context: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '这是一个招标文件分析任务，需要从招标文件中提取关键信息。'
            }
          ]
        }
      ]
    }),
    prompt: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '请分析以下招标文件，提取项目名称、招标方、预算金额、投标截止日期等关键信息。'
            }
          ]
        }
      ]
    }),
    companyInfo: JSON.stringify({
      companyName: '示例科技有限公司',
      industry: '信息技术',
      mainProducts: '软件开发、系统集成',
    }),
    originalResult: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Test Task',
    type: 'ANALYSIS' as TaskType
  },
  
  // 分析阶段的任务
  analyzing: {
    id: 'task-002-analyzing',
    projectId: 'project-001',
    stageType: 'TENDER_ANALYSIS',
    status: TaskStatus.PROCESSING,
    context: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '这是一个招标文件分析任务，需要从招标文件中提取关键信息。'
            }
          ]
        }
      ]
    }),
    prompt: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '请分析以下招标文件，提取项目名称、招标方、预算金额、投标截止日期等关键信息。'
            }
          ]
        }
      ]
    }),
    companyInfo: JSON.stringify({
      companyName: '示例科技有限公司',
      industry: '信息技术',
      mainProducts: '软件开发、系统集成',
    }),
    originalResult: '',
    progress: 45,
    currentStep: '正在分析招标文件第3页，提取关键信息...',
    logs: [
      '开始分析招标文件...',
      '已完成文件预处理',
      '正在提取第1页关键信息',
      '正在提取第2页关键信息',
      '正在提取第3页关键信息',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Test Task',
    type: 'ANALYSIS' as TaskType
  },
  
  // 审核阶段的任务
  reviewing: {
    id: 'task-003-reviewing',
    projectId: 'project-001',
    stageType: 'TENDER_ANALYSIS',
    status: TaskStatus.REVIEWING,
    context: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '这是一个招标文件分析任务，需要从招标文件中提取关键信息。'
            }
          ]
        }
      ]
    }),
    prompt: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '请分析以下招标文件，提取项目名称、招标方、预算金额、投标截止日期等关键信息。'
            }
          ]
        }
      ]
    }),
    companyInfo: JSON.stringify({
      companyName: '示例科技有限公司',
      industry: '信息技术',
      mainProducts: '软件开发、系统集成',
    }),
    originalResult: `# 招标文件分析结果

## 基本信息
- 项目名称：智慧城市综合管理平台建设项目
- 招标编号：ZB2023-0045
- 招标方：某市城市管理局
- 采购方式：公开招标

## 项目预算
- 总预算金额：¥5,000,000.00
- 分项预算：
  * 软件开发：¥3,000,000.00
  * 硬件设备：¥1,500,000.00
  * 技术服务：¥500,000.00

## 时间节点
- 发布日期：2023年5月15日
- 投标截止日期：2023年6月15日
- 开标时间：2023年6月16日 10:00

## 资质要求
1. 投标人须具有软件开发相关资质证书
2. 近三年内至少完成过2个类似项目
3. 注册资金不低于1000万元

## 评标方法
- 综合评分法，技术分占70%，商务分占30%`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Test Task',
    type: 'REVIEW' as TaskType
  },
  
  // 已完成的任务
  completed: {
    id: 'task-004-completed',
    projectId: 'project-001',
    stageType: 'TENDER_ANALYSIS',
    status: TaskStatus.COMPLETED,
    context: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '这是一个招标文件分析任务，需要从招标文件中提取关键信息。'
            }
          ]
        }
      ]
    }),
    prompt: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '请分析以下招标文件，提取项目名称、招标方、预算金额、投标截止日期等关键信息。'
            }
          ]
        }
      ]
    }),
    companyInfo: JSON.stringify({
      companyName: '示例科技有限公司',
      industry: '信息技术',
      mainProducts: '软件开发、系统集成',
    }),
    originalResult: `# 招标文件分析结果

## 基本信息
- 项目名称：智慧城市综合管理平台建设项目
- 招标编号：ZB2023-0045
- 招标方：某市城市管理局
- 采购方式：公开招标

## 项目预算
- 总预算金额：¥5,000,000.00
- 分项预算：
  * 软件开发：¥3,000,000.00
  * 硬件设备：¥1,500,000.00
  * 技术服务：¥500,000.00

## 时间节点
- 发布日期：2023年5月15日
- 投标截止日期：2023年6月15日
- 开标时间：2023年6月16日 10:00

## 资质要求
1. 投标人须具有软件开发相关资质证书
2. 近三年内至少完成过2个类似项目
3. 注册资金不低于1000万元

## 评标方法
- 综合评分法，技术分占70%，商务分占30%`,
    finalResult: `# 招标文件分析结果

## 基本信息
- 项目名称：智慧城市综合管理平台建设项目
- 招标编号：ZB2023-0045
- 招标方：某市城市管理局
- 采购方式：公开招标

## 项目预算
- 总预算金额：¥5,000,000.00
- 分项预算：
  * 软件开发：¥3,000,000.00
  * 硬件设备：¥1,500,000.00
  * 技术服务：¥500,000.00

## 时间节点
- 发布日期：2023年5月15日
- 投标截止日期：2023年6月15日
- 开标时间：2023年6月16日 10:00

## 资质要求
1. 投标人须具有软件开发相关资质证书
2. 近三年内至少完成过2个类似项目
3. 注册资金不低于1000万元

## 评标方法
- 综合评分法，技术分占70%，商务分占30%

## 竞争分析
- 预计参与竞标企业：5-8家
- 主要竞争对手：某科技集团、某信息技术有限公司
- 我司优势：已完成3个类似项目，技术团队经验丰富`,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Test Task',
    type: 'REVIEW' as TaskType
  },
  
  // 等待前置任务的任务
  pending: {
    id: 'task-005-pending',
    projectId: 'project-001',
    stageType: 'TENDER_ANALYSIS',
    status: TaskStatus.NOT_STARTED,
    context: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: ''
            }
          ]
        }
      ]
    }),
    prompt: JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: ''
            }
          ]
        }
      ]
    }),
    companyInfo: JSON.stringify({ 
      companyName: '', 
      industry: '', 
      mainProducts: '' 
    }),
    originalResult: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: 'Test Task',
    type: 'ANALYSIS' as TaskType
  },
};

// 使用示例：
// import { testTasks } from './testData';
// 
// // 在组件中使用
// const [task, setTask] = useState(testTasks.configuring);
// 
// // 切换到不同状态进行测试
// const switchToAnalyzing = () => setTask(testTasks.analyzing); 