// markdown-utils.js
const TurndownService = require('turndown');
const MarkdownIt = require('markdown-it');

// 创建MarkdownIt实例
const markdownIt = new MarkdownIt({
  html: true,         // 启用HTML标签
  breaks: true,       // 转换换行符为<br>
  linkify: true,      // 自动检测链接并转换为链接
  typographer: true   // 启用一些语言中性的替换和引号
});

// 创建TurndownService实例
const turndownService = new TurndownService({
  headingStyle: 'atx', // ## 风格的标题
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*'
});

// 增强turndown以支持表格
turndownService.addRule('tableCell', {
  filter: ['th', 'td'],
  replacement: function(content, node) {
    return cell(content, node);
  }
});

turndownService.addRule('table', {
  filter: function(node) {
    return node.nodeName === 'TABLE';
  },
  replacement: function(content) {
    // 如果内容为空，不转换
    if (!content.trim()) return '';
    
    // 分割行
    const rows = content.trim().split('\n');
    
    // 处理表头
    if (rows.length > 0) {
      const headerRow = rows[0];
      const delimiter = headerRow.replace(/[^|]/g, '-');
      rows.splice(1, 0, delimiter);
    }
    
    return '\n\n' + rows.join('\n') + '\n\n';
  }
});

// 辅助函数：处理表格单元格
function cell(content, node) {
  const index = Array.from(node.parentNode.childNodes).indexOf(node);
  let prefix = ' ';
  if (index === 0) prefix = '| ';
  return prefix + content + ' |';
}

// 增强处理图像
turndownService.addRule('image', {
  filter: 'img',
  replacement: function(content, node) {
    const alt = node.alt || '';
    let src = node.getAttribute('src') || '';
    const title = node.title || '';
    const titlePart = title ? ` "${title}"` : '';
    return `![${alt}](${src}${titlePart})`;
  }
});

// Markdown转HTML
function markdownToHtml(markdown) {
  if (!markdown) return '';
  return markdownIt.render(markdown);
}

// HTML转Markdown
function htmlToMarkdown(html) {
  if (!html) return '';
  return turndownService.turndown(html);
}

module.exports = {
  markdownToHtml,
  htmlToMarkdown
};