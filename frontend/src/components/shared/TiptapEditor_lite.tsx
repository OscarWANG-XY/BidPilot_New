// src/components/TiptapEditor_lite.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import { mergeAttributes } from '@tiptap/core';
import Table from '@tiptap/extension-table';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import {
  Bold,
  Italic,
  Strikethrough,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Code,
  Minus,
  Undo,
  Redo,
  LucideProps,
  Menu,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 自定义 Heading 扩展，支持 ID 属性
const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      // 添加 ID 属性
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }
          return { id: attributes.id }
        },
      },
    }
  },

  // 确保渲染时包含 ID 属性
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level)
    const level = hasLevel ? node.attrs.level : this.options.levels[0]

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ]
  },
});

// Icon类型定义
type IconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// Enhanced toolbar button with icon and tooltip
const ToolbarButton = ({ 
  onClick, 
  active, 
  children, 
  icon, 
  tooltip, 
  disabled = false 
}: { 
  onClick: () => void; 
  active?: boolean; 
  disabled?: boolean;
  children?: React.ReactNode;
  icon: IconComponent;
  tooltip: string;
}) => {
  const Icon = icon;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded mr-1.5 mb-1.5 text-sm font-medium transition-colors flex items-center justify-center
              ${active 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`
            }
            aria-label={tooltip}
          >
            <Icon size={18} />
            {children && <span className="ml-1">{children}</span>}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// 目录导航项接口
interface TocItem {
  id: string;
  level: number;
  text: string;
}

// 创建一个函数来生成安全的 slug ID
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')           // 替换空格为连字符
    .replace(/[^\w\-]+/g, '')       // 删除非字母数字字符
    .replace(/\-\-+/g, '-')         // 替换多个连字符为单个连字符
    .replace(/^-+/, '')             // 去除开头的连字符
    .replace(/-+$/, '');            // 去除结尾的连字符
};

type TiptapEditorLiteProps = {
  initialContent?: string;
  onChange?: (content: string) => void;
  maxHeight?: number;
  showToc?: boolean;
  readOnly?: boolean;
};

const TiptapEditor_lite: React.FC<TiptapEditorLiteProps> = ({ 
  initialContent = '',
  onChange,
  maxHeight = 400,
  showToc = true,
  readOnly = false
}) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [tocVisible, setTocVisible] = useState(true);
  
  // 生成目录功能 - 为标题添加 ID 并收集目录项
  const generateToc = useCallback((editor: any) => {
    if (!editor) return;
    
    const headings: TocItem[] = [];
    const transaction = editor.state.tr;
    let hasChanges = false;
    
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
        
        const displayText = text || '无标题';
        
        // 为标题生成唯一且可读的 ID
        // 优先使用已有 ID，如果没有则基于文本生成新 ID
        let headingId = node.attrs.id;
        
        if (!headingId) {
          // 基于文本内容生成 ID
          const baseId = generateSlug(displayText);
          
          // 在同名 ID 的情况下添加位置后缀确保唯一性
          headingId = `${baseId}-${pos}`;
          
          // 将 ID 存储到标题节点属性中
          transaction.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id: headingId,
          });
          
          hasChanges = true;
        }
        
        // 添加到目录项
        headings.push({
          id: headingId,
          level: node.attrs.level,
          text: displayText
        });
      }
    });
    
    // 应用事务更新编辑器内容
    if (hasChanges && transaction.steps.length > 0) {
      editor.view.dispatch(transaction);
    }
    
    setTocItems(headings);
  }, []);

  // Initialize editor with content and custom extensions
  const editor = useEditor({
    extensions: [
      // 使用自定义 Heading 扩展替代 StarterKit 中的 Heading
      StarterKit.configure({
        heading: false, // 禁用默认 Heading
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      // 添加自定义 Heading 扩展
      CustomHeading.configure({
        levels: [1, 2, 3],
      }),
      Table.configure({
        resizable: true,
      }),
      TableHeader,
      TableRow,
      TableCell,
      TextStyle,
      Color,
    ],
    content: initialContent ? (() => {
      try {
        console.log('尝试解析 initialContent:', initialContent.substring(0, 100) + '...');
        const parsed = JSON.parse(initialContent);
        console.log('解析成功，内容类型:', typeof parsed);
        return parsed;
      } catch (error) {
        console.error('解析 initialContent 失败:', error);
        return ''; // 提供一个默认值
      }
    })() : '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // 当编辑器内容更新时，重新生成目录
      generateToc(editor);
      
      // 如果提供了onChange回调，则传递编辑器内容
      if (onChange) {
        onChange(JSON.stringify(editor.getJSON()));
      }
    },
  });

  // 初始生成目录
  useEffect(() => {
    if (editor) {
      generateToc(editor);
    }
  }, [editor, generateToc]);

  // 当initialContent变化时更新编辑器内容
  useEffect(() => {
    if (editor && initialContent) {
      try {
        const content = JSON.parse(initialContent);
        editor.commands.setContent(content);
        // 内容加载后重新生成目录
        setTimeout(() => {
          generateToc(editor);
        }, 100);
      } catch (error) {
        console.error('Failed to parse Tiptap content:', error);
      }
    }
  }, [initialContent, editor, generateToc]);

  // 滚动到指定标题位置
  const scrollToHeading = (id: string) => {
    if (!editor) return;
    
    // 获取编辑器容器元素 - 修改为获取可滚动的容器
    const scrollContainer = document.querySelector('.tiptap-content')?.closest('.overflow-y-auto');
    if (!scrollContainer) return;
    
    // 查找标题 DOM 元素
    const headingElement = document.getElementById(id);
    
    if (headingElement) {
      // 计算滚动位置，而不是使用scrollIntoView
      const containerRect = scrollContainer.getBoundingClientRect();
      const headingRect = headingElement.getBoundingClientRect();
      const relativePosition = headingRect.top - containerRect.top;
      
      // 滚动到标题元素位置，但只滚动编辑器内容区域
      scrollContainer.scrollTop = scrollContainer.scrollTop + relativePosition - containerRect.height / 2 + headingRect.height / 2;
      
      // 如果不是只读模式，聚焦该标题
      if (!readOnly) {
        setTimeout(() => {
          // 获取 DOM 位置
          const view = editor.view;
          const domPos = view.posAtDOM(headingElement, 0);
          
          if (domPos > -1) {
            // 设置选区到该标题
            editor.commands.setTextSelection(domPos);
            editor.commands.focus();
          }
        }, 100);
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          {showToc && tocItems.length > 0 && (
            <button 
              onClick={() => setTocVisible(!tocVisible)}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 p-2"
            >
              <Menu size={16} className="mr-1" />
              {tocVisible ? '隐藏目录' : '显示目录'}
            </button>
          )}
        </div>
        
        {/* 目录和编辑器的布局容器 */}
        <div className="flex gap-4">
          {/* 目录导航区域 */}
          {showToc && tocVisible && tocItems.length > 0 && (
            <div className="w-64 border border-gray-200 rounded-md p-3 bg-gray-50">
              <div className="font-medium text-gray-700 mb-2 flex items-center">
                <Menu size={16} className="mr-1.5" />
                文档目录
              </div>
              
              <ul className="space-y-1 max-h-80 overflow-y-auto">
                {tocItems.map((item) => (
                  <li 
                    key={item.id}
                    style={{ marginLeft: `${(item.level - 1) * 12}px` }}
                    className="text-sm truncate"
                  >
                    <button
                      onClick={() => scrollToHeading(item.id)}
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
          
          {/* 内容编辑区容器 */}
          <div className={`relative border border-gray-200 rounded-md flex-1 ${showToc && tocVisible ? 'w-3/4' : 'w-full'}`}>
            {/* 固定在顶部的工具栏 - 只在非只读模式下显示 */}
            {!readOnly && (
              <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 rounded-t-md p-2 flex flex-wrap">
                <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    active={editor?.isActive('bold')}
                    disabled={!editor?.can().chain().focus().toggleBold().run()}
                    icon={Bold}
                    tooltip="粗体 (Ctrl+B)"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    active={editor?.isActive('italic')}
                    disabled={!editor?.can().chain().focus().toggleItalic().run()}
                    icon={Italic}
                    tooltip="斜体 (Ctrl+I)"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    active={editor?.isActive('strike')}
                    disabled={!editor?.can().chain().focus().toggleStrike().run()}
                    icon={Strikethrough}
                    tooltip="删除线 (Ctrl+Shift+X)"
                  />
                  <ToolbarButton
                    onClick={() => editor?.chain().focus().unsetAllMarks().run()}
                    icon={Eraser}
                    tooltip="清除格式"
                  />
                </div>
                
                <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().setParagraph().run()}
                    active={editor?.isActive('paragraph')}
                    icon={AlignLeft}
                    tooltip="正文"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor?.isActive('heading', { level: 1 })}
                    icon={Heading1}
                    tooltip="标题1"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor?.isActive('heading', { level: 2 })}
                    icon={Heading2}
                    tooltip="标题2"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor?.isActive('heading', { level: 3 })}
                    icon={Heading3}
                    tooltip="标题3"
                  />
                </div>
                
                <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    active={editor?.isActive('bulletList')}
                    icon={List}
                    tooltip="无序列表"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    active={editor?.isActive('orderedList')}
                    icon={ListOrdered}
                    tooltip="有序列表"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    active={editor?.isActive('blockquote')}
                    icon={Quote}
                    tooltip="引用"
                  />
                </div>
                
                <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    icon={TableIcon}
                    tooltip="插入表格"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                    active={editor?.isActive('codeBlock')}
                    icon={Code}
                    tooltip="代码块"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    icon={Minus}
                    tooltip="分隔线"
                  />
                </div>
                
                <div className="flex flex-wrap mb-1">
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().undo().run()}
                    disabled={!editor?.can().chain().focus().undo().run()}
                    icon={Undo}
                    tooltip="撤销 (Ctrl+Z)"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().redo().run()}
                    disabled={!editor?.can().chain().focus().redo().run()}
                    icon={Redo}
                    tooltip="重做 (Ctrl+Y)"
                  />
                </div>
              </div>
            )}
            
            {/* 可滚动的编辑器内容区域 */}
            <div 
              className="overflow-y-auto bg-white rounded-b-md"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              <div className="p-4">
                <EditorContent editor={editor} className="tiptap-content"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiptapEditor_lite;




// 使用示例：
// 使用示例
{/* <TiptapEditor_lite
  initialContent={yourContent}
  onChange={(content) => handleContentChange(content)}
  maxHeight={500}
  showToc={true}
  readOnly={false}
/> */}