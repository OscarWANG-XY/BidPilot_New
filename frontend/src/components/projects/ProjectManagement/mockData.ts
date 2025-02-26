// data/mockData.ts
import { ProjectPhase, PhaseStatus, TaskStatus, TaskType } from './types'
import { ProjectStage, ProjectStatus } from '../../../types/projects_dt_stru'
import { FileType } from '../../../types/files_dt_stru';

// 示例项目状态
export const mockProjectStatus = ProjectStatus.IN_PROGRESS;

export const mockData: ProjectPhase[] = [
  {
    id: 'phase-1',
    name: '招标文件分析',
    stage: ProjectStage.TENDER_ANALYSIS,
    status: PhaseStatus.COMPLETED,
    description: '分析招标文件结构和要求',
    startDate: '2023-10-01',
    endDate: '2023-10-05',
    progress: 100,
    tasks: [
      {
        id: 'task-1-1',
        name: '提取文档信息',
        type: TaskType.DOCUMENT_EXTRACTION,
        status: TaskStatus.COMPLETED,
        priority: 'HIGH',
        date: '2023-10-01',
        description: 'AI提取招标文件关键信息',
        isAutomatic: true,
        aiAssisted: true,
        progress: 100,
        attachments: [
          {
            id: 'att-1',
            name: '招标文件原件.pdf',
            url: '/documents/tender.pdf',
            size: 5120,
            type: FileType.PDF,
            processingStatus: 'COMPLETED',
            createdAt: '2023-10-01',
            createdBy: 'system',
            version: 1
          }
        ]
      },
      {
        id: 'task-1-2',
        name: '构建文档树',
        type: TaskType.DOCUMENT_TREE_BUILDING,
        status: TaskStatus.COMPLETED,
        date: '2023-10-02',
        description: '构建招标文件结构树',
        aiAssisted: true,
        progress: 100
      }
    ],
    documents: [
      {
        id: 'doc-1',
        name: '招标文件分析报告',
        url: '/documents/analysis.pdf',
        size: 2048,
        type: FileType.PDF,
        processingStatus: 'COMPLETED',
        createdAt: '2023-10-05',
        createdBy: 'user-1',
        version: 1
      }
    ]
  },
  {
    id: 'phase-2',
    name: '投标文件撰写',
    stage: ProjectStage.BID_WRITING,
    status: PhaseStatus.IN_PROGRESS,
    description: '编写投标文件各章节',
    startDate: '2023-10-06',
    endDate: '2023-10-20',
    progress: 60,
    tasks: [
      {
        id: 'task-2-1',
        name: '技术方案撰写',
        type: TaskType.TECHNICAL_SOLUTION,
        status: TaskStatus.PROCESSING,
        priority: 'HIGH',
        date: '2023-10-06',
        dueDate: '2023-10-15',
        description: '编写技术解决方案章节',
        aiAssisted: true,
        progress: 70,
        chapterReference: '第三章 技术方案',
        comments: [
          {
            id: 'comment-1',
            content: '需要补充更多技术细节',
            createdAt: '2023-10-10'
          }
        ]
      },
      {
        id: 'task-2-2',
        name: '价格方案制定',
        type: TaskType.PRICE_PROPOSAL,
        status: TaskStatus.PENDING,
        date: '2023-10-12',
        dueDate: '2023-10-18',
        description: '制定项目价格方案',
        progress: 30,
        dependencies: ['task-2-1']
      }
    ],
    documents: [
      {
        id: 'doc-2',
        name: '技术方案草稿',
        url: '/documents/tech_draft.docx',
        size: 1536,
        type: FileType.WORD,
        processingStatus: 'COMPLETED',
        createdAt: '2023-10-08',
        createdBy: 'user-2',
        version: 2
      }
    ]
  },
  {
    id: 'phase-3',
    name: '投标文件修订',
    stage: ProjectStage.BID_REVISION,
    status: PhaseStatus.NOT_STARTED,
    description: '修订和完善投标文件',
    startDate: '2023-10-21',
    endDate: '2023-10-25',
    progress: 0,
    tasks: [
      {
        id: 'task-3-1',
        name: '文档审核',
        type: TaskType.DOCUMENT_REVIEW,
        status: TaskStatus.PENDING,
        date: '2023-10-21',
        description: '审核投标文件内容',
        dependencies: ['task-2-1', 'task-2-2']
      },
      {
        id: 'task-3-2',
        name: '文档修订',
        type: TaskType.DOCUMENT_REVISION,
        status: TaskStatus.PENDING,
        date: '2023-10-23',
        description: '根据审核意见修订文档',
        dependencies: ['task-3-1']
      }
    ],
    documents: []
  },
  {
    id: 'phase-4',
    name: '投标文件生产',
    stage: ProjectStage.BID_PRODUCTION,
    status: PhaseStatus.NOT_STARTED,
    description: '生成最终投标文件',
    startDate: '2023-10-26',
    endDate: '2023-10-30',
    progress: 0,
    tasks: [
      {
        id: 'task-4-1',
        name: '文档排版',
        type: TaskType.DOCUMENT_PRODUCTION,
        status: TaskStatus.PENDING,
        date: '2023-10-26',
        description: '排版最终投标文件',
        dependencies: ['task-3-2']
      },
      {
        id: 'task-4-2',
        name: '生成PDF文件',
        type: TaskType.DOCUMENT_PRODUCTION,
        status: TaskStatus.PENDING,
        date: '2023-10-28',
        description: '生成最终PDF文件',
        dependencies: ['task-4-1']
      }
    ],
    documents: []
  }
]

export default mockData;