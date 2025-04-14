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
  

  // 提取解析内容的函数
  const parseContent = useCallback((content: any) => {
    try {
      if (typeof content === 'object') {
        return content;
      } else if (typeof content === 'string') {
        // 检查是否为Python风格的字典字符串
        if (content.startsWith("{'") || content.startsWith("{\"")) {
          // Python风格转JSON兼容风格
          return content
            .replace(/'/g, '"')
            .replace(/None/g, 'null')   // 将None转换为null 
            .replace(/True/g, 'true')  // 将True转换为true
            .replace(/False/g, 'false'); // 将False转换为false
        } else {
          // 常规JSON字符串
          return content;
        }
      }
      return '';
    } catch (error) {
      console.error('Tiptap内容解析失败:', error);
      return ''; // 错误时，返回空内容，避免编辑器崩溃
    }
  }, []);

  // ----------- 生成目录 - 为标题添加ID并收集目录项 ------------
  // - 添加标题，通过descendants递归遍历标题节点， 标记transaction事务，然后dispatch提交事务到视图进行添加
  // - 收集目录项， 将每个标题的信息存入headings数组， 并更新给目录项状态 tocItems 
  const generateToc = useCallback((editor: any) => {

    // 如果编辑器为空，则返回
    if (!editor) return;
    
    // 初始化目录项
    const headings: TocItem[] = []; // 存储目录项的数组
    const transaction = editor.state.tr; // 创建一个事务(transaction)用于批量修改编辑器状态, tr就是transaction的缩写, 用于记录一组原子性操作
    let hasChanges = false; // 标记是否有修改发生
    

    // 查找文档中的所有标题 （使用descendants方法递归遍历文档中的所有节点，并只处理heading节点）
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
        // 如果已有ID则使用现有ID，否则基于文本生成新ID
        let headingId = node.attrs.id;
        if (!headingId) {
          // 基于文本内容生成ID
          const baseId = generateSlug(displayText);
          // 添加位置后缀以确保同名ID的唯一性
          headingId = `${baseId}-${pos}`;
          
          // 将ID存储在标题节点属性中（仅记录，未生效）
          transaction.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            id: headingId,
          });
          
          hasChanges = true; // 标记有修改发生
        }
        
        // 添加到目录项(将每个标题的信息存入headings数组)
        // Push是JavaScript的数组方法，用于将一个或多个元素添加到数组的末尾
        headings.push({
          id: headingId,
          level: node.attrs.level,
          text: displayText
        });
      }
    });
    
    // 应用事务（提交事务，实际应用修改到 DOM和状态）
    if (hasChanges && transaction.steps.length > 0) {
      editor.view.dispatch(transaction);  // dispatch是ProseMirror的核心方法，用于提交事务到视图。。 
    }
    
    // 更新目录项,将收集到的目录项存入状态
    setTocItems(headings);
  }, []);

  // ------------ 自定义扩展和初始化编辑器 ------------
  // 注意： 以下的配置需要和微服务使用的tiptap_editor.js中的配置一致，这样数据才能互通 
  const editor = useEditor({
    extensions: [
      // 使用自定义Heading扩展代替StarterKit中的默认扩展
      StarterKit.configure({
        heading: false, // 禁用默认Heading, 给了自定义标题
        bulletList: { keepMarks: true, keepAttributes: false, },  //列表项保留文本样式
        orderedList: {keepMarks: true, keepAttributes: false, },
      }),
      // 改用自定义的CustomHeading
      CustomHeading.configure({ levels: [1, 2, 3],}),

      // 添加TextAlign扩展，配置与editor-config.js中相同
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Table.configure({
        resizable: true,   // 表格可调整大小
        HTMLAttributes: { class: 'tiptap-table', },
      }),
      TableHeader, TableRow, TableCell,
      TextStyle, Color,
      Image.configure({
        inline: false,
        allowBase64: true,   //支持base64编码的图片
      }),
      Link.configure({
        openOnClick: false,  // 点击链接不自动打开
        HTMLAttributes: { class: 'tiptap-link', },
      }),
      Highlight.configure({
        multicolor: true,  //支持多色高亮
      }),
      Typography, Underline, Subscript, Superscript,
    ],
    content: initialContent ? parseContent(initialContent) : '',
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

  // 1. 初始化生成目录
  // 以editor作为依赖项，只有editor的销毁和重建会变化，编辑内容只会修改编辑器内部的state, 而editor对象不变。 
  const initializeToc = useCallback(() => {
    if (editor) {
      generateToc(editor);
      
      // 添加编辑器更新事件监听，实时更新目录, 初始化开启监听，一旦有更新事件就更新目录
      editor.on('update', () => generateToc(editor));
      
      // 返回清理函数，组件卸载时移除事件监听
      return () => {
        editor.off('update');
      };
    }
  }, [editor, generateToc]);

  // 2. 用于更新编辑器可编辑状态的回调函数
  const updateEditorEditable = useCallback(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // 3. 用于更新编辑器内容的回调函数
  const updateEditorContent = useCallback(() => {
    if (editor && initialContent) {
      try {        
        // 解析函数处理内容
        const parsedContent = parseContent(initialContent);
        
        editor.commands.setContent(parsedContent || '');
        
        // 替换setTimeout为editor.on方式， 
        // 不在这里调用generateToc，而是通过editor的update事件监听

      } catch (error) {
        console.error('Failed to parse Tiptap content:', error);
      }
    }
  }, [editor, initialContent, parseContent]);

  // 初始化生成目录并设置更新监听
  useEffect(() => {
    return initializeToc();
  }, [initializeToc]);

  // 当readOnly属性变化时更新编辑器可编辑状态
  useEffect(() => {
    updateEditorEditable();
  }, [updateEditorEditable]);

  // 当initialContent变化时更新编辑器内容
  useEffect(() => {
    updateEditorContent();
  }, [updateEditorContent]);


  // ----------- 滚动到指定标题位置 ------------
  // 1）找到标题元素
  // 2）计算滚动位置，使其在视图居中位置显示
  // 3）滚动到标题元素位置，但只滚动编辑器内容区域
  // 4）如果不是只读模式，聚焦标题
  // 以下的函数虽然是只依赖editor,和readOnly, 在在渲染部分，我们通过onClick每次触发它的执行 （与依赖项无关）
  const scrollToHeading = useCallback((id: string) => {
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
  }, [editor, readOnly]);



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
        <div className="flex gap-4" style={{
            minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight 
        }}>
          {/* 目录导航区域 */}
          {showToc && tocVisible && tocItems.length > 0 && (
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
          
          {/* 内容编辑区域容器 - 也使用flex-col布局 */}
          <div className={`relative border border-gray-200 rounded-md flex-1 flex flex-col ${showToc && tocVisible ? 'w-3/4' : 'w-full'}`}>
          
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
            
            {/* 可滚动的编辑器内容区域 - 使用flex-grow填充剩余空间 */}
            <div 
              className="overflow-y-auto bg-white rounded-b-md flex-grow"
              // style={{ 
              //   maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
              //   minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight
              // }}
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