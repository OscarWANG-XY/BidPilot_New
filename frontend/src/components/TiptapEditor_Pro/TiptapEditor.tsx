import React, { useState, useEffect } from 'react'
import { useEditor, EditorContent} from '@tiptap/react';
import { ToC, ToCItemData } from './ToC'
import { SimpleBubbleBar } from './BubbleBar'
import { ToolBar } from './ToolBar';
import StarterKit from '@tiptap/starter-kit';
// starterkit包含:
// nodes: Document, Blockquote, CodeBlock, HardBreak, Heading, HorizontalRule, ListItem, OrderedList, Paragraph, Text,
// Marks:  Bold, Code, Italic, Strike
// 扩展: Dropcursor, Gapcursor, History
import { getHierarchicalIndexes, TableOfContents } from '@tiptap-pro/extension-table-of-contents'
import TextAlign from '@tiptap/extension-text-align';
// import Heading from '@tiptap/extension-heading';  //覆盖starterkit中的配置
import DragHandle from '@tiptap-pro/extension-drag-handle-react';
// 需要额外添加 table 扩展
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
// 图
import Image from '@tiptap/extension-image'
// 字数统计
import CharacterCount from '@tiptap/extension-character-count'
// import Dropcursor from '@tiptap/extension-dropcursor'
// BubbleBar需要的扩展
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Link from '@tiptap/extension-link'

// 📝 1. 添加新的 Props 接口
interface TiptapEditorProps {
  initialContent?: any;
  onContentChange?: (content: any) => void;
  readOnly?: boolean;
  className?: string;
}

// 默认示例内容（当没有提供 initialContent 时使用）
// const sampleContent = {"type": "doc", "content": [{"type": "heading", "attrs": {"textAlign": "left", "level": 1}, "content": [{"type": "text", "text": "🚨 A级：投标决策必需信息"}]}, {"type": "table", "content": [{"type": "tableRow", "content": [{"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "序号"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "信息类别"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "具体内容"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "所在章节"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "分析进展"}]}]}]}, {"type": "tableRow", "content": [{"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "A1"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "⏰ 时间节点"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "投标截止时间/开标时间"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}]}, {"type": "tableRow", "content": [{"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "A2"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "💰 保证金"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "投标保证金金额/缴纳方式"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}]}]}, {"type": "horizontalRule"}]};
   const placeholder = "<p>等待服务器同步...</p>"


const limit = 280;


const MemorizedToC = React.memo(ToC)

