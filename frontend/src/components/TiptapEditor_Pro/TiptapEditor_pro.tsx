import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// starterkit包含:
// nodes: Document, Blockquote, CodeBlock, HardBreak, Heading, HorizontalRule, ListItem, OrderedList, Paragraph, Text,
// Marks:  Bold, Code, Italic, Strike
// 扩展: Dropcursor, Gapcursor, History

import TextAlign from '@tiptap/extension-text-align';
import Heading from '@tiptap/extension-heading';  //覆盖starterkit中的配置
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



const sampleContent = {"type": "doc", "content": [{"type": "heading", "attrs": {"textAlign": "left", "level": 1}, "content": [{"type": "text", "text": "\ud83d\udea8 A\u7ea7\uff1a\u6295\u6807\u51b3\u7b56\u5fc5\u9700\u4fe1\u606f"}]}, {"type": "table", "content": [{"type": "tableRow", "content": [{"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "\u5e8f\u53f7"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "\u4fe1\u606f\u7c7b\u522b"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "\u5177\u4f53\u5185\u5bb9"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "\u6240\u5728\u7ae0\u8282"}]}]}, {"type": "tableHeader", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "\u5206\u6790\u8fdb\u5c55"}]}]}]}, {"type": "tableRow", "content": [{"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "A1"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "\u23f0 \u65f6\u95f4\u8282\u70b9"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "\u6295\u6807\u622a\u6b62\u65f6\u95f4/\u5f00\u6807\u65f6\u95f4"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}]}, {"type": "tableRow", "content": [{"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "A2"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "\ud83d\udcb0 \u4fdd\u8bc1\u91d1"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}, "content": [{"type": "text", "text": "\u6295\u6807\u4fdd\u8bc1\u91d1\u91d1\u989d/\u7f34\u7eb3\u65b9\u5f0f"}]}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}, {"type": "tableCell", "attrs": {"colspan": 1, "rowspan": 1, "colwidth": null}, "content": [{"type": "paragraph", "attrs": {"textAlign": "left"}}]}]}]}, {"type": "horizontalRule"}]};

const limit = 280;


const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
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
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
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
      // 移除任何手动添加的 DragHandle 扩展
      
    ],
    content: sampleContent,
    editorProps: {
      attributes: {
        // 暂时移除自定义类名，使用默认的 ProseMirror 类
        class: 'tiptap-content focus:outline-none',
        //class: 'focus:outline-none',
      },
    },
  });

  // 字数统计
  const percentage = editor
  ? Math.round((100 / limit) * editor.storage.characterCount.characters())
  : 0


  // 粘贴图片
  const handlePaste = async (event: React.ClipboardEvent) => {
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

  // 拖拽放置图片
  const handleDrop = async (event: React.DragEvent) => {
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

  // 阻止默认拖拽行为
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault()
  }


  const toggleEditable = () => {
    editor?.setEditable(!editor.isEditable)
    editor?.view.dispatch(editor.view.state.tr)
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div>
        <button onClick={toggleEditable}>Toggle editable</button>
      </div>
      <h1 className="mb-6 text-3xl font-semibold text-gray-900 dark:text-gray-50">Tiptap Editor</h1>
      
      {editor && (
        <DragHandle editor={editor}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
        </DragHandle>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-800">
        {/* 编辑器内容区域 */}
        <div 
          onPaste={handlePaste} 
          onDrop={handleDrop} 
          onDragOver={handleDragOver} 
          onDragEnter={handleDragEnter} 
          className="min-h-[400px] bg-white p-4 dark:bg-gray-950"
        >
          <EditorContent editor={editor} />
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
  );
};

export default TiptapEditor;