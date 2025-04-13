import React, { useState, useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import TextareaAutosize from 'react-textarea-autosize';
// import { preprocessMarkdown } from './preprocess_tool';
// 定义组件接收的 props 类型
interface MarkdownEditorProps {
  content: string;                         // 初始内容
  onChange?: (content: string) => void;    // 内容变化回调
  readOnly?: boolean;                      // 是否只读模式
  isStreaming?: boolean;                   // 是否流式更新内容
  className?: string;                      // 自定义 className
  maxHeight?: string | number;             // 最大高度
  minHeight?: string | number;             // 最小高度
  maxWidth?: string | number;              // 最大宽度
  minWidth?: string | number;              // 最小宽度
}

// Markdown 编辑器组件
const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  readOnly = false,
  isStreaming = false,
  className = '',
  maxHeight,
  minHeight = '100px', // 默认最小高度
  maxWidth,
  minWidth,
}) => {
  // 编辑器内部的 Markdown 状态
  const [markdown, setMarkdown] = useState(content);
  // 是否处于编辑模式（只读时默认为 false）
  const [isEditing, setIsEditing] = useState(!readOnly);
  // 预览容器的引用，用于动态插入 HTML
  const previewRef = useRef<HTMLDivElement>(null);


  // ----- 创建 markdown-it 实例，配置语法高亮  -----
  const md = useRef(new MarkdownIt({
    html: true,             // 允许 HTML 标签
    linkify: true,          // 自动识别链接
    typographer: true,      // 启用排版优化

    // 配置语法高亮 - 可使用 highlight.js 插件， 但目前只是自定义了一个基础格式 
    // 从文本中识别代码块是在Markdown-it内部实现的，不是靠hightlight， hightlight是用来定义了代码块的样式 
    // 所以下面的str 是代码块的文本， language 是代码块的语言 
    highlight: function (str, language) {
      // 返回高亮的 HTML 字符串（可集成 highlight.js）
      return `<pre class="language-${language}"><code>${str}</code></pre>`;
    }
  }));

  // 如果外部传入的 content 变化，则更新 markdown 内容（适用于流式输出或外部修改）
  useEffect(() => {
    if (isStreaming || content !== markdown) {
      // setMarkdown(preprocessMarkdown(content));
      setMarkdown(content);
    }
  }, [content, isStreaming, markdown]);



  // ----- 当处于预览状态时，渲染 markdown 为 HTML  -----
  useEffect(() => {
    // 如果预览区的DOM元素已经挂载，并且处于 非编辑 状态 （即预览状态）
    if (previewRef.current && !isEditing) {
      // 使用 markdown-it 渲染 HTML  (渲染在这里发生)
      console.log("Editor 渲染前的 markdown:", markdown);
      previewRef.current.innerHTML = md.current.render(markdown);

      // 以上的渲染，在代码上会像如下：
      // <pre><code class="language-js">const a = 1;</code></pre>
      // 这样不够，因为很多代码高亮样式依赖的是 <pre> 上的类名。 
      // 所以需要给所有代码块的父级元素<pre>添加 language 类名，确保样式生效, 即以下代码块的作用：

      // 通过querySelectorAll 获取所有代码块
      const codeBlocks = previewRef.current.querySelectorAll('pre code');

      // 遍历所有代码块
      codeBlocks.forEach((block) => {
        // 获取代码块的父级元素
        const parent = block.parentNode as HTMLElement;
        // 如果父级元素存在，并且没有 language 类名，则添加 language 类 名
        if (parent && parent.className.indexOf('language-') === -1) {
          // 获取代码块的语言类名
          const match = block.className.match(/language-(\w+)/);
          // 如果匹配到语言类名，则添加到父级元素上
          if (match) {
            parent.classList.add(`language-${match[1]}`);
          }
        }
      });
    }
  }, [markdown, isEditing]);  // markdown内容变化时，或者 预览模式发生变化时，都要触发重新渲染。

  // 进入编辑模式（前提是非只读）
  const handleEdit = () => {
    if (readOnly) return;
    setIsEditing(true);
  };

  // 保存编辑内容并退出编辑模式
  const handleSave = () => {
    setIsEditing(false);
    // onChange是父组件传入的回调函数, 从上面props的定义看，这个参数是可选的，只有父组件有传入这个参数，才会触发这个回调函数
    if (onChange) {
      // 通过回调函数向父组件传入 markdown 内容 
      onChange(markdown); // 触发内容变化回调
    }
  };

  // 编辑过程中 textarea 内容变化时更新 state
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(e.target.value);
  };

  // 构建容器样式
  const containerStyle: React.CSSProperties = {
    maxHeight: maxHeight !== undefined ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
    minHeight: minHeight !== undefined ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight) : undefined,
    maxWidth: maxWidth !== undefined ? (typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth) : undefined,
    minWidth: minWidth !== undefined ? (typeof minWidth === 'number' ? `${minWidth}px` : minWidth) : undefined,
   // 注意：最外层不设置滚动，由内层内容区块控制滚动
  };

  // 内容区最大高度计算，预留按钮区高度 50px
  const contentMaxHeight = maxHeight
    ? `calc(${typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight} - 50px)`
    : undefined;

  // 预览区最小高度计算，预留按钮区高度 50px
  const previewMinHeight = minHeight !== undefined ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight) : '100px';

  
  return (
    <div //最外层不添加滚动，由内层内容区块控制滚动 
      className={`border border-gray-200 rounded-md overflow-hidden bg-white ${className}`}
                // 边框， 圆角， 溢出隐藏， 背景色 
      style={containerStyle}
    >
      <div className="w-full flex flex-col h-full">
        {/* 主内容区域：可滚动 */}
        <div className="flex-grow overflow-auto" style={{ maxHeight: contentMaxHeight }}>
          {/* 条件渲染： 编辑模式和预览模式，精准控制*/}
          {isEditing ? (
            <TextareaAutosize  // 内部已经有minRows属性，所以这里不需要再设置minHeight 
              value={markdown}
              onChange={handleChange}
              className="w-full p-4 border-none resize-none font-mono text-sm leading-relaxed outline-none"
              minRows={5}
              placeholder="输入 Markdown 内容..."
            />
          ) : (
            <div // 预览模式用div构建，不像 TextareaAutosize 那样可以自动调整高度, 所以这里添加minHeight,避免它坍缩成一个很小的区域。
              ref={previewRef}
              className="prose prose-sm max-w-none p-4 markdown-preview"
              style={{ minHeight: previewMinHeight}}
              onClick={!readOnly ? handleEdit : undefined}
            />
          )}
        </div>

        {/* 底部按钮区 */}
        {isEditing || !readOnly ? (
          <div className="flex justify-end p-2 bg-gray-50 border-t border-gray-200">
            <button
              onClick={isEditing ? handleSave : handleEdit}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              {isEditing ? '保存' : '编辑'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MarkdownEditor;
