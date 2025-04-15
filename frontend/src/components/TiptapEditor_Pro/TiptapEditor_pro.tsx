import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { getHierarchicalIndexes, TableOfContents } from '@tiptap-pro/extension-table-of-contents';
import { MemorizedToC } from './ToC';


// 示例内容，你可以替换成自己的内容
const sampleContent = `
<h1>第一章：引言</h1>
<p>这是引言部分的内容...</p>

<h2>1.1 背景</h2>
<p>这是背景部分的内容...</p>

<h2>1.2 目标</h2>
<p>这是目标部分的内容...</p>

<h1>第二章：方法</h1>
<p>这是方法部分的内容...</p>

<h2>2.1 研究方法</h2>
<p>这是研究方法部分的内容...</p>

<h3>2.1.1 数据收集</h3>
<p>这是数据收集部分的内容...</p>

<h3>2.1.2 数据分析</h3>
<p>这是数据分析部分的内容...</p>

<h2>2.2 实验设计</h2>
<p>这是实验设计部分的内容...</p>

<h1>第三章：结论</h1>
<p>这是结论部分的内容...</p>
`;


const TiptapEditor: React.FC = () => {

  const [tocItems, setTocItems] = useState<any[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        onUpdate(content) {
          setTocItems(content);
        },
      }),
    ],
    content: sampleContent,
  })

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* 目录部分 */}
      <div className="w-full md:w-1/4 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">目录</h2>
        <div className="border border-gray-200 rounded bg-white">
          <MemorizedToC editor={editor} items={tocItems} />
        </div>
      </div>
      
      {/* 编辑器部分 */}
      <div className="w-full md:w-3/4">
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <EditorContent 
            editor={editor} 
            className="prose max-w-none p-4 min-h-[500px] focus:outline-none" 
          />
        </div>
      </div>
    </div>
  );
};

export default TiptapEditor