// improved-markdown-utils.js
const TurndownService = require('turndown');
const MarkdownIt = require('markdown-it');

// Create MarkdownIt instance
const markdownIt = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
});

// Create TurndownService instance
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*'
});

// Improved table cell handling
turndownService.addRule('tableCell', {
  filter: ['th', 'td'],
  replacement: function(content, node) {
    // Remove additional newlines from content to keep cells on one line
    const cleanContent = content.replace(/\n+/g, ' ').trim();
    
    // Determine if this is the first cell in a row (needs opening pipe)
    const index = Array.from(node.parentNode.childNodes)
      .filter(n => n.nodeType === 1) // Only consider element nodes
      .indexOf(node);
    
    // Only add a pipe prefix for the first cell, other cells will be properly
    // formatted in the table row handler
    const prefix = index === 0 ? '| ' : '';
    return prefix + cleanContent + ' |';
  }
});

// Improved table row handling
turndownService.addRule('tableRow', {
  filter: 'tr',
  replacement: function(content, node) {
    // Ensure the row is properly formatted with pipes
    const formattedContent = content.trim();
    
    // Return the content without adding newline (newlines will be added in the table handler)
    return formattedContent;
  }
});

// Completely revamped table handling
turndownService.addRule('table', {
  filter: function(node) {
    return node.nodeName === 'TABLE';
  },
  replacement: function(content, node) {
    if (!content.trim()) return '';
    
    // Get all rows from the table
    const rows = Array.from(node.querySelectorAll('tr'));
    if (rows.length === 0) return '';
    
    const tableRows = [];
    
    // Process each row to ensure proper pipe formatting
    rows.forEach((row, rowIndex) => {
      // Get all cells in this row
      const cells = Array.from(row.querySelectorAll('th, td'));
      if (cells.length === 0) return;
      
      let rowContent = '|';
      
      // Process each cell in the row
      cells.forEach(cell => {
        // Extract text content and clean it
        let cellContent = cell.textContent.replace(/\n+/g, ' ').trim();
        // Format the cell with proper spacing
        rowContent += ` ${cellContent} |`;
      });
      
      tableRows.push(rowContent);
      
      // If this is the first row, add a separator row
      if (rowIndex === 0) {
        let separatorRow = '|';
        cells.forEach(() => {
          separatorRow += ' --- |';
        });
        tableRows.push(separatorRow);
      }
    });
    
    // Join all rows with newlines and add spacing before and after the table
    return '\n\n' + tableRows.join('\n') + '\n\n';
  }
});

// Handle strong/bold text
turndownService.addRule('strong', {
  filter: ['strong', 'b'],
  replacement: function(content) {
    return '**' + content + '**';
  }
});

// Enhanced image handling
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

// Handle code blocks better
turndownService.addRule('codeBlock', {
  filter: function(node) {
    return (
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    );
  },
  replacement: function(content, node) {
    const language = node.firstChild.getAttribute('class') || '';
    const languageMatch = language.match(/language-(\w+)/);
    const languageStr = languageMatch ? languageMatch[1] : '';
    const code = node.firstChild.textContent || '';
    
    return `\n\`\`\`${languageStr}\n${code}\n\`\`\`\n\n`;
  }
});

// Improve paragraph handling inside table cells
turndownService.addRule('tableCellParagraphs', {
  filter: function(node) {
    return (
      node.nodeName === 'P' && 
      node.parentNode && 
      (node.parentNode.nodeName === 'TD' || node.parentNode.nodeName === 'TH')
    );
  },
  replacement: function(content, node) {
    // In table cells, we want paragraphs to be separated by spaces, not newlines
    return content + ' ';
  }
});

// Handle lists better
turndownService.addRule('list', {
  filter: ['ul', 'ol'],
  replacement: function(content, node) {
    const parent = node.parentNode;
    const isNested = parent.nodeName === 'LI';
    
    return (isNested ? '\n' : '\n\n') + content + (isNested ? '' : '\n\n');
  }
});

// Markdown to HTML
function markdownToHtml(markdown) {
  if (!markdown) return '';
  return markdownIt.render(markdown);
}

// HTML to Markdown
function htmlToMarkdown(html) {
  if (!html) return '';
  
  // Clean up the HTML to ensure it's well-formed
  // This can help with issues like unclosed tags
  const cleanHtml = html
    .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
    .replace(/\s+/g, ' '); // Normalize whitespace
  
  return turndownService.turndown(cleanHtml);
}

// Helper function to check if a markdown table is valid
function isValidMarkdownTable(markdown) {
  if (!markdown) return false;
  
  const lines = markdown.split('\n').filter(line => line.trim());
  if (lines.length < 3) return false; // Need at least header, separator, and one data row
  
  // Check if each line starts and ends with |
  const hasProperPipes = lines.every(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|');
  });
  
  // Check if second line is a separator
  const secondLine = lines[1].trim();
  const isSeparator = /^\|(\s*[-:]+\s*\|)+$/.test(secondLine);
  
  return hasProperPipes && isSeparator;
}

module.exports = {
  markdownToHtml,
  htmlToMarkdown,
  isValidMarkdownTable
};