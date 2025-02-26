// data/mockData.ts
import { ProjectPhase } from '@/components/projects/ProjectManagement_v2/types';

export const mockData: ProjectPhase[] = [
  {
    id: "planning",
    name: "规划阶段",
    status: "completed",
    description: "项目目标、范围和资源规划",
    tasks: [
      { id: "t1", name: "需求分析", status: "completed", date: "2023-01-10" },
      { id: "t2", name: "范围定义", status: "completed", date: "2023-01-15" },
      { id: "t3", name: "资源分配", status: "completed", date: "2023-01-20" }
    ],
    documents: [
      { id: "d1", name: "项目章程", url: "#" },
      { id: "d2", name: "需求文档", url: "#" }
    ],
    team: [
      { id: "u1", name: "张三", role: "项目经理" },
      { id: "u2", name: "李四", role: "业务分析师" }
    ]
  },
  {
    id: "design",
    name: "设计阶段",
    status: "completed",
    description: "系统架构与UI设计",
    tasks: [
      { id: "t4", name: "架构设计", status: "completed", date: "2023-02-05" },
      { id: "t5", name: "UI/UX设计", status: "completed", date: "2023-02-15" },
      { id: "t6", name: "数据库设计", status: "completed", date: "2023-02-20" }
    ],
    documents: [
      { id: "d3", name: "架构文档", url: "#" },
      { id: "d4", name: "UI原型", url: "#" }
    ],
    team: [
      { id: "u3", name: "王五", role: "架构师" },
      { id: "u4", name: "赵六", role: "UI设计师" }
    ]
  },
  {
    id: "development",
    name: "开发阶段",
    status: "in-progress",
    description: "功能实现与单元测试",
    tasks: [
      { id: "t7", name: "前端开发", status: "in-progress", date: "2023-03-01" },
      { id: "t8", name: "后端开发", status: "in-progress", date: "2023-03-05" },
      { id: "t9", name: "API集成", status: "pending", date: "2023-03-20" }
    ],
    documents: [
      { id: "d5", name: "API文档", url: "#" },
      { id: "d6", name: "开发规范", url: "#" }
    ],
    team: [
      { id: "u5", name: "小明", role: "前端开发" },
      { id: "u6", name: "小红", role: "后端开发" }
    ]
  },
  {
    id: "testing",
    name: "测试阶段",
    status: "pending",
    description: "集成测试与用户验收测试",
    tasks: [
      { id: "t10", name: "集成测试", status: "pending", date: "2023-04-05" },
      { id: "t11", name: "性能测试", status: "pending", date: "2023-04-10" },
      { id: "t12", name: "UAT", status: "pending", date: "2023-04-20" }
    ],
    documents: [
      { id: "d7", name: "测试计划", url: "#" },
      { id: "d8", name: "测试用例", url: "#" }
    ],
    team: [
      { id: "u7", name: "小张", role: "测试工程师" },
      { id: "u8", name: "小李", role: "QA" }
    ]
  },
  {
    id: "deployment",
    name: "部署阶段",
    status: "pending",
    description: "系统部署与运维",
    tasks: [
      { id: "t13", name: "环境配置", status: "pending", date: "2023-05-05" },
      { id: "t14", name: "部署上线", status: "pending", date: "2023-05-10" },
      { id: "t15", name: "监控设置", status: "pending", date: "2023-05-15" }
    ],
    documents: [
      { id: "d9", name: "部署文档", url: "#" },
      { id: "d10", name: "运维手册", url: "#" }
    ],
    team: [
      { id: "u9", name: "小王", role: "运维工程师" },
      { id: "u10", name: "小赵", role: "DevOps" }
    ]
  }
];

export default mockData;