// 📝 2. 修改组件定义，接受新的 props
const TiptapEditor: React.FC<TiptapEditorProps> = ({ 
  initialContent, 
  onContentChange, 
  readOnly = false,
  className = ""
}) => {

  const [items, setItems] = useState<ToCItemData[]>([])
  const [isTocExpanded, setIsTocExpanded] = useState(true)

  // 📝 3. 修改编辑器初始化，使用传入的内容
  const editor = useEditor({
    extensions: [
      StarterKit,
      //目录扩展
      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        onUpdate(content: ToCItemData[]) {
          setItems(content)
        },
      }),
      // 表格扩展
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      // 文本对齐扩展
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      // 标题扩展（覆盖 StarterKit 中的默认配置）
      // Heading.configure({
      //   levels: [1, 2, 3, 4, 5, 6],
      // }),
      // 图片扩展
      Image.configure({
        allowBase64: true, //Tiptap 会自动将图片编码为 base64 格式嵌入到文档中, 不适合服务器部署的方式
        HTMLAttributes: {
          class: 'w-full h-auto',
          draggable: true, //允许拖拽，否则无法拖拽图片
        },
      }),
      // Dropcursor,
      // 字数统计
      CharacterCount.configure({
        limit,
      }),
      // BubbleBar 需要的扩展
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      // 移除任何手动添加的 DragHandle 扩展
      
    ],
    // 📝 4. 使用传入的初始内容，如果没有则使用默认内容
    content: initialContent || placeholder,
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none',
      },
    },
    // 📝 5. 添加内容变化回调 (这个是useEditor的hook配置属性)
    onUpdate: ({ editor }) => {
      if (onContentChange && !readOnly) {
        const content = editor.getJSON();
        onContentChange(content);
      }
    },
    // 📝 6. 根据 readOnly 设置可编辑状态 (这个也是useEditor的hook配置属性)
    editable: !readOnly,
  });

  // 📝 7. 当 initialContent 变化时更新编辑器内容
  // 场景: 父组件,用户选择恢复草稿,或者从服务器加载了新版本,自动更新编辑显示. 
  // editor.getJSON() 确保只在内容真正不同时才更新. 
  useEffect(() => {
    if (editor && initialContent && editor.getJSON() !== initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  // 📝 8. 当 readOnly 状态变化时更新编辑器
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  // 字数统计
  const percentage = editor
  ? Math.round((100 / limit) * editor.storage.characterCount.characters())
  : 0

  // 📝 9. 修改图片处理函数，在只读模式下禁用
  const handlePaste = async (event: React.ClipboardEvent) => {
    if (readOnly) return; // 只读模式下不处理
    
    const items = event.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          const url = URL.createObjectURL(file)
          editor?.chain().focus().setImage({ src: url }).run()
          event.preventDefault()
        }
      }
    }
  }

  const handleDrop = async (event: React.DragEvent) => {
    if (readOnly) return; // 只读模式下不处理
    
    event.preventDefault()
    
    const files = Array.from(event.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result as string
          editor?.chain().focus().setImage({ src: base64 }).run()
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    if (readOnly) return;
    event.preventDefault()
  }

  const handleDragEnter = (event: React.DragEvent) => {
    if (readOnly) return;
    event.preventDefault()
  }

  // 📝 10. 修改切换编辑模式函数（现在由外部控制）
  const toggleEditable = () => {
    if (!readOnly) { // 只有在非强制只读模式下才允许切换
      editor?.setEditable(!editor.isEditable)
      editor?.view.dispatch(editor.view.state.tr)
    }
  }

  const toggleToc = () => {
    setIsTocExpanded(!isTocExpanded)
  }

  return (
    <div className={`mx-auto max-w-7xl p-6 ${className}`}>
      {/* 📝 11. 只读模式下隐藏或禁用某些控件 */}
      {!readOnly && (
        <div>
          <button onClick={toggleEditable}>Toggle editable</button>
        </div>
      )}
      
      <h1 className="mb-6 text-3xl font-semibold text-gray-900 dark:text-gray-50">
        Tiptap Editor {readOnly && "(只读模式)"}
      </h1>
      
      {/* 📝 12. 只读模式下不显示拖拽手柄 */}
      {editor && !readOnly && (
        <DragHandle editor={editor}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
        </DragHandle>
      )}

      <div className="editor-with-toc">
        <div className="editor-main">
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-800">
            {/* 📝 13. 只读模式下不显示工具栏 */}
            {editor && !readOnly && <ToolBar editor={editor} />}
            
            <div 
              onPaste={handlePaste} 
              onDrop={handleDrop} 
              onDragOver={handleDragOver} 
              onDragEnter={handleDragEnter} 
              className={`min-h-[400px] p-4 ${
                readOnly 
                  ? 'bg-gray-50 dark:bg-gray-900' 
                  : 'bg-white dark:bg-gray-950'
              }`}
            >
              <EditorContent editor={editor} />
              {/* 📝 14. 只读模式下不显示气泡菜单 */}
              {editor && !readOnly && <SimpleBubbleBar editor={editor} />}
            </div>

            {/* 字数统计区域 */}
            <div className="character-count">
              <svg height="20" width="20" viewBox="0 0 20 20">
                <circle r="10" cx="10" cy="10" fill="#e9ecef" />
                <circle
                  r="5"
                  cx="10"
                  cy="10"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={`calc(${percentage} * 31.4 / 100) 31.4`}
                  transform="rotate(-90) translate(-20)"
                />
                <circle r="6" cx="10" cy="10" fill="white" />
              </svg>
              <span>
                {editor?.storage.characterCount.characters()} / {limit} 字符
                <br />
                {editor?.storage.characterCount.words()} 词
              </span>
            </div>
          </div>
        </div>
        
        {/* 目录侧边栏 */}
        <div className={`editor-sidebar ${isTocExpanded ? 'expanded' : 'collapsed'}`}>
          {/* 切换按钮 */}
          <button 
            onClick={toggleToc}
            className="toc-toggle-btn"
            title={isTocExpanded ? '收起目录' : '展开目录'}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth="1.5" 
              stroke="currentColor"
              className={`transition-transform duration-300 ${isTocExpanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          
          {/* 目录内容 */}
          <div className="editor-sidebar-content">
            <div className="label-large">目录</div>
            <div className="table-of-contents">
              <MemorizedToC editor={editor} items={items} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiptapEditor;