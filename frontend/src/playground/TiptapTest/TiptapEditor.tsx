
// UI实现效果： 工具图标按钮，工具提示（tooltip）,固定工具栏，滚动内容区域， 暂无针对移动端的响应式设计
// 工具栏按钮： 粗体，斜体，删除线，正文，标题1，标题2，标题3，无序列表，有序列表，引用，插入表格，代码块，分隔线，撤销，重做
// 视觉： 紧凑，清晰，分组布局，


// src/components/TiptapEditor.tsx
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { useTipTaps } from './useTiptap';
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
  LucideProps
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


// Icon类型定义
type IconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// Basic toolbar button style
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
  children?: React.ReactNode 
  icon: IconComponent;
  tooltip: string;
}) =>  {
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

type TiptapEditorProps = {
  id?: number; // Optional ID for editing an existing testground
  name?: string;
  description?: string;
  initialContent?: string;
  onSave?: (id: number) => void;
  maxHeight?: number;
};

const TiptapEditor: React.FC<TiptapEditorProps> = ({ 
  id, 
  name: initialName = '', 
  description: initialDescription = '', 
  initialContent = '', 
  onSave,
  maxHeight = 400 //默认最大高度为400px
}) => {
  // State for the form
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);
  const { useTipTapDetail, useTipTapCreate, useTipTapUpdate, useTipTapPartialUpdate } = useTipTaps();

  // Setup React Query hooks
  const { data: existingTestground, isLoading: isLoadingTestground } = useTipTapDetail(id || 0);
  const createMutation = useTipTapCreate();
  const updateMutation = useTipTapUpdate();
  const partialUpdateMutation = useTipTapPartialUpdate();

  // Initialize editor with content
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
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
    content: initialContent ? JSON.parse(initialContent) : '',
  });


  // Update form when existing data loads
  useEffect(() => {
    if (existingTestground) {
      setName(existingTestground.name);
      setDescription(existingTestground.description);
      
      if (editor && existingTestground.tiptap_content) {
        try {
          const content = JSON.parse(existingTestground.tiptap_content);
          editor.commands.setContent(content);
        } catch (error) {
          console.error('Failed to parse Tiptap content:', error);
        }
      }
    }
  }, [existingTestground, editor]);

  // Handle form submission
  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    
    try {
      const tiptapContent = JSON.stringify(editor.getJSON());
      
      if (id) {
        // Update existing testground
        await updateMutation.mutateAsync({
          id,
          data: {
            name,
            description,
            tiptap_content: tiptapContent
          }
        });
      } else {
        // Create new testground
        const result = await createMutation.mutateAsync({
          name,
          description,
          tiptap_content: tiptapContent
        });
        
        if (onSave && result.id) {
          onSave(result.id);
        }
      }
    } catch (error) {
      console.error('Failed to save testground:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save only the Tiptap content (useful for auto-save)
  const saveContentOnly = async () => {
    if (!editor || !id) return;
    
    try {
      const tiptapContent = JSON.stringify(editor.getJSON());
      
      await partialUpdateMutation.mutateAsync({
        id,
        data: {
          tiptap_content: tiptapContent
        }
      });
    } catch (error) {
      console.error('Failed to auto-save content:', error);
    }
  };

  if (isLoadingTestground && id) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-lg max-w-4xl mx-auto bg-white shadow-sm">
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">名称</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
      </div>

      <div className="mb-5">
        <label className="block mb-2 font-medium text-gray-700">描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          rows={3}
        />
      </div>

      <div className="mb-5">
        <label className="block mb-2 font-medium text-gray-700">内容</label>
        {/* 内容编辑区容器 - 使用相对定位 */}
        <div className="relative border border-gray-200 rounded-md">
          {/* Editor Toolbar - Grouped by functionality */}
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

      <div className="mt-4 flex justify-between">
        {id && (
          <button
            onClick={saveContentOnly}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
            disabled={partialUpdateMutation.isPending}
          >
            {partialUpdateMutation.isPending ? '保存中...' : '仅保存内容'}
          </button>
        )}
        
        <button
          onClick={handleSave}
          className={`px-5 py-2.5 ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition ml-auto shadow-sm`}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : id ? '保存修改' : '创建新记录'}
        </button>
      </div>
    </div>
  );
};

export default TiptapEditor;