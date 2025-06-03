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
import { BubbleMenu } from '@tiptap/react';

// ------------     工具栏按钮组件 的标准化定义 （框架和样式） ------------
// 图标类型定义
type IconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

// 增强的工具栏按钮，带有图标和工具提示 - 针对 BubbleBar 优化
const BubbleButton = ({ 
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
            className={`p-1.5 rounded text-sm font-medium transition-all duration-200 flex items-center justify-center border
              ${active 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`
            }
            aria-label={tooltip}
          >
            <Icon size={16} />
            {children && <span className="ml-1 text-xs">{children}</span>}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// 分隔符组件
const BubbleSeparator = () => (
  <div className="w-px h-6 bg-gray-200 mx-1" />
);

interface BubbleBarProps {
  editor: any;
  tippyOptions?: any;
}

const BubbleBar: React.FC<BubbleBarProps> = ({ 
  editor, 
  tippyOptions = { duration: 100, placement: 'top' } 
}) => {
  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={tippyOptions}
      className="bubble-menu-container"
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex items-center gap-0.5 backdrop-blur-sm bg-white/95">
        {/* 基础文本格式化工具 */}
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          icon={Bold}
          tooltip="粗体 (Ctrl+B)"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          icon={Italic}
          tooltip="斜体 (Ctrl+I)"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          icon={Strikethrough}
          tooltip="删除线"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          icon={UnderlineIcon}
          tooltip="下划线"
        />
        
        <BubbleSeparator />
        
        {/* 标题工具 */}
        <BubbleButton 
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive('paragraph')}
          icon={AlignLeft}
          tooltip="正文"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          tooltip="标题1"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          tooltip="标题2"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          tooltip="标题3"
        />
        
        <BubbleSeparator />
        
        {/* 文本装饰工具 */}
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          icon={Highlighter}
          tooltip="高亮"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive('subscript')}
          icon={SubscriptIcon}
          tooltip="下标"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive('superscript')}
          icon={SuperscriptIcon}
          tooltip="上标"
        />
        
        <BubbleSeparator />
        
        {/* 对齐工具 */}
        <BubbleButton 
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          icon={AlignLeft}
          tooltip="左对齐"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          icon={AlignCenter}
          tooltip="居中"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          icon={AlignRight}
          tooltip="右对齐"
        />
        
        <BubbleSeparator />
        
        {/* 列表和引用工具 */}
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          icon={List}
          tooltip="无序列表"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          icon={ListOrdered}
          tooltip="有序列表"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          icon={Quote}
          tooltip="引用"
        />
        
        <BubbleSeparator />
        
        {/* 插入工具 */}
        <BubbleButton 
          onClick={() => {
            const url = window.prompt('输入图片URL');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          icon={ImageIcon}
          tooltip="插入图片"
        />
        <BubbleButton 
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
        <BubbleButton 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          icon={TableIcon}
          tooltip="插入表格"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          icon={Code}
          tooltip="代码块"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          tooltip="分隔线"
        />
        
        <BubbleSeparator />
        
        {/* 撤销/重做工具 */}
        <BubbleButton 
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          icon={Undo}
          tooltip="撤销 (Ctrl+Z)"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          icon={Redo}
          tooltip="重做 (Ctrl+Y)"
        />
        
        <BubbleSeparator />
        
        {/* 清除格式 */}
        <BubbleButton
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          icon={Eraser}
          tooltip="清除格式"
        />
      </div>
    </BubbleMenu>
  );
};

// 简化版 BubbleBar - 只包含最常用的功能
const SimpleBubbleBar: React.FC<BubbleBarProps> = ({ 
  editor, 
  tippyOptions = { duration: 100, placement: 'top' } 
}) => {
  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu 
      editor={editor} 
      tippyOptions={tippyOptions}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex items-center gap-0.5 backdrop-blur-sm bg-white/95">
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          icon={Bold}
          tooltip="粗体"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          icon={Italic}
          tooltip="斜体"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          icon={Strikethrough}
          tooltip="删除线"
        />
        
        <BubbleSeparator />
        
        <BubbleButton 
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          icon={Highlighter}
          tooltip="高亮"
        />
        <BubbleButton 
          onClick={() => {
            const url = window.prompt('输入图片URL');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          icon={ImageIcon}
          tooltip="插入图片"
        />
        <BubbleButton 
          onClick={() => {
            const url = window.prompt('输入链接URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor.isActive('link')}
          icon={LinkIcon}
          tooltip="链接"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          icon={TableIcon}
          tooltip="插入表格"
        />
        <BubbleButton 
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          tooltip="分隔线"
        />
        
        <BubbleSeparator />
        
        <BubbleButton
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          icon={Eraser}
          tooltip="清除格式"
        />
      </div>
    </BubbleMenu>
  );
};

export { BubbleBar, SimpleBubbleBar, BubbleButton, BubbleSeparator };
export type { IconComponent, BubbleBarProps };