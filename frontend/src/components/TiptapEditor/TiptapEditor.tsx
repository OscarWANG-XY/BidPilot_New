// Import TextAlign
import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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

// Add Lucide React import
import { ChevronRight } from 'lucide-react';

// Import the ToolBar component
import { ToolBar } from './ToolBar';

// Import the TableOfContents component
import TableOfContents, { TocItem, CustomHeading, generateToc } from './TableOfContents';

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

  // 使用从TableOfContents导入的generateToc函数
  const handleGenerateToc = useCallback((editor: any) => {
    generateToc(editor, setTocItems);
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
      handleGenerateToc(editor);
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
      handleGenerateToc(editor);
    }
  }, [editor, handleGenerateToc]);

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

  return (
    <div 
      className="border border-gray-200 rounded-lg bg-white shadow-sm"
      style={{ 
        maxWidth: maxWidth, 
        minWidth: minWidth 
      }}
    >
      {/* Main container with flex layout for side-by-side arrangement */}
      <div className="flex gap-4" style={{
          minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight 
      }}>
        {/* Table of Contents - Left side */}
        {showToc && tocVisible && tocItems.length > 0 && (
          <div className="w-1/4 border-r border-gray-200 p-2">
            <TableOfContents 
              tocItems={tocItems}
              tocVisible={tocVisible}
              setTocVisible={setTocVisible}
              editor={editor}
              readOnly={readOnly}
            />
          </div>
        )}
        
        {/* Editor Content - Right side */}
        <div className={`relative border border-gray-200 rounded-md flex-1 flex flex-col ${showToc && tocVisible && tocItems.length > 0 ? 'w-3/4' : 'w-full'}`}>
          {/* Toolbar - only shown in editable mode */}
          {!readOnly && <ToolBar editor={editor} />}
          
          {/* TOC toggle button - shown when TOC is hidden */}
          {showToc && (!tocVisible || tocItems.length === 0) && (
            <button 
              className="absolute -left-5 top-1/2 transform -translate-y-1/2 z-10 p-1 bg-gray-100 hover:bg-gray-200 rounded-r text-sm"
              onClick={() => setTocVisible(true)}
              title="Show table of contents"
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            >
              <ChevronRight size={16} />
            </button>
          )}
          
          {/* Scrollable editor content area */}
          <div className="overflow-y-auto bg-white rounded-b-md flex-grow">
            <div className="p-4">
              <EditorContent editor={editor} className="tiptap-content"/>
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