// mockData.ts
import { DocNode } from './DocumentTree';

// 模拟原始文档数据
const originalDocument: DocNode = {
  id: "root",
  title: "软件架构设计文档",
  level: 1,
  content: "本文档描述了系统的软件架构设计，包括系统组件、接口和数据流。",
  children: [
    {
      id: "section1",
      title: "1. 架构概述",
      level: 2,
      content: "本节介绍系统整体架构和设计原则。",
      children: [
        {
          id: "section1-1",
          title: "1.1 系统架构",
          level: 3,
          content: "本系统采用微服务架构，包含用户服务、文档服务、分析服务和通知服务等核心组件。各服务间通过RESTful API和消息队列进行通信。\n\n系统采用前后端分离模式，前端使用React框架，后端使用Spring Boot。\n\n数据存储层使用MySQL关系型数据库和MongoDB非关系型数据库。",
          children: []
        },
        {
          id: "section1-2",
          title: "1.2 设计原则",
          level: 3,
          content: "- 高内聚低耦合\n- 单一职责\n- 开闭原则\n- 可扩展性优先\n- 容错性设计\n- 安全性设计",
          children: []
        }
      ]
    },
    {
      id: "section2",
      title: "2. 系统组件",
      level: 2,
      content: "本节详细描述系统各核心组件的功能和接口。",
      children: [
        {
          id: "section2-1",
          title: "2.1 用户服务",
          level: 3,
          content: "用户服务负责用户注册、认证、授权和个人信息管理。\n\n主要接口：\n- /api/users/register\n- /api/users/login\n- /api/users/profile\n- /api/users/permissions",
          children: []
        },
        {
          id: "section2-2",
          title: "2.2 文档服务",
          level: 3,
          content: "文档服务负责文档上传、解析、存储和版本管理。\n\n主要接口：\n- /api/documents/upload\n- /api/documents/{id}\n- /api/documents/{id}/versions\n- /api/documents/{id}/structure",
          children: []
        }
      ]
    }
  ]
};

// 模拟上传的文档数据
const uploadedDocument: DocNode = {
  id: "root",
  title: "项目需求规格说明书",
  level: 1,
  content: "本文档详细描述了项目需求，包括功能性和非功能性需求。",
  children: [
    {
      id: "section1",
      title: "1. 引言",
      level: 2,
      content: "本节介绍文档的目的、范围和术语定义。",
      children: [
        {
          id: "section1-1",
          title: "1.1 目的",
          level: 3,
          content: "本文档旨在详细说明系统需求，为开发团队和项目相关方提供明确的需求参考。",
          children: []
        },
        {
          id: "section1-2",
          title: "1.2 范围",
          level: 3,
          content: "本文档涵盖系统的所有功能模块和非功能性需求。",
          children: []
        },
        {
          id: "section1-3",
          title: "1.3 定义",
          level: 3,
          content: "- 用户：系统的最终使用者\n- 管理员：系统的管理人员\n- 文档：用户上传的各类文件\n- 分析：对文档内容的智能处理",
          children: []
        }
      ]
    },
    {
      id: "section2",
      title: "2. 功能需求",
      level: 2,
      content: "本节描述系统应实现的功能需求。",
      children: [
        {
          id: "section2-1",
          title: "2.1 用户管理",
          level: 3,
          content: "系统应支持用户注册、登录、找回密码等基本功能。",
          children: []
        },
        {
          id: "section2-2",
          title: "2.2 文档管理",
          level: 3,
          content: "系统应支持文档上传、查看、编辑和删除等操作。",
          children: []
        },
        {
          id: "section2-3",
          title: "2.3 权限管理",
          level: 3,
          content: "系统应实现基于角色的访问控制，确保数据安全。",
          children: []
        }
      ]
    }
  ]
};

