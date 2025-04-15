import React from 'react';
import { Menu, Heading1, Heading2, Heading3 } from 'lucide-react';
import Heading from '@tiptap/extension-heading';
import { mergeAttributes } from '@tiptap/core';

// 目录项接口定义
export interface TocItem {
  id: string;
  level: number;
  text: string;
}


// ------------     自定义标题扩展ID属性 -> 以实现目录导航跳转。 ------------
export const CustomHeading = Heading.extend({ //为标题元素添加自定义属性id
    addAttributes() {
      return {
        ...this.parent?.(),   // 保留父类所有属性（即原Heading的扩展）
        // 添加ID属性
        id: {
          default: null,   // 默认值为null
          parseHTML: element => element.getAttribute('id'), // 从HTML元素中解析ID属性
          renderHTML: attributes => {   //将ID属性渲染到HTML元素中，如果ID属性不存在，则返回空对象
            if (!attributes.id) {
              return {}
            }
            return { id: attributes.id }
          },
        },
      }
    },
  
    // 确保在渲染过程中包含ID属性
    renderHTML({ node, HTMLAttributes }) {
      // 检查当前级别是否在配置的级别列表中
      const hasLevel = this.options.levels.includes(node.attrs.level)
      // 如果存在，则使用当前级别，否则使用默认级别[0]
      const level = hasLevel ? node.attrs.level : this.options.levels[0]
  
      return [
        `h${level}`,  // 如 h1, h2, h3
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), // 合并父类和当前级别的HTML属性
        0,  // 没有子节点
      ]
    },
  });

// 生成安全的slug ID函数（用于创建标题的唯一标识符）
export const generateSlug = (text: string): string => {
  const slug = text
    .toLowerCase()
    .replace(/\s+/g, '-')           // 将空格替换为连字符
    .replace(/[^\w\-]+/g, '')       // 移除非字母数字字符
    .replace(/\-\-+/g, '-')         // 将多个连字符替换为单个连字符
    .replace(/^-+/, '')             // 移除开头的连字符
    .replace(/-+$/, '');            // 移除结尾的连字符

  // 确保ID不以连字符或数字开头（HTML ID不能以数字开头）
  return slug ? ((/^[a-zA-Z]/.test(slug) ? '' : 'h-') + slug) : 'heading';
};

// 生成目录函数
export const generateToc = (editor: any, setTocItems: React.Dispatch<React.SetStateAction<TocItem[]>>) => {
  // 如果编辑器为空，则返回
  if (!editor) return;
  
  // 初始化目录项
  const headings: TocItem[] = []; // 存储目录项的数组
  const transaction = editor.state.tr; // 创建一个事务(transaction)用于批量修改编辑器状态
  let hasChanges = false; // 标记是否有修改发生
  
  // 查找文档中的所有标题
  editor.state.doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'heading') {
      // 获取标题文本
      let text = '';
      node.descendants((textNode: any) => {
        if (textNode.text) {
          text += textNode.text;
        }
      });
      
      // 获取标题文本
      const displayText = text || '无标题';
      
      // 为标题生成唯一且可读的ID
      let headingId = node.attrs.id;
      if (!headingId) {
        // 基于文本内容生成ID
        const baseId = generateSlug(displayText);
        // 添加位置后缀以确保同名ID的唯一性
        headingId = `${baseId}-${pos}`;
        
        // 将ID存储在标题节点属性中
        transaction.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          id: headingId,
        });
        
        hasChanges = true; // 标记有修改发生
      }
      
      // 添加到目录项
      headings.push({
        id: headingId,
        level: node.attrs.level,
        text: displayText
      });
    }
  });
  
  // 应用事务
  if (hasChanges && transaction.steps.length > 0) {
    editor.view.dispatch(transaction);
  }
  
  // 更新目录项
  setTocItems(headings);
};

// Add this function before the TableOfContentsProps interface
export const scrollToHeading = (id: string, editor: any, readOnly: boolean) => {
  if (!editor) return;
  
  // 获取当前编辑器的DOM元素
  const editorElement = editor.view.dom;
  
  // 从当前编辑器元素开始查找，而不是整个文档
  const scrollContainer = editorElement.closest('.overflow-y-auto');
  if (!scrollContainer) return;
  
  // 在当前编辑器范围内查找标题元素
  // 使用更安全的方式查找元素
  let headingElement = null;
  try {
    // 尝试使用querySelector
    headingElement = scrollContainer.querySelector(`#${CSS.escape(id)}`);
  } catch (error) {
    // 如果选择器无效，使用遍历的方式查找
    const allHeadings = scrollContainer.querySelectorAll('[id]');
    for (let i = 0; i < allHeadings.length; i++) {
      if (allHeadings[i].id === id) {
        headingElement = allHeadings[i];
        break;
      }
    }
  }
  
  // 如果找到标题元素，使其在视图居中位置显示。 
  if (headingElement) {
    // 计算滚动位置，而不是使用scrollIntoView
    const containerRect = scrollContainer.getBoundingClientRect();
    const headingRect = headingElement.getBoundingClientRect();
    const relativePosition = headingRect.top - containerRect.top;
    
    // 滚动到标题元素位置，但只滚动编辑器内容区域
    scrollContainer.scrollTop = scrollContainer.scrollTop + relativePosition - containerRect.height / 2 + headingRect.height / 2;
    
    // 如果不是只读模式，聚焦标题
    if (!readOnly) {
      setTimeout(() => {  //使用setTimeout延迟，确保DOM已经更新
        // 获取DOM位置
        const view = editor.view;
        const domPos = view.posAtDOM(headingElement, 0);  
        
        if (domPos > -1) {
          // 将选择设置到标题
          editor.commands.setTextSelection(domPos);
          editor.commands.focus();
        }
      }, 100);
    }
  }
};

interface TableOfContentsProps {
  tocItems: TocItem[];
  tocVisible: boolean;
  setTocVisible: (visible: boolean) => void;
  editor: any;
  readOnly: boolean;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({
  tocItems,
  tocVisible,
  setTocVisible,
  editor,
  readOnly,
}) => {
  if (tocItems.length === 0) return null;

  return (
    <>
      {/* 顶部目录工具栏 */}
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={() => setTocVisible(!tocVisible)}
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 p-2"
        >
          <Menu size={16} className="mr-1" />
          {tocVisible ? '隐藏目录' : '显示目录'}
        </button>
      </div>
      
      {/* 目录导航区域 */}
      {tocVisible && (
        <div className="w-64 border border-gray-200 rounded-md p-3 bg-gray-50 flex flex-col">
          <div className="font-medium text-gray-700 mb-2 flex items-center">
            <Menu size={16} className="mr-1.5" />
            文档目录
          </div>
          
          {/* 目录列表应当填充剩余空间，而不是固定高度 */}
          <ul className="space-y-1 overflow-y-auto flex-grow">
            {tocItems.map((item) => (
              <li 
                key={item.id}
                style={{ marginLeft: `${(item.level - 1) * 12}px` }}
                className="text-sm truncate"
              >
                <button
                  onClick={() => scrollToHeading(item.id, editor, readOnly)}
                  className="flex items-center text-left py-1 px-2 w-full rounded hover:bg-gray-200 text-gray-700"
                >
                  {item.level === 1 ? (
                    <Heading1 size={14} className="mr-1 text-gray-500" />
                  ) : item.level === 2 ? (
                    <Heading2 size={14} className="mr-1 text-gray-500" />
                  ) : (
                    <Heading3 size={14} className="mr-1 text-gray-500" />
                  )}
                  <span className="truncate">{item.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default TableOfContents;
