// 引入所有需要的扩展
const { Editor } = require('@tiptap/core');
const StarterKit = require('@tiptap/starter-kit').default;
const Table = require('@tiptap/extension-table').default;
const TableRow = require('@tiptap/extension-table-row').default;
const TableCell = require('@tiptap/extension-table-cell').default;
const TableHeader = require('@tiptap/extension-table-header').default;
const Image = require('@tiptap/extension-image').default;
const Link = require('@tiptap/extension-link').default;
const TextAlign = require('@tiptap/extension-text-align').default;
const Highlight = require('@tiptap/extension-highlight').default;
const Typography = require('@tiptap/extension-typography').default;
const Underline = require('@tiptap/extension-underline').default;
const Subscript = require('@tiptap/extension-subscript').default;
const Superscript = require('@tiptap/extension-superscript').default;


// 添加 JSDOM 来提供 DOM 环境
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

// 设置全局浏览器类环境
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;


// 创建Tiptap编辑器实例及其扩展
function createEditor() {
  return new Editor({
    extensions: [
      // 基础工具包
      StarterKit.configure({
        // 可以在这里配置StarterKit中的各个扩展
      }),
      
      // 表格相关扩展
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      
      // 图片扩展
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'docx-image',
        },
      }),
      
      // 链接扩展
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      
      // 文本对齐扩展
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      
      // 高亮扩展
      Highlight.configure({
        multicolor: true,
      }),
      
      // 排版增强扩展
      Typography,
      
      // 格式扩展
      Underline,
      Subscript,
      Superscript,
    ],
    editable: false,  // 由于这是服务器端，我们不需要编辑功能
    injectCSS: false, // 不要尝试注入 CSS
  });
}

module.exports = { createEditor };