// 模拟大模型分析后的增强文档
const enhancedDocument: DocNode = {
  ...uploadedDocument,
  children: [
    ...uploadedDocument.children,
    {
      id: "section3",
      title: "3. 非功能需求",
      level: 2,
      content: "本节描述系统的非功能性需求，包括性能、安全性、可用性等方面。",
      isNew: true,
      children: [
        {
          id: "section3-1",
          title: "3.1 性能需求",
          level: 3,
          content: "- 系统响应时间：页面加载时间不超过2秒\n- 并发用户数：系统应支持至少1000个并发用户\n- 文档处理时间：单个文档处理时间不超过30秒",
          isNew: true,
          children: []
        },
        {
          id: "section3-2",
          title: "3.2 安全需求",
          level: 3,
          content: "- 数据传输加密：所有数据传输应使用HTTPS\n- 身份验证：实现多因素身份验证\n- 数据保护：敏感数据应加密存储\n- 审计日志：记录所有关键操作",
          isNew: true,
          children: []
        },
        {
          id: "section3-3",
          title: "3.3 可用性需求",
          level: 3,
          content: "- 系统可用性：99.9%的系统在线时间\n- 灾难恢复：RTO不超过4小时，RPO不超过15分钟\n- 备份策略：每日增量备份，每周全量备份",
          isNew: true,
          children: []
        }
      ]
    },
    {
      id: "section4",
      title: "4. 系统约束",
      level: 2,
      content: "本节描述系统开发和部署的各种约束条件。",
      isNew: true,
      children: [
        {
          id: "section4-1",
          title: "4.1 技术约束",
          level: 3,
          content: "- 前端框架：React + TypeScript\n- 后端框架：Spring Boot\n- 数据库：PostgreSQL\n- 部署环境：Docker + Kubernetes",
          isNew: true,
          children: []
        },
        {
          id: "section4-2",
          title: "4.2 业务约束",
          level: 3,
          content: "- 法规遵从：系统必须符合GDPR和当地数据保护法规\n- 行业标准：系统应遵循行业最佳实践和标准",
          isNew: true,
          children: []
        }
      ]
    }
  ]
};

// 原始文档的修改版本
const modifiedDocument: DocNode = {
  ...uploadedDocument,
  children: uploadedDocument.children.map(child => {
    if (child.id === "section2") {
      return {
        ...child,
        isModified: true,
        content: "本节详细描述系统应实现的所有功能性需求，包括核心功能和扩展功能。",
        children: [
          ...child.children,
          {
            id: "section2-4",
            title: "2.4 文档智能分析",
            level: 3,
            content: "系统应能对上传的文档进行智能分析，包括：\n- 文档结构提取和优化\n- 关键信息识别\n- 内容摘要生成\n- 相似文档比较\n- 标题层级优化与建议",
            isNew: true,
            children: []
          },
          {
            id: "section2-5",
            title: "2.5 协作功能",
            level: 3,
            content: "系统应支持多用户协作编辑文档，包括：\n- 实时协作编辑\n- 变更追踪\n- 评论和讨论\n- 任务分配与管理",
            isNew: true,
            children: []
          }
        ].map(subChild => {
          if (subChild.id === "section2-2") {
            return {
              ...subChild,
              isModified: true,
              title: "2.2 文档管理与处理",
              content: "系统应支持文档的全生命周期管理，包括：\n- 文档上传与导入多种格式（DOCX, PDF, Markdown等）\n- 文档结构可视化\n- 文档版本控制\n- 文档导出与分享\n- 文档标签和分类\n- 全文检索",
            };
          }
          return subChild;
        })
      };
    }
    return child;
  })
};

// 导出模拟数据
export const mockDocumentData: Record<string, DocNode> = {
  default: originalDocument,
  uploaded: uploadedDocument,
  enhanced: enhancedDocument,
  modified: modifiedDocument,
  uploaded_analyzed: enhancedDocument,
  default_analyzed: {
    ...originalDocument,
    children: [
      ...originalDocument.children,
      {
        id: "section3",
        title: "3. 数据设计",
        level: 2,
        content: "本节描述系统的数据模型和数据流。",
        isNew: true,
        children: [
          {
            id: "section3-1",
            title: "3.1 数据模型",
            level: 3,
            content: "详细描述系统的实体关系模型、数据库表设计等。",
            isNew: true,
            children: []
          },
          {
            id: "section3-2",
            title: "3.2 数据流",
            level: 3,
            content: "描述系统中的主要数据流和数据处理过程。",
            isNew: true,
            children: []
          }
        ]
      }
    ]
  }
};