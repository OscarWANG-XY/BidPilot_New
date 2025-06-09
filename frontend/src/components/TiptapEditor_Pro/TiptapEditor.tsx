import React, { useState } from 'react'
import { useEditor, EditorContent, JSONContent } from '@tiptap/react';
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
  initialContent?: JSONContent | string;
  onSave?: (content: JSONContent) => void;
  className?: string;
  showTOC?: boolean;
  readOnly?: boolean;
  storageKey?: string;
}

const defaultContent = {
  "type": "doc", 
  "content": [
    {
      "type": "heading", 
      "attrs": {"textAlign": "left", "level": 1}, 
      "content": [{"type": "text", "text": "开始编写..."}]
    }
  ]
};

const limit = 5000; // 增加字符限制，更适合个人写作

const MemorizedToC = React.memo(ToC);

const TiptapEditor: React.FC<TiptapEditorProps> = ({ 
  initialContent = defaultContent,
  onSave,
  className = '',
  showTOC = true,
  readOnly = false,
  storageKey = 'tiptap-editor-content',  // 为了确保key的唯一性, 需要外部传入, 否则会覆盖其他组件的缓存
}) => {

  // 目录状态管理
  const [items, setItems] = useState<ToCItemData[]>([]);
  const [isTocExpanded, setIsTocExpanded] = useState(true);

 // LocalStorage 管理: Get, Load 
  // 从 localStorage 获取内容的函数
  const getStoredContent = () => {
    if (readOnly) return initialContent; // 只读模式不使用缓存
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedContent = JSON.parse(stored);
        console.log('从缓存加载内容');
        return parsedContent;
      }
    } catch (error) {
      console.warn('localStorage 读取失败:', error);
    }
    return initialContent;
  };

  // 保存内容到 localStorage 的函数
  const saveToStorage = (content: JSONContent) => {
    if (readOnly) return; // 只读模式不保存缓存
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(content));
    } catch (error) {
      console.warn('localStorage 保存失败:', error);
    }
  };


  const editor = useEditor({
    extensions: [
      StarterKit,
      // 目录扩展 - 根据 showTOC 决定是否启用
      ...(showTOC ? [
        TableOfContents.configure({
          getIndex: getHierarchicalIndexes,
          onUpdate(content: ToCItemData[]) {
            setItems(content);
          },
        }),
      ] : []),
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
      // 图片扩展
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'w-full h-auto max-w-full',
          draggable: true,
        },
      }),
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
    ],
    content: getStoredContent(),
    editable: !readOnly,
    // 监听编辑器内容变化, 并自动保存到 localStorage;  这个和onSave不同,onSave时存储到服务器的. 
    onUpdate: ({ editor }) => {
      if (!readOnly) {
        const content = editor.getJSON();
        saveToStorage(content);
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto',
      },
    },
  });

  // 字数统计
  const percentage = editor
    ? Math.round((100 / limit) * editor.storage.characterCount.characters())
    : 0;

  // 保存功能
  const handleSave = () => {
    if (editor && onSave) {
      // 这里的content也是实用editor.getJSON()获取的, 和onUpdate内容时一样的
      const content = editor.getJSON();
      onSave(content);  // 调用父组件的onSave回调 
    }
  };

  // 快捷键保存 (Ctrl+S) - 只读模式下禁用
  React.useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, onSave, readOnly]);

  // 粘贴图片
  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const url = URL.createObjectURL(file);
          editor?.chain().focus().setImage({ src: url }).run();
          event.preventDefault();
        }
      }
    }
  };

  // 拖拽放置图片
  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          editor?.chain().focus().setImage({ src: base64 }).run();
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const toggleToc = () => {
    setIsTocExpanded(!isTocExpanded);
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">编辑器加载中...</div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      {/* 顶部操作栏 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 只读/编辑模式指示器 */}
            <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              {readOnly ? '只读模式' : '编辑模式'}
            </div>
          
          {/* 保存按钮 */}
          {!readOnly && onSave && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存 (Ctrl+S)
            </button>
          )}
        </div>
      </div>

      {/* 拖拽手柄 */}
      {!readOnly && (
        <DragHandle editor={editor}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
        </DragHandle>
      )}

      {/* 编辑器和目录的容器 */}
      <div className="editor-with-toc">
        {/* 编辑器主体部分 */}
        <div className="editor-main">
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
            {/* 工具栏 */}
            {!readOnly && <ToolBar editor={editor} />}
            
            {/* 编辑器内容区域 */}
            <div 
              onPaste={!readOnly ? handlePaste : undefined} 
              onDrop={!readOnly ? handleDrop : undefined} 
              onDragOver={!readOnly ? handleDragOver : undefined} 
              onDragEnter={!readOnly ? handleDragEnter : undefined} 
              className="min-h-[500px] p-6"
            >
              <EditorContent editor={editor} />
              
              {/* 气泡菜单 */}
              {!readOnly && <SimpleBubbleBar editor={editor} />}
            </div>

            {/* 底部状态栏 */}
            <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {readOnly ? '只读模式' : `最后修改: ${new Date().toLocaleString()}`}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <span className="text-sm text-gray-500">
                {editor.storage.characterCount.words()} 词  | {editor.storage.characterCount.characters()} / {limit} 字符
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 目录侧边栏 */}
        {showTOC && (
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
              className={`w-4 h-4 transition-transform duration-300 ${isTocExpanded ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          
          {/* 目录内容 */}
          <div className="editor-sidebar-content">
            <div className="text-sm font-medium text-gray-900 mb-3">目录</div>
            <div className="table-of-contents">
              <MemorizedToC editor={editor} items={items} />
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TiptapEditor;