/**
 * 测试数据文件，用于测试 TiptapEditor_lite 的各项功能
 */

// 基本文本内容测试数据
export const basicTextContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '这是一个基本的文本内容测试。' }
        ]
      }
    ]
  };
  
  // 富文本格式测试数据
  export const richTextContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '这是' },
          { type: 'text', marks: [{ type: 'bold' }], text: '粗体文本' },
          { type: 'text', text: '，这是' },
          { type: 'text', marks: [{ type: 'italic' }], text: '斜体文本' },
          { type: 'text', text: '，这是' },
          { type: 'text', marks: [{ type: 'underline' }], text: '下划线文本' },
          { type: 'text', text: '，这是' },
          { type: 'text', marks: [{ type: 'strike' }], text: '删除线文本' },
          { type: 'text', text: '。' }
        ]
      }
    ]
  };
  
  // 标题测试数据
  export const headingsContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: '一级标题' }]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '二级标题' }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '三级标题' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '这是正文内容。' }]
      }
    ]
  };
  
  // 列表测试数据
  export const listsContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '无序列表示例：' }]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '列表项 1' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '列表项 2' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '列表项 3' }]
              }
            ]
          }
        ]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '有序列表示例：' }]
      },
      {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '第一步' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '第二步' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '第三步' }]
              }
            ]
          }
        ]
      }
    ]
  };
  
  // 链接测试数据
  export const linksContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '这是一个' },
          {
            type: 'text',
            marks: [{ type: 'link', attrs: { href: 'https://example.com', target: '_blank' } }],
            text: '链接示例'
          },
          { type: 'text', text: '，点击可以访问。' }
        ]
      }
    ]
  };
  
  // 代码块测试数据
  export const codeBlockContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '以下是一个代码块示例：' }]
      },
      {
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [
          {
            type: 'text',
            text: 'function hello() {\n  console.log("Hello, world!");\n  return true;\n}'
          }
        ]
      }
    ]
  };
  
  // 引用块测试数据
  export const blockquoteContent = {
    type: 'doc',
    content: [
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '这是一个引用块示例。引用块通常用于引用他人的话语或者突出显示某些重要内容。' }
            ]
          }
        ]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '这是引用块之后的正文内容。' }]
      }
    ]
  };
  
  // 水平线测试数据
  export const horizontalRuleContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '以下是一条水平线：' }]
      },
      {
        type: 'horizontalRule'
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '这是水平线之后的内容。' }]
      }
    ]
  };
  
  // 复杂混合内容测试数据
  export const complexContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'TiptapEditor 功能测试' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '这是一个' },
          { type: 'text', marks: [{ type: 'bold' }], text: '综合测试' },
          { type: 'text', text: '文档，包含了多种富文本编辑器功能。' }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '文本格式' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '支持' },
          { type: 'text', marks: [{ type: 'bold' }], text: '粗体' },
          { type: 'text', text: '、' },
          { type: 'text', marks: [{ type: 'italic' }], text: '斜体' },
          { type: 'text', text: '、' },
          { type: 'text', marks: [{ type: 'underline' }], text: '下划线' },
          { type: 'text', text: '和' },
          { type: 'text', marks: [{ type: 'strike' }], text: '删除线' },
          { type: 'text', text: '等基本格式。' }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '列表功能' }]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '无序列表项 1' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '无序列表项 2' }]
              }
            ]
          }
        ]
      },
      {
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '有序列表项 1' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '有序列表项 2' }]
              }
            ]
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '引用和代码' }]
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: '这是一个引用块，可以用来引用重要内容。' }
            ]
          }
        ]
      },
      {
        type: 'codeBlock',
        attrs: { language: 'typescript' },
        content: [
          {
            type: 'text',
            text: 'interface User {\n  name: string;\n  age: number;\n}\n\nconst user: User = {\n  name: "张三",\n  age: 30\n};'
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '链接' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '点击' },
          {
            type: 'text',
            marks: [{ type: 'link', attrs: { href: 'https://tiptap.dev/', target: '_blank' } }],
            text: 'Tiptap 官网'
          },
          { type: 'text', text: '了解更多信息。' }
        ]
      },
      {
        type: 'horizontalRule'
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '以上是各种编辑器功能的综合测试。' }]
      }
    ]
  };
  
  // 空内容测试数据
  export const emptyContent = {
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  };
  
  // 导出所有测试数据的集合
  export const allTestData = {
    basicTextContent,
    richTextContent,
    headingsContent,
    listsContent,
    linksContent,
    codeBlockContent,
    blockquoteContent,
    horizontalRuleContent,
    complexContent,
    emptyContent
  };