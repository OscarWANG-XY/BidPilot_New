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
      // Add ID attribute
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

  // Ensure ID attribute is included during rendering
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
// Icon type definition
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



// ------------     目录导航 ------------
// TOC item interface
interface TocItem {
  id: string;
  level: number;
  text: string;
}

// Function to generate safe slug IDs  -> 用于生成安全的slug ID （嵌条码）
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')       // Remove non-alphanumeric characters
    .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')             // Remove leading hyphens
    .replace(/-+$/, '');            // Remove trailing hyphens
};



// ------------     组件接口定义 + 组件实现 ------------
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
  
  // Generate TOC - add IDs to headings and collect TOC items
  const generateToc = useCallback((editor: any) => {
    if (!editor) return;
    
    const headings: TocItem[] = [];
    const transaction = editor.state.tr;
    let hasChanges = false;
    
    // Find all headings in the document
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        // Get heading text
        let text = '';
        node.descendants((textNode: any) => {
          if (textNode.text) {
            text += textNode.text;
          }
        });
        
        const displayText = text || '无标题';
        
        // Generate a unique and readable ID for the heading
        // Use existing ID if available, otherwise generate a new one based on text
        let headingId = node.attrs.id;
        
        if (!headingId) {
          // Generate ID based on text content
          const baseId = generateSlug(displayText);
          
          // Add position suffix to ensure uniqueness for same-name IDs
          headingId = `${baseId}-${pos}`;
          
          // Store ID in heading node attributes
          transaction.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id: headingId,
          });
          
          hasChanges = true;
        }
        
        // Add to TOC items
        headings.push({
          id: headingId,
          level: node.attrs.level,
          text: displayText
        });
      }
    });
    
    // Apply transaction to update editor content
    if (hasChanges && transaction.steps.length > 0) {
      editor.view.dispatch(transaction);
    }
    
    setTocItems(headings);
  }, []);

  // Initialize editor with content and custom extensions
  const editor = useEditor({
    extensions: [
      // Use custom Heading extension instead of the one in StarterKit
      StarterKit.configure({
        heading: false, // Disable default Heading
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      // Add custom Heading extension
      CustomHeading.configure({
        levels: [1, 2, 3],
      }),
      // Add TextAlign extension with the same configuration as in editor-config.js
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
        console.log('Content type:', typeof initialContent);
        console.log('Content preview:', typeof initialContent === 'string' 
          ? initialContent.substring(0, 100) + '...' 
          : 'Object provided');
        
        // Handle different formats of initialContent
        if (typeof initialContent === 'object') {
          return initialContent;
        } else if (typeof initialContent === 'string') {
          // Check if it's a Python-style dictionary string
          if (initialContent.startsWith("{'") || initialContent.startsWith("{\"")) {
            // Convert Python-style quotes to JSON-compatible quotes
            const jsonString = initialContent
              .replace(/'/g, '"')
              .replace(/None/g, 'null')
              .replace(/True/g, 'true')
              .replace(/False/g, 'false');
            
            console.log('Converted to JSON string:', jsonString);
            return JSON.parse(jsonString);
          } else {
            // Regular JSON string
            return JSON.parse(initialContent);
          }
        }
        return '';
      } catch (error) {
        console.error('Failed to parse Tiptap content:', error);
        return ''; // Provide a default value
      }
    })() : '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // When editor content is updated, regenerate TOC
      generateToc(editor);
      
      // If onChange callback is provided, pass editor content
      if (onChange) {
        onChange(JSON.stringify(editor.getJSON()));
      }
    },
  });

  // Initial TOC generation
  useEffect(() => {
    if (editor) {
      generateToc(editor);
    }
  }, [editor, generateToc]);

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editor && initialContent) {
      try {
        console.log('Updating content, type:', typeof initialContent);
        
        // Handle different formats of content
        let parsedContent;
        if (typeof initialContent === 'object') {
          parsedContent = initialContent;
        } else if (typeof initialContent === 'string') {
          // Check if it's a Python-style dictionary string
          if (initialContent.startsWith("{'") || initialContent.startsWith("{\"")) {
            // Convert Python-style quotes to JSON-compatible quotes
            const jsonString = initialContent
              .replace(/'/g, '"')
              .replace(/None/g, 'null')
              .replace(/True/g, 'true')
              .replace(/False/g, 'false');
            
            console.log('Converted to JSON string:', jsonString);
            parsedContent = JSON.parse(jsonString);
          } else {
            // Regular JSON string
            parsedContent = JSON.parse(initialContent);
          }
        }
        
        console.log('Parsed content:', parsedContent);
        editor.commands.setContent(parsedContent || '');
        
        // Regenerate TOC after content is loaded
        setTimeout(() => {
          generateToc(editor);
        }, 100);
      } catch (error) {
        console.error('Failed to parse Tiptap content:', error);
      }
    }
  }, [initialContent, editor, generateToc]);

  // Scroll to specified heading position
  const scrollToHeading = (id: string) => {
    if (!editor) return;
    
    // Get editor container element - modified to get scrollable container
    const scrollContainer = document.querySelector('.tiptap-content')?.closest('.overflow-y-auto');
    if (!scrollContainer) return;
    
    // Find heading DOM element
    const headingElement = document.getElementById(id);
    
    if (headingElement) {
      // Calculate scroll position instead of using scrollIntoView
      const containerRect = scrollContainer.getBoundingClientRect();
      const headingRect = headingElement.getBoundingClientRect();
      const relativePosition = headingRect.top - containerRect.top;
      
      // Scroll to heading element position, but only scroll editor content area
      scrollContainer.scrollTop = scrollContainer.scrollTop + relativePosition - containerRect.height / 2 + headingRect.height / 2;
      
      // If not in read-only mode, focus the heading
      if (!readOnly) {
        setTimeout(() => {
          // Get DOM position
          const view = editor.view;
          const domPos = view.posAtDOM(headingElement, 0);
          
          if (domPos > -1) {
            // Set selection to the heading
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
        
        {/* Layout container for TOC and editor */}
        <div className="flex gap-4">
          {/* TOC navigation area */}
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
          
          {/* Content editing area container */}
          <div className={`relative border border-gray-200 rounded-md flex-1 ${showToc && tocVisible ? 'w-3/4' : 'w-full'}`}>
            {/* Fixed toolbar at the top - only shown in non-read-only mode */}
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
                
                {/* Add text alignment buttons */}
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
            
            {/* Scrollable editor content area */}
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




// Usage example:
// <TiptapEditor_lite
//   initialContent={yourContent}
//   onChange={(content) => handleContentChange(content)}
//   maxHeight={500}
//   showToc={true}
//   readOnly={false}
// />