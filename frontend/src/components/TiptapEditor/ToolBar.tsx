import React from 'react';
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

// ------------     工具栏按钮组件 的标准化定义 （框架和样式） ------------
// 图标类型定义
type IconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// // 增强的工具栏按钮，带有图标和工具提示
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

interface ToolBarProps {
  editor: any;
}

const ToolBar: React.FC<ToolBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 rounded-t-md p-2 flex flex-wrap">
      {/* Text formatting tools */}
      <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          icon={Bold}
          tooltip="粗体 (Ctrl+B)"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          icon={Italic}
          tooltip="斜体 (Ctrl+I)"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          icon={Strikethrough}
          tooltip="删除线 (Ctrl+Shift+X)"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          icon={Eraser}
          tooltip="清除格式"
        />
      </div>
      
      {/* Heading style tools */}
      <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
        <ToolbarButton 
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          icon={AlignLeft}
          tooltip="正文"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          tooltip="标题1"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          tooltip="标题2"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          tooltip="标题3"
        />
      </div>
      
      {/* Text alignment tools */}
      <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          icon={AlignLeft}
          tooltip="左对齐"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          icon={AlignCenter}
          tooltip="居中对齐"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          icon={AlignRight}
          tooltip="右对齐"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          icon={AlignJustify}
          tooltip="两端对齐"
        />
      </div>
      
      {/* List and quote tools */}
      <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          icon={List}
          tooltip="无序列表"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          icon={ListOrdered}
          tooltip="有序列表"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          icon={Quote}
          tooltip="引用"
        />
      </div>
      
      {/* Text decoration tools */}
      <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          icon={UnderlineIcon}
          tooltip="下划线"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          icon={Highlighter}
          tooltip="高亮"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive('subscript')}
          icon={SubscriptIcon}
          tooltip="下标"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive('superscript')}
          icon={SuperscriptIcon}
          tooltip="上标"
        />
      </div>
      
      {/* Insert element tools */}
      <div className="flex flex-wrap mb-1 mr-3 border-r border-gray-300 pr-2">
        <ToolbarButton 
          onClick={() => {
            const url = window.prompt('输入图片URL');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          icon={ImageIcon}
          tooltip="插入图片"
        />
        <ToolbarButton 
          onClick={() => {
            const url = window.prompt('输入链接URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor.isActive('link')}
          icon={LinkIcon}
          tooltip="插入链接"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          icon={TableIcon}
          tooltip="插入表格"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          icon={Code}
          tooltip="代码块"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          tooltip="分隔线"
        />
      </div>
      
      {/* Undo/redo tools */}
      <div className="flex flex-wrap mb-1">
        <ToolbarButton 
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          icon={Undo}
          tooltip="撤销 (Ctrl+Z)"
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          icon={Redo}
          tooltip="重做 (Ctrl+Y)"
        />
      </div>
    </div>
  );
};

export { ToolBar, ToolbarButton };
export type { IconComponent };
