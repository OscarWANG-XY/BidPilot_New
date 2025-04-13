// Import TextAlign
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
import TextAlign from '@tiptap/extension-text-align'; // Make sure this is imported
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {
  Bold,
  Italic,
  Strikethrough,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
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
  Image as ImageIcon,
  Link as LinkIcon,
  Highlighter,
  Underline as UnderlineIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ------------     自定义标题扩展ID属性 -> 以实现目录导航跳转。 ------------
const CustomHeading = Heading.extend({ //为标题元素添加自定义属性id
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



// ------------     工具栏按钮组件 的标准化定义 （框架和样式） ------------
// 图标类型定义
type IconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// 增强的工具栏按钮，带有图标和工具提示
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



// ------------     目录导航 ------------
// 目录项接口定义
interface TocItem {
  id: string;
  level: number;
  text: string;
}

// 生成安全的slug ID函数（用于创建标题的唯一标识符）
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')           // 将空格替换为连字符
    .replace(/[^\w\-]+/g, '')       // 移除非字母数字字符
    .replace(/\-\-+/g, '-')         // 将多个连字符替换为单个连字符
    .replace(/^-+/, '')             // 移除开头的连字符
    .replace(/-+$/, '');            // 移除结尾的连字符
};



// ------------     组件接口定义 + 组件实现 ------------
type TiptapEditorProps = {
  initialContent?: string;          // 初始内容
  onChange?: (content: any) => void;  // 内容变化回调
  maxHeight?: number | string;               // 编辑器最大高度
  minHeight?: number | string;               // 编辑器最小高度
  maxWidth?: number | string;       // 编辑器最大宽度
  minWidth?: number | string;       // 编辑器最小宽度
  showToc?: boolean;                // 是否显示目录
  readOnly?: boolean;               // 是否只读模式
};

const TiptapEditor: React.FC<TiptapEditorProps> = ({ 
  initialContent = '',
  onChange,
  maxHeight = 300,
  minHeight = 200,       // 默认最小高度
  maxWidth = '100%',     // 默认最大宽度
  minWidth = '300px',    // 默认最小宽度
  showToc = true,
  readOnly = false
}) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);  // 目录项状态
  const [tocVisible, setTocVisible] = useState(true);       // 目录可见性状态
  
  // 生成目录 - 为标题添加ID并收集目录项
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
        
        // 为标题生成唯一且可读的ID
        // 如果已有ID则使用现有ID，否则基于文本生成新ID
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

  // 使用内容和自定义扩展初始化编辑器
  const editor = useEditor({
    extensions: [
      // 使用自定义Heading扩展代替StarterKit中的默认扩展
      StarterKit.configure({
        heading: false, // 禁用默认Heading
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      // 添加自定义Heading扩展
      CustomHeading.configure({
        levels: [1, 2, 3],
      }),
      // 添加TextAlign扩展，配置与editor-config.js中相同
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableHeader,
      TableRow,
      TableCell,
      TextStyle,
      Color,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      Underline,
      Subscript,
      Superscript,
    ],
    content: initialContent ? (() => {
      try {
        // console.log('Content type:', typeof initialContent);
        // console.log('Content preview:', typeof initialContent === 'string' 
        //   ? initialContent.substring(0, 100) + '...' 
        //   : 'Object provided');
        
        // 处理不同格式的initialContent
        if (typeof initialContent === 'object') {
          return initialContent;
        } else if (typeof initialContent === 'string') {
          // 检查是否为Python风格的字典字符串
          if (initialContent.startsWith("{'") || initialContent.startsWith("{\"")) {
            // 将Python风格的引号转换为JSON兼容的引号
            const jsonString = initialContent
              .replace(/'/g, '"')
              .replace(/None/g, 'null')
              .replace(/True/g, 'true')
              .replace(/False/g, 'false');
            
            // console.log('Converted to JSON string:', jsonString);
            return jsonString;
          } else {
            // 常规JSON字符串
            return initialContent;
          }
        }
        return '';
      } catch (error) {
        console.error('Failed to parse Tiptap content:', error);
        return ''; // 提供默认值
      }
    })() : '',
    editable: !readOnly,  // 根据readOnly属性设置是否可编辑
    onUpdate: ({ editor }) => {
      // 当编辑器内容更新时，重新生成目录
      generateToc(editor);
      
      // 如果提供了onChange回调，传递编辑器内容
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  // 初始目录生成
  useEffect(() => {
    if (editor) {
      generateToc(editor);
    }
  }, [editor, generateToc]);


  // 当readOnly属性变化时更新编辑器可编辑状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // 当initialContent变化时更新编辑器内容
  useEffect(() => {
    if (editor && initialContent) {
      try {
        console.log('Updating content, type:', typeof initialContent);
        
        // 处理不同格式的内容
        let parsedContent;
        if (typeof initialContent === 'object') {
          parsedContent = initialContent;
        } else if (typeof initialContent === 'string') {
          // 检查是否为Python风格的字典字符串
          if (initialContent.startsWith("{'") || initialContent.startsWith("{\"")) {
            // 将Python风格的引号转换为JSON兼容的引号
            const jsonString = initialContent
              .replace(/'/g, '"')
              .replace(/None/g, 'null')
              .replace(/True/g, 'true')
              .replace(/False/g, 'false');
            
            // console.log('Converted to JSON string:', jsonString);
            parsedContent = jsonString;
          } else {
            // 常规JSON字符串
            parsedContent = initialContent;
          }
        }
        
        console.log('Parsed content:', parsedContent);
        editor.commands.setContent(parsedContent || '');
        
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
    
    // 获取编辑器容器元素 - 修改为获取可滚动容器
    const scrollContainer = document.querySelector('.tiptap-content')?.closest('.overflow-y-auto');
    if (!scrollContainer) return;
    
    // 查找标题DOM元素
    const headingElement = document.getElementById(id);
    
    if (headingElement) {
      // 计算滚动位置，而不是使用scrollIntoView
      const containerRect = scrollContainer.getBoundingClientRect();
      const headingRect = headingElement.getBoundingClientRect();
      const relativePosition = headingRect.top - containerRect.top;
      
      // 滚动到标题元素位置，但只滚动编辑器内容区域
      scrollContainer.scrollTop = scrollContainer.scrollTop + relativePosition - containerRect.height / 2 + headingRect.height / 2;
      
      // 如果不是只读模式，聚焦标题
      if (!readOnly) {
        setTimeout(() => {
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

  return (
    <div 
      className="border border-gray-200 rounded-lg bg-white shadow-sm"
      style={{ 
        maxWidth: maxWidth, 
        minWidth: minWidth 
      }}
    >
      <div className="mb-5">
        {/* 顶部目录工具栏 */}
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
          
          {/* 内容编辑区域容器 */}
          <div className={`relative border border-gray-200 rounded-md flex-1 ${showToc && tocVisible ? 'w-3/4' : 'w-full'}`}>
          
            {/* 顶部固定工具栏 - 仅在非只读模式下显示 */}
            {!readOnly && (
              <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 rounded-t-md p-2 flex flex-wrap">
                {/* 文本格式工具组 */}
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
                
                {/* 标题样式工具组 */}
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
                
                {/* 文本对齐工具组 */}
                <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                    active={editor?.isActive({ textAlign: 'left' })}
                    icon={AlignLeft}
                    tooltip="左对齐"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                    active={editor?.isActive({ textAlign: 'center' })}
                    icon={AlignCenter}
                    tooltip="居中对齐"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                    active={editor?.isActive({ textAlign: 'right' })}
                    icon={AlignRight}
                    tooltip="右对齐"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                    active={editor?.isActive({ textAlign: 'justify' })}
                    icon={AlignJustify}
                    tooltip="两端对齐"
                  />
                </div>
                
                {/* 列表和引用工具组 */}
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
                
                {/* 文本装饰工具组 */}
                <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    active={editor?.isActive('underline')}
                    icon={UnderlineIcon}
                    tooltip="下划线"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleHighlight().run()}
                    active={editor?.isActive('highlight')}
                    icon={Highlighter}
                    tooltip="高亮"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleSubscript().run()}
                    active={editor?.isActive('subscript')}
                    icon={SubscriptIcon}
                    tooltip="下标"
                  />
                  <ToolbarButton 
                    onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                    active={editor?.isActive('superscript')}
                    icon={SuperscriptIcon}
                    tooltip="上标"
                  />
                </div>
                
                {/* 插入元素工具组 */}
                <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
                  <ToolbarButton 
                    onClick={() => {
                      const url = window.prompt('输入图片URL');
                      if (url) {
                        editor?.chain().focus().setImage({ src: url }).run();
                      }
                    }}
                    icon={ImageIcon}
                    tooltip="插入图片"
                  />
                  <ToolbarButton 
                    onClick={() => {
                      const url = window.prompt('输入链接URL');
                      if (url) {
                        editor?.chain().focus().setLink({ href: url }).run();
                      }
                    }}
                    active={editor?.isActive('link')}
                    icon={LinkIcon}
                    tooltip="插入链接"
                  />
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
                
                {/* 撤销/重做工具组 */}
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
              style={{ 
                maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
                minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight
              }}
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

export default TiptapEditor;

// 使用示例:
// <TiptapEditor_lite
//   initialContent={yourContent}
//   onChange={(content) => handleContentChange(content)}
//   maxHeight={500}
//   showToc={true}
//   readOnly={false}
// />