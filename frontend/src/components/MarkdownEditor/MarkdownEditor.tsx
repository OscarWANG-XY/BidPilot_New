import React, { useState, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import TextareaAutosize from 'react-textarea-autosize';

interface MarkdownEditorProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  streamingContent?: boolean;
  className?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  readOnly = false,
  streamingContent = false,
  className = '',
}) => {
  const [markdown, setMarkdown] = useState(content);
  const [isEditing, setIsEditing] = useState(!readOnly);
  const previewRef = useRef<HTMLDivElement>(null);
  const md = useRef(new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
      return `<pre class="language-${lang}"><code>${str}</code></pre>`;
    }
  }));

  useEffect(() => {
    if (streamingContent || content !== markdown) {
      setMarkdown(content);
    }
  }, [content, streamingContent, markdown]);

  useEffect(() => {
    if (previewRef.current && !isEditing) {
      previewRef.current.innerHTML = md.current.render(markdown);
      
      // 为所有代码块添加语言类
      const codeBlocks = previewRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        const parent = block.parentNode as HTMLElement;
        if (parent && parent.className.indexOf('language-') === -1) {
          const match = block.className.match(/language-(\w+)/);
          if (match) {
            parent.classList.add(`language-${match[1]}`);
          }
        }
      });
    }
  }, [markdown, isEditing]);

  const handleEdit = () => {
    if (readOnly) return;
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onChange) {
      onChange(markdown);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
  };

  return (
    <div className={`border border-gray-200 rounded-md overflow-hidden bg-white ${className}`}>
      {isEditing ? (
        <div className="w-full">
          <TextareaAutosize
            value={markdown}
            onChange={handleChange}
            className="w-full p-4 border-none resize-none font-mono text-sm leading-relaxed outline-none"
            minRows={5}
            placeholder="输入 Markdown 内容..."
          />
          <div className="flex justify-end p-2 bg-gray-50 border-t border-gray-200">
            <button 
              onClick={handleSave} 
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <div 
            ref={previewRef} 
            className="prose prose-sm max-w-none p-4 min-h-[100px] markdown-preview"
            onClick={!readOnly ? handleEdit : undefined}
          />
          {!readOnly && (
            <div className="flex justify-end p-2 bg-gray-50 border-t border-gray-200">
              <button 
                onClick={handleEdit} 
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                编辑
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
